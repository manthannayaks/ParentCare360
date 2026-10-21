# ParentCare360 — Data Engineering & Pipeline Specification

## 1. Pipeline Modularity & Decoupling Rationale

In early prototypes, data ingestion and alert evaluation ran within a single script. A downstream failure (e.g., notification network timeout) would block upstream data ingestion, creating telemetry loss. 

To solve this, ParentCare360 decomposes ingestion, cleansing, alerting, and dispatching into independent micro-DAGs linked via **data-aware scheduling (Apache Airflow Datasets)**:

```
[DAG 1: Telemetry Ingest] ➔ [DAG 2: Cleansing & DLQ] ➔ (clean_events Dataset) ➔ [DAG 3: Alert Engine] ➔ [DAG 4: Dispatcher]
```

## 2. Ingestion & Provenance Metadata (DAG 1)

Every incoming payload undergoes metadata enrichment in `dags/dag_telemetry_ingest.py`:

- `_batch_id`: Cryptographic UUID v4 generated upon arrival (`str(uuid.uuid4())`).
- `_ingested_at`: UTC arrival watermark (`datetime.utcnow().isoformat()`).
- `_source`: Origin source identifier (`raw_appointments.csv`, `iot_wearable_feed`, `voice_stt_transcription`).

This conforms to the **W3C PROV** standard, allowing every stored or quarantined record to be traced back to its raw batch.

## 3. Four-Tier Validation Engine & Dead Letter Queue (DAG 2)

Cleansing logic in `dags/dag_cleansing_dlq.py` evaluates four sequential verification tiers:

| Tier | Category | Validation Rule | Intercepted Failure Condition | Error Code |
| :---: | :--- | :--- | :--- | :---: |
| **Tier 1** | **Syntactic & Schema** | Strict ISO-8601 regex: `^\d{4}-\d{2}-\d{2}$`. Non-null checks on primary keys. | Malformed date strings (`INVALID-DATE`), missing required attributes. | `ERR_SYNTAX_DATE`, `ERR_SCHEMA_NULL` |
| **Tier 2** | **Referential Integrity** | Foreign key verification against live database (`parents.id`, `caregivers.id`). | Unregistered elder ID (e.g. `99999`), invalid caregiver reference. | `ERR_FK_NOT_FOUND` |
| **Tier 3** | **Semantic & Physiological** | Physiological boundary bounds: Heart rate (35–220 bpm), Systolic BP (70–240 mmHg). Valid priorities (`Low`, `Medium`, `High`, `Critical`). | Corrupted sensor reading (e.g. Heart rate = 999 bpm). | `ERR_SEMANTIC_BOUND` |
| **Tier 4** | **Sliding-Window Deduplication** | Entity composite key hash comparison against active batch cache. | Network retry flapped duplicate records within identical timestamp bucket. | `ERR_DUPLICATE_KEY` |

### Dead Letter Queue (`quarantine_records`)
Records failing Tiers 1–3 are isolated with zero data loss:

```sql
INSERT INTO quarantine_records (batch_id, source_feed, record_payload, error_code, error_message, quarantined_at)
VALUES (?, ?, ?, ?, ?, ?);
```

Valid rows are committed atomically to operational tables and emit the dataset signal `clean_events`.

## 4. Deterministic Alert Rules & Sliding-Window Dedup (DAG 3)

The alert engine in `dags/dag_alert_engine.py` runs upon `clean_events` dataset emission:

1. **Rule 1 — Overdue Caregiver Arrivals:**
   - Query: `WHERE status = 'Scheduled' AND scheduled_datetime < current_time`
   - Action: Emits Warning alert to family coordinators.
2. **Rule 2 — Upcoming Medical Appointments:**
   - Query: `WHERE status = 'Upcoming' AND appointment_date BETWEEN current_date AND current_date + 48h`
   - Action: Emits Info/Warning alert to coordinate transit assistance.
3. **Rule 3 — Unresolved High-Priority Tickets:**
   - Query: `WHERE priority IN ('High', 'Critical') AND status = 'Pending'`
   - Action: Emits Critical escalation alert.
4. **Rule 4 — Inactivity Watchdog (Dead-Man Switch):**
   - Query: Compares `parents.last_heartbeat` with `current_time`.
   - Condition: Elapsed duration > 8 hours without sensor ping or check-in.
   - Action: Emits Critical emergency alert.

### Sliding-Window SHA-256 Deduplication

To prevent alert flooding storms:
```python
import hashlib

def compute_dedup_hash(parent_id: int, alert_type: str, time_bucket: str) -> str:
    raw = f"{parent_id}:{alert_type}:{time_bucket}"
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()
```

- When 40 rapid alarms occur within 120 seconds, only the first trigger creates an active row in `alerts`.
- The remaining 39 alarms update `alert_dedup_cache.occurrence_count` and `last_seen` without spamming notifications.
