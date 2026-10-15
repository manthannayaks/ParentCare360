from datetime import datetime
from database.db import get_connection
from models.event_model import add_care_event

def get_all_alerts(parent_id=None, include_resolved=False):
    """Fetch system alerts, optionally filtered by parent_id."""
    conn = get_connection()
    cursor = conn.cursor()
    query = """
    SELECT a.*, p.full_name as parent_name
    FROM alerts a
    JOIN parents p ON a.parent_id = p.id
    """
    params = []

    conditions = []
    if parent_id:
        conditions.append("a.parent_id = ?")
        params.append(parent_id)
    if not include_resolved:
        conditions.append("a.is_resolved = 0")

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY a.created_at DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def create_alert(parent_id, alert_type, message, severity="Warning"):
    """Create alert if duplicate active alert does not exist."""
    conn = get_connection()
    cursor = conn.cursor()

    # Check for existing unresolved alert with same parent and message
    cursor.execute("""
    SELECT id FROM alerts 
    WHERE parent_id = ? AND alert_type = ? AND message = ? AND is_resolved = 0
    """, (parent_id, alert_type, message))
    existing = cursor.fetchone()

    if existing:
        conn.close()
        return existing['id']

    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    INSERT INTO alerts (parent_id, alert_type, message, severity, is_resolved, created_at)
    VALUES (?, ?, ?, ?, 0, ?)
    """, (parent_id, alert_type, message, severity, created_at))
    alert_id = cursor.lastrowid
    conn.commit()
    conn.close()

    # Log to care timeline
    add_care_event(
        parent_id=parent_id,
        event_type="Alert",
        title=f"Alert Generated [{severity}]: {alert_type}",
        description=message,
        timestamp=created_at,
        status="Active"
    )
    return alert_id

def resolve_alert(alert_id):
    """Mark alert as resolved."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,))
    alert = cursor.fetchone()
    if not alert:
        conn.close()
        return False

    cursor.execute("UPDATE alerts SET is_resolved = 1 WHERE id = ?", (alert_id,))
    conn.commit()
    conn.close()

    now_ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    add_care_event(
        parent_id=alert['parent_id'],
        event_type="Alert",
        title=f"Alert Resolved: {alert['alert_type']}",
        description=alert['message'],
        timestamp=now_ts,
        status="Resolved"
    )
    return True
