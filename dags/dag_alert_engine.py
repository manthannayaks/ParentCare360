import hashlib
from datetime import datetime, timedelta
from database.db import get_connection

def compute_dedup_hash(parent_id: int, alert_type: str, time_bucket_minutes: int = 15, current_dt: datetime = None) -> str:
    """
    Computes a deterministic sliding-window hash signature for an alert event.
    Prevents alarm flapping and duplicate flood storms.
    """
    if current_dt is None:
        current_dt = datetime.now()
    # Bucket timestamps to current window
    minute_bucket = (current_dt.minute // time_bucket_minutes) * time_bucket_minutes
    bucket_str = f"{current_dt.strftime('%Y-%m-%d %H')}:{minute_bucket:02d}"
    raw_sig = f"{parent_id}|{alert_type}|{bucket_str}"
    return hashlib.sha256(raw_sig.encode("utf-8")).hexdigest()

def emit_alert_with_dedup(cursor, parent_id: int, alert_type: str, message: str, severity: str, current_dt: datetime = None) -> tuple:
    """
    Emits an alert if not already seen in the sliding-window dedup cache.
    Returns (created: bool, alert_id: int or None)
    """
    if current_dt is None:
        current_dt = datetime.now()
    now_str = current_dt.strftime("%Y-%m-%d %H:%M:%S")
    h = compute_dedup_hash(parent_id, alert_type, current_dt=current_dt)

    # Check dedup cache
    cursor.execute("SELECT occurrence_count FROM alert_dedup_cache WHERE dedup_hash = ?", (h,))
    row = cursor.fetchone()

    if row:
        # Suppress duplicate alert, increment occurrence count
        new_count = row["occurrence_count"] + 1
        cursor.execute("UPDATE alert_dedup_cache SET occurrence_count = ?, last_seen = ? WHERE dedup_hash = ?", (new_count, now_str, h))
        return (False, None, new_count)
    else:
        # Record new dedup signature
        cursor.execute("""
        INSERT INTO alert_dedup_cache (dedup_hash, parent_id, alert_type, first_seen, last_seen, occurrence_count)
        VALUES (?, ?, ?, ?, ?, 1)
        """, (h, parent_id, alert_type, now_str, now_str))

        # Insert new active alert
        cursor.execute("""
        INSERT INTO alerts (parent_id, alert_type, message, severity, is_resolved, created_at)
        VALUES (?, ?, ?, ?, 0, ?)
        """, (parent_id, alert_type, message, severity, now_str))
        alert_id = cursor.lastrowid

        # Also log to timeline care_events
        cursor.execute("""
        INSERT INTO care_events (parent_id, event_type, title, description, timestamp, status)
        VALUES (?, 'Alert', ?, ?, ?, ?)
        """, (parent_id, f"[{severity.upper()}] {alert_type}", message, now_str, severity))

        return (True, alert_id, 1)

def run_alert_engine(reference_time: datetime = None, inactivity_threshold_hours: float = 4.0):
    """
    DAG 3: Deterministic Rule-Based Alert Engine
    Scans operational tables, evaluates stateful rules, and applies deduplication.
    Allows passing reference_time for deterministic reproducible testing.
    """
    if reference_time is None:
        reference_time = datetime.now()

    ref_str = reference_time.strftime("%Y-%m-%d %H:%M:%S")
    conn = get_connection()
    cursor = conn.cursor()

    summary = {
        "evaluation_timestamp": ref_str,
        "new_alerts_emitted": 0,
        "duplicate_alerts_suppressed": 0,
        "alerts": []
    }

    # -------------------------------------------------------------
    # Rule 1: Overdue Caregiver Visits (Scheduled time passed)
    # -------------------------------------------------------------
    cursor.execute("""
    SELECT v.*, p.full_name as parent_name, c.full_name as caregiver_name
    FROM caregiver_visits v
    JOIN parents p ON v.parent_id = p.id
    JOIN caregivers c ON v.caregiver_id = c.id
    WHERE v.status = 'Scheduled' AND v.scheduled_datetime < ?
    """, (ref_str,))
    for visit in cursor.fetchall():
        msg = f"Caregiver visit by {visit['caregiver_name']} for {visit['parent_name']} scheduled at {visit['scheduled_datetime']} is OVERDUE."
        created, aid, count = emit_alert_with_dedup(
            cursor, visit['parent_id'], "Caregiver Visit Overdue", msg, "Critical", reference_time
        )
        if created:
            summary["new_alerts_emitted"] += 1
            summary["alerts"].append({"id": aid, "parent_id": visit['parent_id'], "alert_type": "Caregiver Visit Overdue", "severity": "Critical", "message": msg})
        else:
            summary["duplicate_alerts_suppressed"] += 1

    # -------------------------------------------------------------
    # Rule 2: Upcoming Healthcare Appointments (Lookahead window 48h)
    # -------------------------------------------------------------
    lookahead_date = (reference_time + timedelta(days=2)).strftime("%Y-%m-%d")
    cursor.execute("""
    SELECT a.*, p.full_name as parent_name
    FROM appointments a
    JOIN parents p ON a.parent_id = p.id
    WHERE a.status = 'Upcoming' AND a.appointment_date <= ?
    """, (lookahead_date,))
    for appt in cursor.fetchall():
        msg = f"Upcoming doctor visit with {appt['doctor_name']} ({appt['hospital_clinic']}) on {appt['appointment_date']} at {appt['appointment_time']} for {appt['parent_name']}."
        created, aid, count = emit_alert_with_dedup(
            cursor, appt['parent_id'], "Upcoming Appointment", msg, "Info", reference_time
        )
        if created:
            summary["new_alerts_emitted"] += 1
            summary["alerts"].append({"id": aid, "parent_id": appt['parent_id'], "alert_type": "Upcoming Appointment", "severity": "Info", "message": msg})
        else:
            summary["duplicate_alerts_suppressed"] += 1

    # -------------------------------------------------------------
    # Rule 3: High Priority Household Requests Unresolved
    # -------------------------------------------------------------
    cursor.execute("""
    SELECT r.*, p.full_name as parent_name
    FROM household_requests r
    JOIN parents p ON r.parent_id = p.id
    WHERE r.priority IN ('High', 'Critical') AND r.status IN ('Pending', 'In Progress')
    """)
    for req in cursor.fetchall():
        msg = f"High-priority request '{req['title']}' ({req['category']}) for {req['parent_name']} is {req['status']}."
        created, aid, count = emit_alert_with_dedup(
            cursor, req['parent_id'], "High-Priority Request Pending", msg, "Warning", reference_time
        )
        if created:
            summary["new_alerts_emitted"] += 1
            summary["alerts"].append({"id": aid, "parent_id": req['parent_id'], "alert_type": "High-Priority Request Pending", "severity": "Warning", "message": msg})
        else:
            summary["duplicate_alerts_suppressed"] += 1

    # -------------------------------------------------------------
    # Rule 4: Inactivity Watchdog / Dead-Man Emergency Switch
    # Detects prolonged absence of telemetry (> inactivity_threshold_hours)
    # -------------------------------------------------------------
    cursor.execute("SELECT id, full_name, last_heartbeat FROM parents WHERE last_heartbeat IS NOT NULL")
    for parent in cursor.fetchall():
        try:
            last_hb_dt = datetime.fromisoformat(parent["last_heartbeat"])
            diff_hours = (reference_time - last_hb_dt).total_seconds() / 3600.0
            if diff_hours >= inactivity_threshold_hours:
                msg = f"EMERGENCY: No telemetry or check-in detected from {parent['full_name']} for {diff_hours:.1f} hours (Threshold: {inactivity_threshold_hours}h)."
                created, aid, count = emit_alert_with_dedup(
                    cursor, parent["id"], "Inactivity Watchdog Timeout", msg, "Critical", reference_time
                )
                if created:
                    summary["new_alerts_emitted"] += 1
                    summary["alerts"].append({"id": aid, "parent_id": parent["id"], "alert_type": "Inactivity Watchdog Timeout", "severity": "Critical", "message": msg})
                else:
                    summary["duplicate_alerts_suppressed"] += 1
        except Exception:
            pass

    conn.commit()
    conn.close()
    return summary

if __name__ == "__main__":
    res = run_alert_engine()
    print("Alert Engine Result:", res)
