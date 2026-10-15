import json
import re
from datetime import datetime
from database.db import get_connection

def validate_and_cleanse_record(record: dict, record_type: str, valid_parent_ids: set):
    """
    4-Tier Validation Engine:
    Tier 1: Syntactic Check (Required fields, non-null, date format)
    Tier 2: Referential Integrity (Foreign key parent_id check)
    Tier 3: Semantic & Domain Rules (Status enums, priority bounds)
    Tier 4: Deduplication is handled prior to atomic insert
    """
    errors = []

    # --- Tier 1 & 2: Parent ID & Referential Check ---
    parent_id = record.get("parent_id")
    if parent_id is None or parent_id == "":
        errors.append(("ERR_NULL_PARENT_ID", "Missing required field: parent_id"))
    else:
        try:
            pid = int(parent_id)
            if pid not in valid_parent_ids:
                errors.append(("ERR_FK_PARENT_NOT_FOUND", f"Foreign key parent_id '{pid}' does not exist in parents table"))
        except (ValueError, TypeError):
            errors.append(("ERR_INVALID_PARENT_ID_TYPE", f"parent_id '{parent_id}' is not an integer"))

    # --- Specific Record Type Checks ---
    if record_type == "appointments":
        # Tier 1: Doctor name
        if not record.get("doctor_name") or str(record.get("doctor_name")).strip() == "":
            errors.append(("ERR_MISSING_DOCTOR", "doctor_name cannot be empty"))

        # Tier 1 & 3: Date format check
        appt_date = str(record.get("appointment_date", "")).strip()
        date_pattern = r"^\d{4}-\d{2}-\d{2}$"
        if not re.match(date_pattern, appt_date):
            errors.append(("ERR_INVALID_DATE_FORMAT", f"appointment_date '{appt_date}' does not match ISO-8601 YYYY-MM-DD"))
        else:
            try:
                datetime.strptime(appt_date, "%Y-%m-%d")
            except ValueError:
                errors.append(("ERR_INVALID_CALENDAR_DATE", f"appointment_date '{appt_date}' is not a real calendar date"))

        # Tier 3: Purpose length
        if not record.get("purpose"):
            errors.append(("ERR_MISSING_PURPOSE", "Appointment purpose must be specified"))

    elif record_type == "requests":
        # Tier 1: Title
        if not record.get("title") or str(record.get("title")).strip() == "":
            errors.append(("ERR_MISSING_TITLE", "Request title cannot be empty"))

        # Tier 3: Priority enum check
        priority = str(record.get("priority", "Medium")).strip().capitalize()
        if priority not in ["Low", "Medium", "High", "Critical"]:
            errors.append(("ERR_INVALID_PRIORITY", f"Invalid priority '{record.get('priority')}'. Must be Low, Medium, High, or Critical"))

        # Tier 3: Category enum check
        valid_cats = ["Maintenance", "Grocery", "Utility", "Emergency", "Medical", "General"]
        cat = str(record.get("category", "General")).strip().capitalize()
        if cat not in valid_cats:
            errors.append(("ERR_INVALID_CATEGORY", f"Invalid category '{record.get('category')}'. Must be one of {valid_cats}"))

    return errors

