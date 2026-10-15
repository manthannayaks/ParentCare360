from datetime import datetime
from database.db import get_connection
from models.event_model import add_care_event

def get_all_requests(parent_id=None):
    """Fetch household requests, optionally filtered by parent_id."""
    conn = get_connection()
    cursor = conn.cursor()
    if parent_id:
        cursor.execute("""
        SELECT r.*, p.full_name as parent_name
        FROM household_requests r
        JOIN parents p ON r.parent_id = p.id
        WHERE r.parent_id = ?
        ORDER BY r.created_at DESC
        """, (parent_id,))
    else:
        cursor.execute("""
        SELECT r.*, p.full_name as parent_name
        FROM household_requests r
        JOIN parents p ON r.parent_id = p.id
        ORDER BY r.created_at DESC
        """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def create_household_request(parent_id, title, category, priority="Medium", notes="", status="Pending"):
    """Create a new household request and log timeline event."""
    conn = get_connection()
    cursor = conn.cursor()
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    INSERT INTO household_requests (parent_id, title, category, priority, status, created_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (parent_id, title, category, priority, status, created_at, notes))
    req_id = cursor.lastrowid
    conn.commit()
    conn.close()

    add_care_event(
        parent_id=parent_id,
        event_type="Household Request",
        title=f"Request Created: {title}",
        description=f"Category: {category}, Priority: {priority}. Notes: {notes}",
        timestamp=created_at,
        status=status
    )
    return req_id

def update_request_status(request_id, new_status, notes=None):
    """Update household request status ('Pending' -> 'In Progress' -> 'Completed')."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM household_requests WHERE id = ?", (request_id,))
    req = cursor.fetchone()
    if not req:
        conn.close()
        return False

    final_notes = notes if notes is not None else req['notes']
    cursor.execute("""
    UPDATE household_requests 
    SET status = ?, notes = ?
    WHERE id = ?
    """, (new_status, final_notes, request_id))
    conn.commit()
    conn.close()

    now_ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    add_care_event(
        parent_id=req['parent_id'],
        event_type="Household Request",
        title=f"Household Request {new_status}: {req['title']}",
        description=f"Category: {req['category']}, Priority: {req['priority']}",
        timestamp=now_ts,
        status=new_status
    )
    return True
