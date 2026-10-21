# Data Engineering — Ingestion (DAG 1)

**Source Module:** `dags/dag_telemetry_ingest.py`

## Responsibilities
1. Ingests raw telemetry feeds, sensor readings, clinical CSVs, and voice transcription payloads.
2. Injects an immutable cryptographic batch UUID (`_batch_id = str(uuid.uuid4())`) on every ingestion batch.
3. Injects UTC arrival timestamps (`_ingested_at`) and origin feed identifier (`_source`).
4. Canonicalizes field names and prepares unverified payloads for DAG 2 cleansing.

## Provenance Header Injection
```python
enriched_record = {
    **raw_payload,
    "_batch_id": batch_id,
    "_ingested_at": datetime.utcnow().isoformat(),
    "_source": source_feed
}
```
