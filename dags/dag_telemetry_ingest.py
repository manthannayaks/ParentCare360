import os
import uuid
from datetime import datetime
import pandas as pd
from config import RAW_DATA_DIR

def run_telemetry_ingest(batch_id: str = None, synthetic_stream: list = None):
    """
    DAG 1: Telemetry & Feed Ingestion Engine
    Ingests external CSV feeds, IoT mock payloads, and manual updates.
    Assigns batch metadata and normalizes column headers.
    """
    if not batch_id:
        batch_id = f"BATCH-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"

    ingested_feeds = {
        "batch_id": batch_id,
        "timestamp": datetime.now().isoformat(),
        "appointments": [],
        "requests": [],
        "vitals_stream": []
    }

    # 1. Ingest Appointments CSV
    appts_path = os.path.join(RAW_DATA_DIR, "raw_appointments.csv")
    if os.path.exists(appts_path):
        df_appts = pd.read_csv(appts_path)
        df_appts["_batch_id"] = batch_id
        df_appts["_source"] = "raw_appointments.csv"
        ingested_feeds["appointments"] = df_appts.to_dict(orient="records")

    # 2. Ingest Household Requests CSV
    reqs_path = os.path.join(RAW_DATA_DIR, "raw_requests.csv")
    if os.path.exists(reqs_path):
        df_reqs = pd.read_csv(reqs_path)
        df_reqs["_batch_id"] = batch_id
        df_reqs["_source"] = "raw_requests.csv"
        ingested_feeds["requests"] = df_reqs.to_dict(orient="records")

    # 3. Ingest Dynamic / Synthetic Stream if provided
    if synthetic_stream:
        for record in synthetic_stream:
            record["_batch_id"] = batch_id
            record["_source"] = record.get("_source", "synthetic_stream")
            feed_type = record.get("feed_type", "vitals_stream")
            if feed_type in ingested_feeds:
                ingested_feeds[feed_type].append(record)
            else:
                ingested_feeds["vitals_stream"].append(record)

    return ingested_feeds

if __name__ == "__main__":
    result = run_telemetry_ingest()
    print(f"Ingest DAG completed for Batch {result['batch_id']}. Extracted {len(result['appointments'])} appointments, {len(result['requests'])} requests.")
