import time
from datetime import datetime
from dags.dag_telemetry_ingest import run_telemetry_ingest
from dags.dag_cleansing_dlq import run_cleansing_dlq
from dags.dag_alert_engine import run_alert_engine
from dags.dag_dispatcher import run_dispatcher

def run_orchestrated_pipeline(synthetic_stream: list = None, reference_time: datetime = None):
    """
    ParentCare360 Pipeline Orchestrator (Inter-DAG Coordinator)
    Simulates production Airflow orchestration linking 4 decoupled micro-DAGs:
    1. Ingestion DAG (Telemetry & CSV extraction)
    2. Cleansing & DLQ DAG (4-tier validation, routing corrupt records to DLQ)
    3. Alert Engine DAG (Rule evaluation, hash deduplication)
    4. Dispatcher DAG (Role-based access-controlled notification routing)
    """
    start_time = time.time()
    orchestration_log = []

    # Step 1: Execute DAG 1 (Telemetry Ingestion)
    t0 = time.time()
    ingest_result = run_telemetry_ingest(synthetic_stream=synthetic_stream)
    ingest_dur = time.time() - t0
    batch_id = ingest_result["batch_id"]
    orchestration_log.append({
        "dag": "dag_telemetry_ingest",
        "status": "SUCCESS",
        "duration_sec": round(ingest_dur, 4),
        "details": f"Batch {batch_id}: Ingested {len(ingest_result['appointments'])} appts, {len(ingest_result['requests'])} reqs, {len(ingest_result['vitals_stream'])} vitals."
    })

    # Step 2: Trigger DAG 2 (Cleansing, Multi-Tier Validation & DLQ)
    # Trigger mechanism: Inter-DAG Trigger / Data-Aware scheduling
    t1 = time.time()
    cleansing_result = run_cleansing_dlq(ingest_result)
    cleansing_dur = time.time() - t1
    orchestration_log.append({
        "dag": "dag_cleansing_dlq",
        "status": "SUCCESS",
        "duration_sec": round(cleansing_dur, 4),
        "details": f"Loaded {cleansing_result['total_clean_loaded']} clean records. Quarantined {cleansing_result['quarantined_records']} records to DLQ."
    })

    # Step 3: Trigger DAG 3 (Stateful Alert Engine)
    # Trigger mechanism: Triggered upon Dataset update ("dataset://parentcare/clean_events")
    t2 = time.time()
    alert_result = run_alert_engine(reference_time=reference_time)
    alert_dur = time.time() - t2
    orchestration_log.append({
        "dag": "dag_alert_engine",
        "status": "SUCCESS",
        "duration_sec": round(alert_dur, 4),
        "details": f"Emitted {alert_result['new_alerts_emitted']} new alerts. Suppressed {alert_result['duplicate_alerts_suppressed']} duplicates via hash cache."
    })

    # Step 4: Trigger DAG 4 (Role-Based Dispatcher)
    t3 = time.time()
    dispatch_result = run_dispatcher(alerts_to_dispatch=alert_result["alerts"] if alert_result["alerts"] else None)
    dispatch_dur = time.time() - t3
    orchestration_log.append({
        "dag": "dag_dispatcher",
        "status": "SUCCESS",
        "duration_sec": round(dispatch_dur, 4),
        "details": f"Dispatched {dispatch_result['dispatched_count']} role-filtered alerts across Family, Caregiver, and Parent channels."
    })

    total_duration = time.time() - start_time

    return {
        "status": "COMPLETED",
        "batch_id": batch_id,
        "total_duration_sec": round(total_duration, 4),
        "orchestration_log": orchestration_log,
        "summary": {
            "clean_records_loaded": cleansing_result["total_clean_loaded"],
            "dlq_quarantined": cleansing_result["quarantined_records"],
            "new_alerts": alert_result["new_alerts_emitted"],
            "suppressed_duplicate_alerts": alert_result["duplicate_alerts_suppressed"],
            "notifications_dispatched": dispatch_result["dispatched_count"]
        }
    }

if __name__ == "__main__":
    res = run_orchestrated_pipeline()
    import json
    print(json.dumps(res, indent=2))
