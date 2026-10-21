# ParentCare360 — Data Engineering Subsystem

## Architectural Overview

The ParentCare360 data engineering pipeline is decoupled into an event-driven 4-stage micro-DAG architecture with Airflow Datasets and a Dead Letter Queue (DLQ).

```
[Raw Sources: CSVs, Sensor Pings, Audio NLP Transcripts]
                      │
                      ▼
        [DAG 1: Telemetry & Ingestion]
        • Batch UUID injection (_batch_id)
        • Field normalization & timestamps
                      │
                      ▼
        [DAG 2: Cleansing & DLQ Engine]
        • Tier 1: ISO-8601 regex & non-null
        • Tier 2: Referential FK validation
        • Tier 3: Physiological bounds (HR/BP)
        • Tier 4: Sliding SHA-256 deduplication
           ├── Corrupted Rows ──> [quarantine_records (DLQ)]
           └── Valid Rows     ──> [Atomic Relational Tables (WAL)]
                                        │
                                        ▼ Dataset Signal: 'clean_events'
        [DAG 3: Deterministic Alert Engine]
        • Rule 1: Overdue Caregiver Visits
        • Rule 2: 48-Hour Upcoming Doctor Appts
        • Rule 3: High-Priority Unresolved Repairs
        • Rule 4: Elder Inactivity Watchdog (8h)
        • Sliding-Window SHA-256 deduplication cache
                      │
                      ▼
        [DAG 4: Role-Based Alert Dispatcher]
        • RBAC/ABAC privacy boundaries
        • PII masking on operational caregiver feeds
        • Escalation routing to family coordinators
```

## Subsystem Navigation

1. **[ingestion/](ingestion/README.md)**: Telemetry Ingest (DAG 1), Batch UUID injection, field normalization. Source code: `dags/dag_telemetry_ingest.py`.
2. **[cleansing/](cleansing/README.md)**: 4-Tier validation filters, referential checks. Source code: `dags/dag_cleansing_dlq.py`.
3. **[quarantine/](quarantine/README.md)**: Dead Letter Queue (DLQ) containment, error taxonomy. Target table: `quarantine_records`.
4. **[orchestration/](orchestration/README.md)**: Inter-DAG pipeline coordinator and edge-case simulator. Source code: `dags/orchestrator.py`.
5. **[alert-engine/](alert-engine/README.md)**: Deterministic alert evaluation and sliding SHA-256 deduplication. Source code: `dags/dag_alert_engine.py`.
6. **[schemas/](schemas/README.md)**: Data models, payload structures, W3C PROV lineage attributes. Source code: `models/`.

## Running Pipeline Verification

Execute the deterministic edge-case test suite:
```bash
python3 -m pytest tests/test_deterministic_dags.py -v
```
