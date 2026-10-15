import pandas as pd
from etl.extract import extract_raw_csv
from etl.validate import validate_records
from etl.transform import transform_records
from etl.load import load_records

def run_etl_pipeline():
    """
    Executes complete ETL Pipeline: Extract -> Validate -> Transform -> Load
    Returns dictionary with execution summary statistics.
    """
    summary = {
        "status": "Success",
        "processed_files": [],
        "total_extracted": 0,
        "total_valid": 0,
        "total_invalid": 0,
        "total_loaded": 0,
        "errors": []
    }

    # Pipeline Job 1: Raw Appointments
    try:
        df_raw_appts = extract_raw_csv("raw_appointments.csv")
        summary["total_extracted"] += len(df_raw_appts)

        valid_appts, error_appts = validate_records(df_raw_appts, "appointments")
        summary["total_valid"] += len(valid_appts)
        summary["total_invalid"] += len(error_appts)

        if not error_appts.empty:
            summary["errors"].extend(error_appts.to_dict(orient="records"))

        clean_appts = transform_records(valid_appts, "appointments")
        loaded_count = load_records(clean_appts, "appointments")
        summary["total_loaded"] += loaded_count
        summary["processed_files"].append("raw_appointments.csv")

    except Exception as e:
        summary["errors"].append({"file": "raw_appointments.csv", "error": str(e)})

    # Pipeline Job 2: Raw Household Requests
    try:
        df_raw_reqs = extract_raw_csv("raw_requests.csv")
        summary["total_extracted"] += len(df_raw_reqs)

        valid_reqs, error_reqs = validate_records(df_raw_reqs, "requests")
        summary["total_valid"] += len(valid_reqs)
        summary["total_invalid"] += len(error_reqs)

        if not error_reqs.empty:
            summary["errors"].extend(error_reqs.to_dict(orient="records"))

        clean_reqs = transform_records(valid_reqs, "requests")
        loaded_count_reqs = load_records(clean_reqs, "requests")
        summary["total_loaded"] += loaded_count_reqs
        summary["processed_files"].append("raw_requests.csv")

    except Exception as e:
        summary["errors"].append({"file": "raw_requests.csv", "error": str(e)})

    return summary

if __name__ == "__main__":
    res = run_etl_pipeline()
    print("ETL Pipeline Result:", res)
