import pandas as pd

def transform_records(valid_df, entity_type="appointments"):
    """
    Transform:
    - Standardizes text case (Title Case, Title Statuses)
    - Trims leading/trailing whitespace
    - Formats dates and strings cleanly
    """
    if valid_df.empty:
        return valid_df

    df = valid_df.copy()

    # Status standardization mapping
    status_map = {
        "upcoming": "Upcoming",
        "completed": "Completed",
        "cancelled": "Cancelled",
        "pending": "Pending",
        "in progress": "In Progress",
        "scheduled": "Scheduled",
        "missed": "Missed"
    }

    priority_map = {
        "low": "Low",
        "medium": "Medium",
        "high": "High"
    }

    if 'status' in df.columns:
        df['status'] = df['status'].astype(str).str.strip().str.lower().map(lambda s: status_map.get(s, s.capitalize()))

    if 'priority' in df.columns:
        df['priority'] = df['priority'].astype(str).str.strip().str.lower().map(lambda p: priority_map.get(p, p.capitalize()))

    if 'category' in df.columns:
        df['category'] = df['category'].astype(str).str.strip().str.title()

    if 'doctor_name' in df.columns:
        df['doctor_name'] = df['doctor_name'].astype(str).str.strip()

    if 'title' in df.columns:
        df['title'] = df['title'].astype(str).str.strip()

    print(f"[ETL TRANSFORM] Transformed {len(df)} records for {entity_type}")
    return df
