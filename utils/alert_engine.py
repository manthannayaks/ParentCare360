from datetime import datetime
from database.db import get_connection
from models.alert_model import create_alert

def evaluate_automatic_alerts():
    """
    Scans system data and evaluates automated alert rules:
    Rule 1: Caregiver visit scheduled time passed & status != 'Completed' -> Overdue Visit Alert
    Rule 2: Appointment date is upcoming -> Upcoming Appointment Alert
    Rule 3: Household request with priority == 'High' and status == 'Pending' -> High Priority Request Alert
    """
    conn = get_connection()
    cursor = conn.cursor()
    generated_count = 0
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 1. Rule 1: Overdue Caregiver Visit
    cursor.execute("""
    SELECT v.*, p.full_name as parent_name, c.full_name as caregiver_name
    FROM caregiver_visits v
    JOIN parents p ON v.parent_id = p.id
    JOIN caregivers c ON v.caregiver_id = c.id
    WHERE v.status = 'Scheduled' AND v.scheduled_datetime < ?
    """, (now_str,))
    overdue_visits = cursor.fetchall()

    for visit in overdue_visits:
        msg = f"Caregiver visit by {visit['caregiver_name']} scheduled for {visit['scheduled_datetime']} is OVERDUE."
        create_alert(
            parent_id=visit['parent_id'],
            alert_type="Caregiver Visit Overdue",
            message=msg,
            severity="Critical"
        )
        generated_count += 1

    # 2. Rule 2: Upcoming Appointments
    cursor.execute("""
    SELECT a.*, p.full_name as parent_name
    FROM appointments a
    JOIN parents p ON a.parent_id = p.id
    WHERE a.status = 'Upcoming'
    """)
    upcoming_appts = cursor.fetchall()

    for appt in upcoming_appts:
        msg = f"Upcoming doctor appointment with {appt['doctor_name']} at {appt['hospital_clinic']} on {appt['appointment_date']} at {appt['appointment_time']}."
        create_alert(
            parent_id=appt['parent_id'],
            alert_type="Upcoming Appointment",
            message=msg,
            severity="Info"
        )
        generated_count += 1

    # 3. Rule 3: High Priority Household Request Pending
    cursor.execute("""
    SELECT r.*, p.full_name as parent_name
    FROM household_requests r
    JOIN parents p ON r.parent_id = p.id
    WHERE r.priority = 'High' AND r.status = 'Pending'
    """)
    pending_high_reqs = cursor.fetchall()

    for req in pending_high_reqs:
        msg = f"High-priority household request '{req['title']}' ({req['category']}) is PENDING resolution."
        create_alert(
            parent_id=req['parent_id'],
            alert_type="High-Priority Request Pending",
            message=msg,
            severity="Warning"
        )
        generated_count += 1

    conn.close()
    return generated_count

if __name__ == "__main__":
    count = evaluate_automatic_alerts()
    print(f"Evaluated alert engine: {count} active alerts evaluated/generated.")
