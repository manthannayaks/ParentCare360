# Data Engineering — Inter-DAG Orchestration

**Source Module:** `dags/orchestrator.py`

## Micro-DAG Coordination Flow

ParentCare360 implements event-driven micro-DAG orchestration compatible with Apache Airflow Datasets:

1. `dag_telemetry_ingest` extracts and stages records with batch IDs.
2. `dag_cleansing_dlq` processes records. On committing valid rows, it produces the dataset event `clean_events`.
3. `dag_alert_engine` is scheduled upon `clean_events` dataset emission, scanning operational tables via composite B-Tree indexes.
4. `dag_dispatcher` consumes active alerts and executes role-based filtering (RBAC/ABAC).

## Programmatic Execution & Edge-Case Simulation
The orchestrator exposes programmatic entrypoints used by the test suite and API simulation endpoints:

```python
from dags.orchestrator import run_inter_dag_pipeline, simulate_edge_case

# Execute the complete 4-stage pipeline
result = run_inter_dag_pipeline()

# Inject controlled edge conditions
sim_res = simulate_edge_case("dedup_storm", parent_id=1)
```
