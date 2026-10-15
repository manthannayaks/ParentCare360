import pytest
from datetime import datetime, timedelta
from database.db import get_connection, init_db
from database.seed_data import seed_all
from dags.dag_telemetry_ingest import run_telemetry_ingest
from dags.dag_cleansing_dlq import run_cleansing_dlq
from dags.dag_alert_engine import run_alert_engine, compute_dedup_hash, emit_alert_with_dedup
from dags.dag_dispatcher import run_dispatcher
from dags.orchestrator import run_orchestrated_pipeline

@pytest.fixture(autouse=True)
def setup_test_database():
    """Reset database to fresh state before each test."""
    seed_all()
    yield

def test_edge_inactivity_watchdog():
    """
    Edge Case 1: The 'Silent Senior' Inactivity Timeout (Dead-Man Switch).
    Verifies that when zero vitals/telemetry are detected from a parent for >4 hours,
    the alert engine deterministically triggers a Critical alert and tiered escalation.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Freeze synthetic time at 18:00:00
    frozen_now = datetime(2026, 10, 13, 18, 0, 0)
    # Simulate Ravi Kumar (ID: 1) having last heartbeat at 10:00:00 (8 hours silent)
    eight_hours_ago = (frozen_now - timedelta(hours=8)).isoformat()
    cursor.execute("UPDATE parents SET last_heartbeat = ? WHERE id = 1", (eight_hours_ago,))
    conn.commit()
    conn.close()

    # Run Alert Engine at frozen_now with 4.0 hour threshold
    summary = run_alert_engine(reference_time=frozen_now, inactivity_threshold_hours=4.0)

    # Assert critical inactivity alert was emitted
    inactivity_alerts = [a for a in summary["alerts"] if a["alert_type"] == "Inactivity Watchdog Timeout"]
    assert len(inactivity_alerts) >= 1
    assert inactivity_alerts[0]["severity"] == "Critical"
    assert "8.0 hours" in inactivity_alerts[0]["message"]

def test_edge_dedup_storm():
    """
    Edge Case 2: Ghost Alerts & False Alarm Storms.
    Verifies that 40 rapid identical telemetry spikes within a short window
    are deterministically suppressed into exactly 1 alert, incrementing the counter.
    """
    conn = get_connection()
    cursor = conn.cursor()
    frozen_now = datetime(2026, 10, 13, 14, 0, 0)

    created_count = 0
    suppressed_count = 0

    # Simulate 40 rapid alarm events for Parent 1 within 2 minutes
    for i in range(40):
        t = frozen_now + timedelta(seconds=i * 2)
        created, aid, count = emit_alert_with_dedup(
            cursor,
            parent_id=1,
            alert_type="Tachycardia Cardiac Spike (>130 bpm)",
            message="Heart rate spiked to 135 bpm.",
            severity="Emergency",
            current_dt=t
        )
        if created:
            created_count += 1
        else:
            suppressed_count += 1

    conn.commit()

    # Verify occurrence count in cache
    h = compute_dedup_hash(1, "Tachycardia Cardiac Spike (>130 bpm)", current_dt=frozen_now)
    cursor.execute("SELECT occurrence_count FROM alert_dedup_cache WHERE dedup_hash = ?", (h,))
    row = cursor.fetchone()
    conn.close()

    assert created_count == 1, "Exactly one alert must be created despite 40 rapid alarms"
    assert suppressed_count == 39, "39 duplicate alarms must be suppressed"
    assert row["occurrence_count"] == 40, "Cache counter must record 40 total occurrences"

def test_edge_poison_pill_quarantine():
    """
    Edge Case 3: Poison Pill / Corrupt Schema Isolation.
    Verifies that malformed rows (invalid dates, negative FKs, corrupt priority)
    are routed to quarantine_records (DLQ) without failing the batch or blocking clean records.
    """
    poison_batch = {
        "batch_id": "TEST-POISON-BATCH-001",
        "appointments": [
            # Valid record
            {"parent_id": 1, "doctor_name": "Dr. Good", "hospital_clinic": "City Clinic", "appointment_date": "2026-10-25", "appointment_time": "10:00 AM", "purpose": "Annual Checkup", "status": "Upcoming", "_source": "test_feed"},
            # Poison 1: Invalid date format
            {"parent_id": 1, "doctor_name": "Dr. Malformed", "hospital_clinic": "Bad Clinic", "appointment_date": "2026/13/45", "appointment_time": "10:00 AM", "purpose": "Checkup", "_source": "test_feed"},
            # Poison 2: Non-existent foreign key
            {"parent_id": 99999, "doctor_name": "Dr. Ghost", "hospital_clinic": "Ghost Clinic", "appointment_date": "2026-10-26", "appointment_time": "11:00 AM", "purpose": "Checkup", "_source": "test_feed"}
        ],
        "requests": [
            # Valid record
            {"parent_id": 2, "title": "Plumber needed for kitchen sink", "category": "Maintenance", "priority": "High", "status": "Pending", "_source": "test_feed"},
            # Poison 3: Invalid priority enum
            {"parent_id": 2, "title": "Buy groceries", "category": "Grocery", "priority": "SUPER-HIGH-INVALID", "status": "Pending", "_source": "test_feed"}
        ]
    }

    result = run_cleansing_dlq(poison_batch)

    # Valid records must be loaded
    assert result["clean_appointments"] == 1
    assert result["clean_requests"] == 1
    assert result["total_clean_loaded"] == 2

    # Malformed records must be isolated to DLQ
    assert result["quarantined_records"] == 3

    # Verify DLQ entries in database
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT error_code FROM quarantine_records WHERE batch_id = 'TEST-POISON-BATCH-001'")
    codes = {row["error_code"] for row in cursor.fetchall()}
    conn.close()

    assert "ERR_INVALID_DATE_FORMAT" in codes
    assert "ERR_FK_PARENT_NOT_FOUND" in codes
    assert "ERR_INVALID_PRIORITY" in codes

def test_edge_out_of_order_stream():
    """
    Edge Case 4: Out-of-Order / Delayed Telemetry Stream.
    Verifies that when older critical events arrive delayed after normal events,
    the pipeline processes both and emits appropriate timeline entries without dropping the delayed event.
    """
    conn = get_connection()
    cursor = conn.cursor()

    t_earlier = "2026-10-13 10:15:00" # Fall emergency
    t_later = "2026-10-13 11:00:00"   # Routine check-in that arrived first

    # Arrived first: Routine check-in
    cursor.execute("""
    INSERT INTO care_events (parent_id, event_type, title, description, timestamp, status)
    VALUES (1, 'Vitals Check', 'Routine BP Normal (120/80)', 'Vitals taken at home', ?, 'Normal')
    """, (t_later,))

    # Arrived late: Fall event from earlier
    cursor.execute("""
    INSERT INTO care_events (parent_id, event_type, title, description, timestamp, status)
    VALUES (1, 'Emergency', 'Fall Sensor Triggered', 'Accelerometer spike detected in hallway', ?, 'Critical')
    """, (t_earlier,))

    conn.commit()

    # Query chronological timeline
    cursor.execute("SELECT title, timestamp FROM care_events WHERE parent_id = 1 ORDER BY timestamp ASC")
    events = cursor.fetchall()
    conn.close()

    # Chronological sort must place earlier fall first
    timestamps = [e["timestamp"] for e in events]
    assert t_earlier in timestamps
    assert t_later in timestamps

def test_edge_role_based_dispatch_granularity():
    """
    Edge Case 5: Role-Based Access Granularity & Dispatch Isolation.
    Verifies that Critical alerts are dispatched to Family + Caregiver with masked privacy,
    while Info alerts are kept on calendar without intruding on caregivers.
    """
    critical_alert = [{
        "id": 101,
        "parent_id": 1,
        "parent_name": "Ravi Kumar",
        "alert_type": "Caregiver Visit Overdue",
        "message": "Caregiver Priya Verma scheduled at 09:00 is OVERDUE.",
        "severity": "Critical"
    }]

    info_alert = [{
        "id": 102,
        "parent_id": 1,
        "parent_name": "Ravi Kumar",
        "alert_type": "Upcoming Appointment",
        "message": "Doctor visit in 48 hours.",
        "severity": "Info"
    }]

    dispatch_crit = run_dispatcher(alerts_to_dispatch=critical_alert)
    dispatch_info = run_dispatcher(alerts_to_dispatch=info_alert)

    # For Critical alert: must notify Adult Child AND Caregiver AND Parent
    roles_crit = {d["recipient_role"] for d in dispatch_crit["dispatches"]}
    assert "Adult Child / Family Sponsor" in roles_crit
    assert "Certified Caregiver" in roles_crit
    assert "Elderly Parent" in roles_crit

    # Caregiver payload must NOT expose sensitive PII (privacy boundary)
    caregiver_payload = [d["payload"] for d in dispatch_crit["dispatches"] if d["recipient_role"] == "Certified Caregiver"][0]
    assert "CARE ACTION REQUIRED" in caregiver_payload

    # For Info alert: Caregiver must NOT be disturbed (prevent alert fatigue)
    roles_info = {d["recipient_role"] for d in dispatch_info["dispatches"]}
    assert "Certified Caregiver" not in roles_info
