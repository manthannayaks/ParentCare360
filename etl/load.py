from database.db import get_connection
from models.event_model import add_care_event

def load_records(clean_df, entity_type="appointments"):
    """
    Load: Inserts transformed clean records into SQLite database.
    """
    if clean_df.empty:
        return 0

    inserted_count = 0

    if entity_type == "appointments":
        for _, row in clean_df.iterrows():
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO appointments (parent_id, doctor_name, hospital_clinic, appointment_date, appointment_time, purpose, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                int(row['parent_id']),
                str(row['doctor_name']),
                str(row['hospital_clinic']),
                str(row['appointment_date']),
                str(row['appointment_time']),
                str(row['purpose']),
                str(row['status'])
            ))
            conn.commit()
            conn.close()

            inserted_count += 1
            # Add timeline event
            add_care_event(
                parent_id=int(row['parent_id']),
                event_type="Appointment",
                title=f"ETL Ingested Appointment: {row['doctor_name']}",
                description=f"Clinic: {row['hospital_clinic']}, Purpose: {row['purpose']}",
                timestamp=f"{row['appointment_date']} {row['appointment_time']}",
                status=str(row['status'])
            )

    elif entity_type == "requests":
        for _, row in clean_df.iterrows():
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO household_requests (parent_id, title, category, priority, status, created_at, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                int(row['parent_id']),
                str(row['title']),
                str(row['category']),
                str(row['priority']),
                str(row['status']),
                str(row['created_at']),
                str(row.get('notes', 'Ingested via ETL'))
            ))
            conn.commit()
            conn.close()

            inserted_count += 1
            # Add timeline event
            add_care_event(
                parent_id=int(row['parent_id']),
                event_type="Household Request",
                title=f"ETL Ingested Request: {row['title']}",
                description=f"Category: {row['category']}, Priority: {row['priority']}",
                timestamp=str(row['created_at']),
                status=str(row['status'])
            )

    print(f"[ETL LOAD] Loaded {inserted_count} clean records into database for {entity_type}")
    return inserted_count
