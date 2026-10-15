from database.db import get_connection
from models.event_model import add_care_event

def get_all_appointments(parent_id=None):
    """Fetch appointments, optionally filtered by parent_id."""
    conn = get_connection()
    cursor = conn.cursor()
    if parent_id:
        cursor.execute("""
        SELECT a.*, p.full_name as parent_name 
        FROM appointments a
        JOIN parents p ON a.parent_id = p.id
        WHERE a.parent_id = ?
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
        """, (parent_id,))
    else:
        cursor.execute("""
        SELECT a.*, p.full_name as parent_name 
        FROM appointments a
        JOIN parents p ON a.parent_id = p.id
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
        """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def create_appointment(parent_id, doctor_name, hospital_clinic, appointment_date, appointment_time, purpose, status="Upcoming"):
    """Create a new appointment and record timeline event."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO appointments (parent_id, doctor_name, hospital_clinic, appointment_date, appointment_time, purpose, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (parent_id, doctor_name, hospital_clinic, appointment_date, appointment_time, purpose, status))
    appt_id = cursor.lastrowid
    conn.commit()
    conn.close()

    # Log to Timeline Events
    add_care_event(
        parent_id=parent_id,
        event_type="Appointment",
        title=f"Appointment Scheduled: {doctor_name}",
        description=f"Clinic: {hospital_clinic}, Date: {appointment_date} {appointment_time}. Purpose: {purpose}",
        timestamp=f"{appointment_date} {appointment_time}",
        status=status
    )
    return appt_id

def update_appointment_status(appointment_id, new_status):
    """Update appointment status and log event."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM appointments WHERE id = ?", (appointment_id,))
    appt = cursor.fetchone()
    if not appt:
        conn.close()
        return False

    cursor.execute("UPDATE appointments SET status = ? WHERE id = ?", (new_status, appointment_id))
    conn.commit()
    conn.close()

    # Log status update to timeline
    add_care_event(
        parent_id=appt['parent_id'],
        event_type="Appointment",
        title=f"Appointment Status Updated to {new_status}",
        description=f"Doctor: {appt['doctor_name']} ({appt['hospital_clinic']})",
        timestamp=f"{appt['appointment_date']} {appt['appointment_time']}",
        status=new_status
    )
    return True
