from datetime import datetime
from database.db import get_connection

def run_dispatcher(alerts_to_dispatch: list = None):
    """
    DAG 4: Role-Based Granular Alert Dispatcher
    Enforces privacy boundaries and dispatches notifications according to user granularity.
    - Critical / Emergency -> Immediate Push to Adult Child + SMS to Primary Family Sponsor
    - Overdue Caregiver -> Caregiver Push + Family notification
    - Info / Warning -> App notification banner (low intrusiveness)
    """
    conn = get_connection()
    cursor = conn.cursor()

    if alerts_to_dispatch is None:
        # Fetch active unresolved alerts
        cursor.execute("""
        SELECT a.*, p.full_name as parent_name, p.emergency_contact
        FROM alerts a
        JOIN parents p ON a.parent_id = p.id
        WHERE a.is_resolved = 0
        ORDER BY a.id DESC LIMIT 20
        """)
        alerts_to_dispatch = [dict(row) for row in cursor.fetchall()]

    dispatch_log = []

    for alert in alerts_to_dispatch:
        pid = alert["parent_id"]
        sev = alert.get("severity", "Info")
        atype = alert.get("alert_type", "General")
        msg = alert.get("message", "")

        # 1. Fetch family sponsor contacts for this parent
        cursor.execute("SELECT full_name, phone, relationship FROM family_members WHERE parent_id = ?", (pid,))
        family = cursor.fetchall()

        # 2. Fetch assigned caregiver for today if visit-related
        cursor.execute("""
        SELECT c.full_name, c.phone, c.role
        FROM caregiver_visits v
        JOIN caregivers c ON v.caregiver_id = c.id
        WHERE v.parent_id = ?
        LIMIT 1
        """, (pid,))
        caregiver = cursor.fetchone()

        # Granular Routing Rules:
        if sev in ["Critical", "Emergency"]:
            # Route to Family with high-priority SMS/Push
            for f in family:
                dispatch_log.append({
                    "alert_id": alert.get("id"),
                    "recipient_role": "Adult Child / Family Sponsor",
                    "recipient_name": f["full_name"],
                    "recipient_channel": "Push Notification & SMS",
                    "destination": f["phone"],
                    "payload": f"URGENT: {msg}",
                    "status": "SENT"
                })
            # Route to Caregiver if assigned (Operational alert with masked privacy)
            if caregiver:
                dispatch_log.append({
                    "alert_id": alert.get("id"),
                    "recipient_role": "Certified Caregiver",
                    "recipient_name": caregiver["full_name"],
                    "recipient_channel": "Caregiver Task Alert",
                    "destination": caregiver["phone"],
                    "payload": f"CARE ACTION REQUIRED: Immediate check-in requested for Parent #{pid}.",
                    "status": "SENT"
                })
            # Route to Parent: Simplified voice banner
            dispatch_log.append({
                "alert_id": alert.get("id"),
                "recipient_role": "Elderly Parent",
                "recipient_name": alert.get("parent_name", f"Parent {pid}"),
                "recipient_channel": "Tablet Audio Banner",
                "destination": "Local Device Speaker",
                "payload": "Kripya dhyan dein: Parivaar ko suchit kar diya gaya hai.",
                "status": "PLAYED"
            })

        elif sev == "Warning":
            for f in family:
                dispatch_log.append({
                    "alert_id": alert.get("id"),
                    "recipient_role": "Adult Child / Family Sponsor",
                    "recipient_name": f["full_name"],
                    "recipient_channel": "In-App Push Feed",
                    "destination": f["phone"],
                    "payload": msg,
                    "status": "SENT"
                })

        else: # Info
            dispatch_log.append({
                "alert_id": alert.get("id"),
                "recipient_role": "Family & Parent",
                "recipient_name": "Shared Care Circle",
                "recipient_channel": "Calendar Notification",
                "destination": "In-App Feed",
                "payload": msg,
                "status": "QUEUED"
            })

    conn.close()
    return {
        "dispatched_count": len(dispatch_log),
        "dispatches": dispatch_log
    }

if __name__ == "__main__":
    res = run_dispatcher()
    print(f"Dispatcher DAG completed: {res['dispatched_count']} role-tailored notifications routed.")
