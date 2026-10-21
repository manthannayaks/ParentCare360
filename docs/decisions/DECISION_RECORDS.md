# ParentCare360 — Architectural Decision Records (ADRs)

This document records the architectural decisions, trade-offs, and rationale adopted during the development of ParentCare360.

---

## ADR-01: SQLite WAL Mode vs. Distributed PostgreSQL

- **Status:** Accepted (with PostgreSQL migration path staged for production scaling).
- **Context:** An early-to-mid stage elder-care coordination platform requires rapid iteration, atomic local testing, and zero-administration deployment without external database service dependencies.
- **Decision:** Use SQLite 3.9+ with Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) and normal synchronous flushing (`PRAGMA synchronous = NORMAL;`).
- **Consequences:** 
  - *Positive:* Instant zero-setup test execution; zero network latency on entity queries; ACID compliance; simultaneous concurrent read operations without blocking writer locks.
  - *Negative:* Multi-instance horizontal write clustering is not supported without distributed replication.

---

## ADR-02: Decoupled Airflow Micro-DAGs vs. Monolithic Pipeline

- **Status:** Accepted.
- **Context:** In prototype iterations, batch extraction, cleansing, alert evaluation, and notification dispatch were coupled in one sequential script. Failures in downstream notification gateways stalled upstream ingestion.
- **Decision:** Modularize pipeline into four event-driven micro-DAGs (`DAG 1: Ingest`, `DAG 2: Cleanse/DLQ`, `DAG 3: Alert Engine`, `DAG 4: Dispatcher`) triggered via dataset dependency signals (`clean_events`).
- **Consequences:**
  - *Positive:* Fault isolation; independent testability; zero ingestion disruption when alerts are calculating.
  - *Negative:* Requires stateful coordination mechanism across DAG boundaries.

---

## ADR-03: Semi-Structured JSON Granules vs. Relational Schema for DLQ

- **Status:** Accepted.
- **Context:** Ingested sensor telemetry, IoT wearable feeds, and hospital clinic records exhibit frequent schema drift and unexpected payload variations.
- **Decision:** Persist corrupted payloads in `quarantine_records.record_payload` as raw JSON text while maintaining relational columns for metadata (`batch_id`, `error_code`, `quarantined_at`).
- **Consequences:**
  - *Positive:* Zero data loss; unmodeled corrupt fields can be inspected or replayed without table migrations.
  - *Negative:* Cannot execute indexed SQL queries directly on fields inside corrupted payloads without JSON extraction functions.

---

## ADR-04: Sliding-Window SHA-256 Deduplication vs. Relational Flags

- **Status:** Accepted.
- **Context:** Sensor flapping and network retry storms can generate hundreds of duplicate alarm events in short intervals, causing alert exhaustion and user panic.
- **Decision:** Compute SHA-256 signatures over composite alert keys (`parent_id:alert_type:time_bucket`) and maintain a sliding-window deduplication cache table (`alert_dedup_cache`).
- **Consequences:**
  - *Positive:* Suppresses 39 out of 40 alarms during a 2-minute sensor spike while maintaining an accurate occurrence count.
  - *Negative:* Requires periodic cache pruning to prevent table bloating.

---

## ADR-05: Strict Role Isolation Mobile Interface vs. Multi-Persona Desktop Switcher

- **Status:** Accepted.
- **Context:** Having desktop tabs allowing users to switch between Parent and Family views in the same session led to permission bleed and self-connection errors (e.g. Joe connecting to Joe).
- **Decision:** Remove the desktop top navbar completely. When a user logs in, they strictly see only the dedicated mobile experience of their authenticated role. Role switching requires explicit sign out.
- **Consequences:**
  - *Positive:* Eliminates cross-role state contamination; provides an authentic mobile app UX; prevents self-connection errors.
  - *Negative:* Testing multiple roles on a single laptop requires logging out or using the Admin Panel quick-switch feature.
