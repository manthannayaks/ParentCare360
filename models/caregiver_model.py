from datetime import datetime
from database.db import get_connection
from models.event_model import add_care_event

def get_all_caregivers():
    """Fetch list of caregivers."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM caregivers ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def add_caregiver(full_name, phone, role, city):
    """Add a new caregiver."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO caregivers (full_name, phone, role, city)
    VALUES (?, ?, ?, ?)
    """, (full_name, phone, role, city))
    cg_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return cg_id

def get_all_visits(parent_id=None):
    """Fetch caregiver visits, with caregiver and parent details."""
    conn = get_connection()
    cursor = conn.cursor()
    if parent_id:
        cursor.execute("""
        SELECT v.*, p.full_name as parent_name, c.full_name as caregiver_name, c.role as caregiver_role
        FROM caregiver_visits v
        JOIN parents p ON v.parent_id = p.id
        JOIN caregivers c ON v.caregiver_id = c.id
        WHERE v.parent_id = ?
        ORDER BY v.scheduled_datetime DESC
        """, (parent_id,))
    else:
        cursor.execute("""
        SELECT v.*, p.full_name as parent_name, c.full_name as caregiver_name, c.role as caregiver_role
        FROM caregiver_visits v
        JOIN parents p ON v.parent_id = p.id
        JOIN caregivers c ON v.caregiver_id = c.id
        ORDER BY v.scheduled_datetime DESC
        """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def schedule_visit(parent_id, caregiver_id, scheduled_datetime, visit_notes=""):
    """Schedule a caregiver visit and log event."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO caregiver_visits (parent_id, caregiver_id, scheduled_datetime, status, visit_notes)
    VALUES (?, ?, ?, 'Scheduled', ?)
    """, (parent_id, caregiver_id, scheduled_datetime, visit_notes))
    visit_id = cursor.lastrowid
    conn.commit()

    # Get caregiver name for timeline log
    cursor.execute("SELECT full_name FROM caregivers WHERE id = ?", (caregiver_id,))
    cg = cursor.fetchone()
    cg_name = cg['full_name'] if cg else "Caregiver"
    conn.close()

    add_care_event(
        parent_id=parent_id,
        event_type="Caregiver Visit",
        title=f"Visit Scheduled with {cg_name}",
        description=f"Scheduled for {scheduled_datetime}. Notes: {visit_notes}",
        timestamp=scheduled_datetime,
        status="Scheduled"
    )
    return visit_id

def update_visit_status(visit_id, status, actual_completion_datetime=None, visit_notes=None):
    """Update visit status ('Completed' or 'Missed') and log event."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT v.*, c.full_name as caregiver_name 
    FROM caregiver_visits v
    JOIN caregivers c ON v.caregiver_id = c.id
    WHERE v.id = ?
    """, (visit_id,))
    visit = cursor.fetchone()
    if not visit:
        conn.close()
        return False

    if actual_completion_datetime is None and status == 'Completed':
        actual_completion_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    final_notes = visit_notes if visit_notes is not None else visit['visit_notes']

    cursor.execute("""
    UPDATE caregiver_visits 
    SET status = ?, actual_completion_datetime = ?, visit_notes = ?
    WHERE id = ?
    """, (status, actual_completion_datetime, final_notes, visit_id))
    conn.commit()
    conn.close()

    ts = actual_completion_datetime if actual_completion_datetime else visit['scheduled_datetime']

    add_care_event(
        parent_id=visit['parent_id'],
        event_type="Caregiver Visit",
        title=f"Caregiver Visit {status} ({visit['caregiver_name']})",
        description=f"Notes: {final_notes}",
        timestamp=ts,
        status=status
    )
    return True
