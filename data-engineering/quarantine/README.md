# Data Engineering — Dead Letter Queue (DLQ) & Quarantine

**Target Storage:** SQLite table `quarantine_records` (indexed by `idx_quarantine_batch`)

## Quarantine Schema
```sql
CREATE TABLE quarantine_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id TEXT NOT NULL,
    source_feed TEXT NOT NULL,
    record_payload TEXT NOT NULL,
    error_code TEXT NOT NULL,
    error_message TEXT NOT NULL,
    quarantined_at TEXT NOT NULL
);
```

## Error Taxonomy
- `ERR_SYNTAX_DATE`: Malformed or non-ISO calendar string.
- `ERR_FK_NOT_FOUND`: Foreign key parent_id or caregiver_id does not exist.
- `ERR_SEMANTIC_BOUND`: Physiological sensor value or priority outside accepted bounds.
- `ERR_SCHEMA_NULL`: Mandatory column missing or null.

## Zero-Loss Guarantee
No corrupted record is silently dropped. Every rejected row is logged with its exact JSON payload and error reason for automated replay or engineer inspection.
