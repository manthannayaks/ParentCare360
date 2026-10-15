from database.db import get_connection

def add_care_event(parent_id, event_type, title, description, timestamp, status):
    """Insert a new event into unified care timeline."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO care_events (parent_id, event_type, title, description, timestamp, status)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (parent_id, event_type, title, description, timestamp, status))
    event_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return event_id

def get_care_events(parent_id=None, limit=50):
    """Fetch care events sorted chronologically (newest first)."""
    conn = get_connection()
    cursor = conn.cursor()
    if parent_id:
        cursor.execute("""
        SELECT e.*, p.full_name as parent_name
        FROM care_events e
        JOIN parents p ON e.parent_id = p.id
        WHERE e.parent_id = ?
        ORDER BY e.timestamp DESC
        LIMIT ?
        """, (parent_id, limit))
    else:
        cursor.execute("""
        SELECT e.*, p.full_name as parent_name
        FROM care_events e
        JOIN parents p ON e.parent_id = p.id
        ORDER BY e.timestamp DESC
        LIMIT ?
        """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
