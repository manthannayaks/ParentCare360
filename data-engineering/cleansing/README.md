# Data Engineering — Cleansing & Validation (DAG 2)

**Source Module:** `dags/dag_cleansing_dlq.py`

## 4-Tier Verification Hierarchy

To preserve analytical integrity without halting batch runs:

1. **Tier 1 — Syntactic & Schema Checks:**
   - Non-null enforcement on mandatory entity keys.
   - ISO-8601 regex validation (`^\d{4}-\d{2}-\d{2}$`) on appointment and visit dates, trapping anomalies like `INVALID-DATE`.
2. **Tier 2 — Referential Integrity Checks:**
   - Validates foreign keys (`parent_id`, `caregiver_id`) against live database entities. Orphan references are intercepted.
3. **Tier 3 — Semantic & Physiological Boundary Rules:**
   - Restricts priorities to enumeration sets (`Low`, `Medium`, `High`, `Critical`).
   - Physiological sensor ranges: Heart rate (35–220 bpm), Systolic BP (70–240 mmHg).
4. **Tier 4 — Sliding-Window Hash Deduplication:**
   - Computes SHA-256 signature over entity composite keys to suppress flapped network retransmissions.

### Routing Decision
- **Passed All Tiers:** Persists atomically to SQLite WAL store; triggers Airflow dataset signal `clean_events`.
- **Failed Any Tier:** Diverted immediately to `quarantine_records` (Dead Letter Queue).
