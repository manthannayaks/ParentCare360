# ParentCare360 — Database Architecture & Storage Documentation

## 1. Storage Overview

The persistent operational store for ParentCare360 utilizes **SQLite 3.9+** configured with **Write-Ahead Logging (WAL)**. 

SQLite was selected for early-to-mid stage deployment due to:
- Zero-administration, single-file embedded deployment.
- Strict ACID transaction guarantees across entity writes and care timeline events.
- Highly efficient concurrent read throughput under WAL mode (`PRAGMA journal_mode = WAL`).
- Deterministic test harness execution with zero network roundtrip overhead.

## 2. Physical Storage & WAL Configuration

Every database connection initiated via `database/db.py` executes these physical pragmas:

```python
conn.execute("PRAGMA foreign_keys = ON;")
conn.execute("PRAGMA journal_mode = WAL;")
conn.execute("PRAGMA synchronous = NORMAL;")
```

- **WAL Mode (`journal_mode = WAL`):** Enables simultaneous multi-reader execution without blocking writer transactions. Readers do not block writers, and writers do not block readers.
- **Foreign Key Enforcement (`foreign_keys = ON`):** Enforces referential integrity at the database engine level (e.g., cascade delete on family connections and caregiver visits).
- **Synchronous Normal (`synchronous = NORMAL`):** Syncs WAL frames at checkpoint intervals, providing high write throughput while maintaining durability.

## 3. Composite B-Tree Indexes & Query Optimization

ParentCare360 features an autonomous alert engine (DAG 3) that scans operational state tables every 60 seconds. To prevent $O(N)$ full-table scans, five composite B-Tree indexes were designed:

| Index Name | Target Table | Columns | Operational Purpose | Scan Complexity |
| :--- | :--- | :--- | :--- | :---: |
| `idx_visits_status_time` | `caregiver_visits` | `(status, scheduled_datetime)` | Overdue caregiver arrival detection | $O(\log N)$ |
| `idx_appts_status_date` | `appointments` | `(status, appointment_date)` | 48-hour doctor appointment lookahead | $O(\log N)$ |
| `idx_reqs_priority_status` | `household_requests` | `(priority, status)` | High-priority unresolved ticket rollup | $O(\log N)$ |
| `idx_alerts_parent_res` | `alerts` | `(parent_id, is_resolved)` | Active alert evaluation per elder | $O(\log N)$ |
| `idx_quarantine_batch` | `quarantine_records` | `(batch_id)` | Dead Letter Queue (DLQ) batch audit | $O(\log N)$ |

### Benchmark Results (`EXPLAIN QUERY PLAN`)
- Unindexed Full Table Scan: `SCAN TABLE caregiver_visits` — **185.0 ms** (at 50,000 synthetic rows).
- Covering Composite Index: `SEARCH TABLE caregiver_visits USING COVERING INDEX idx_visits_status_time` — **0.22 ms** (**840x acceleration**).

## 4. Entity-Relationship Model Summary

- **Elderly Core:** `parents`, `family_members`, `caregivers`, `doctors`.
- **Operations:** `appointments`, `caregiver_visits`, `household_requests`, `documents`, `parent_locations`, `travel_journeys`.
- **Data Engineering & DLQ:** `quarantine_records`, `alert_dedup_cache`, `alerts`, `care_events`.
- **Mobile Multi-Persona:** `users`, `family_connections`, `permission_grants`, `prescriptions`, `voice_messages`, `location_shares`, `help_requests`, `notifications`.

## 5. Schema Initialization & Seeding Commands

```bash
# Initialize schema and indexes
python3 database/db.py

# Populate realistic Indian elder demographic seed records
python3 database/seed_data.py
```
