from database.db import get_connection
from models.event_model import add_care_event

def get_all_journeys(parent_id=None):
    """Fetch travel journeys."""
    conn = get_connection()
    cursor = conn.cursor()
    if parent_id:
        cursor.execute("""
        SELECT j.*, p.full_name as parent_name
        FROM travel_journeys j
        JOIN parents p ON j.parent_id = p.id
        WHERE j.parent_id = ?
        ORDER BY j.id DESC
        """, (parent_id,))
    else:
        cursor.execute("""
        SELECT j.*, p.full_name as parent_name
        FROM travel_journeys j
        JOIN parents p ON j.parent_id = p.id
        ORDER BY j.id DESC
        """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_journey_status(journey_id, status, current_location):
    """Update journey state: 'Scheduled' -> 'Departure' -> 'In Transit' -> 'Arrived'."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM travel_journeys WHERE id = ?", (journey_id,))
    j = cursor.fetchone()
    if not j:
        conn.close()
        return False

    cursor.execute("""
    UPDATE travel_journeys
    SET status = ?, current_location = ?
    WHERE id = ?
    """, (status, current_location, journey_id))
    conn.commit()
    conn.close()

    add_care_event(
        parent_id=j['parent_id'],
        event_type="Travel Journey",
        title=f"Travel Status: {status}",
        description=f"Route: {j['origin']} -> {j['destination']}. Current location: {current_location}",
        timestamp=j['departure_time'],
        status=status
    )
    return True
