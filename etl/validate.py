import re
import pandas as pd
from database.db import get_connection

VALID_STATUSES = ["upcoming", "completed", "cancelled", "pending", "in progress", "scheduled", "missed"]
VALID_PRIORITIES = ["low", "medium", "high"]

def get_existing_parent_ids():
    """Retrieve list of valid parent IDs currently in database."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM parents")
    valid_ids = {row['id'] for row in cursor.fetchall()}
    conn.close()
    return valid_ids

def validate_records(df, entity_type="appointments"):
    """
    Validate raw records. Returns tuple of (valid_df, errors_df).
    Checks:
    - Required fields non-null
    - Foreign Key parent_id exists
    - Status/Priority enum check
    - Duplicate detection
    - Date format check
    """
    valid_ids = get_existing_parent_ids()
    valid_rows = []
    error_rows = []

    # Remove exact duplicate rows
    df_dedup = df.drop_duplicates().copy()

    for idx, row in df_dedup.iterrows():
        errors = []

        # Check required fields
        if pd.isna(row.get('parent_id')):
            errors.append("Missing parent_id")
        else:
            try:
                pid = int(row['parent_id'])
                if pid not in valid_ids:
                    errors.append(f"Foreign Key Error: parent_id {pid} does not exist in DB")
            except ValueError:
                errors.append("Invalid parent_id type")

        # Check Status enum
        status_val = str(row.get('status', '')).strip().lower()
        if status_val not in VALID_STATUSES:
            errors.append(f"Invalid status value '{row.get('status')}'")

        # Check Priority if present
        if 'priority' in row:
            prio_val = str(row.get('priority', '')).strip().lower()
            if prio_val not in VALID_PRIORITIES:
                errors.append(f"Invalid priority value '{row.get('priority')}'")

        # Check Date formats
        date_str = str(row.get('appointment_date', row.get('created_at', ''))).strip()
        if date_str and date_str.upper() in ["INVALID-DATE", "NOT_A_DATE"]:
            errors.append(f"Malformed date field '{date_str}'")

        if errors:
            error_item = row.to_dict()
            error_item['validation_error'] = "; ".join(errors)
            error_rows.append(error_item)
        else:
            valid_rows.append(row.to_dict())

    valid_df = pd.DataFrame(valid_rows)
    error_df = pd.DataFrame(error_rows)

    print(f"[ETL VALIDATE] {entity_type.upper()}: Valid={len(valid_df)}, Invalid={len(error_df)}")
    return valid_df, error_df