def run_cleansing_dlq(ingested_data: dict):
    """
    DAG 2: Cleansing, Multi-Tier Validation & Dead Letter Queue (DLQ) Engine.
    Routes invalid records to quarantine_records and clean records to DB tables.
    """
    batch_id = ingested_data.get("batch_id", "UNKNOWN-BATCH")
    conn = get_connection()
    cursor = conn.cursor()

    # Pre-fetch valid parent IDs for Tier 2 referential check
    cursor.execute("SELECT id FROM parents")
    valid_parent_ids = {row["id"] for row in cursor.fetchall()}

    quarantined_count = 0
    clean_loaded_count = 0
    now_iso = datetime.now().isoformat()

    results = {
        "batch_id": batch_id,
        "clean_appointments": 0,
        "clean_requests": 0,
        "quarantined_records": 0,
        "dlq_details": []
    }

    # Process Appointments
    seen_appt_signatures = set()
    for raw in ingested_data.get("appointments", []):
        errors = validate_and_cleanse_record(raw, "appointments", valid_parent_ids)
        if errors:
            for code, msg in errors:
                cursor.execute("""
                INSERT INTO quarantine_records (batch_id, source_feed, record_payload, error_code, error_message, quarantined_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """, (batch_id, raw.get("_source", "raw_appointments.csv"), json.dumps(raw), code, msg, now_iso))
                quarantined_count += 1
                results["dlq_details"].append({"payload": raw, "code": code, "message": msg})
        else:
            # Tier 4: Deduplication check
            sig = (int(raw["parent_id"]), str(raw["doctor_name"]).strip(), str(raw["appointment_date"]).strip(), str(raw.get("appointment_time", "")).strip())
            if sig in seen_appt_signatures:
                cursor.execute("""
                INSERT INTO quarantine_records (batch_id, source_feed, record_payload, error_code, error_message, quarantined_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """, (batch_id, raw.get("_source", "raw_appointments.csv"), json.dumps(raw), "WARN_DUPLICATE_DROP", "Duplicate appointment signature dropped within batch", now_iso))
                quarantined_count += 1
                continue
            seen_appt_signatures.add(sig)

            # Insert Clean Record
            status = str(raw.get("status", "Upcoming")).capitalize()
            cursor.execute("""
            INSERT INTO appointments (parent_id, doctor_name, hospital_clinic, appointment_date, appointment_time, purpose, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                int(raw["parent_id"]),
                str(raw["doctor_name"]).strip(),
                str(raw.get("hospital_clinic", "General Clinic")).strip(),
                str(raw["appointment_date"]).strip(),
                str(raw.get("appointment_time", "10:00 AM")).strip(),
                str(raw.get("purpose", "General Checkup")).strip(),
                status
            ))
            clean_loaded_count += 1
            results["clean_appointments"] += 1

    # Process Household Requests
    seen_req_signatures = set()
    for raw in ingested_data.get("requests", []):
        errors = validate_and_cleanse_record(raw, "requests", valid_parent_ids)
        if errors:
            for code, msg in errors:
                cursor.execute("""
                INSERT INTO quarantine_records (batch_id, source_feed, record_payload, error_code, error_message, quarantined_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """, (batch_id, raw.get("_source", "raw_requests.csv"), json.dumps(raw), code, msg, now_iso))
                quarantined_count += 1
                results["dlq_details"].append({"payload": raw, "code": code, "message": msg})
        else:
            # Tier 4: Deduplication check
            sig = (int(raw["parent_id"]), str(raw["title"]).strip().lower())
            if sig in seen_req_signatures:
                cursor.execute("""
                INSERT INTO quarantine_records (batch_id, source_feed, record_payload, error_code, error_message, quarantined_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """, (batch_id, raw.get("_source", "raw_requests.csv"), json.dumps(raw), "WARN_DUPLICATE_DROP", "Duplicate request dropped within batch", now_iso))
                quarantined_count += 1
                continue
            seen_req_signatures.add(sig)

            priority = str(raw.get("priority", "Medium")).strip().capitalize()
            category = str(raw.get("category", "General")).strip().capitalize()
            status = str(raw.get("status", "Pending")).strip().capitalize()
            created_at = raw.get("created_at", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

            cursor.execute("""
            INSERT INTO household_requests (parent_id, title, category, priority, status, created_at, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                int(raw["parent_id"]),
                str(raw["title"]).strip(),
                category,
                priority,
                status,
                created_at,
                raw.get("notes", "")
            ))
            clean_loaded_count += 1
            results["clean_requests"] += 1

    conn.commit()
    conn.close()

    results["quarantined_records"] = quarantined_count
    results["total_clean_loaded"] = clean_loaded_count
    return results

if __name__ == "__main__":
    from dags.dag_telemetry_ingest import run_telemetry_ingest
    data = run_telemetry_ingest()
    res = run_cleansing_dlq(data)
    print("Cleansing & DLQ DAG Result:", res)
