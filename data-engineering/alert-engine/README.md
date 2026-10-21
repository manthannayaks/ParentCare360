# Data Engineering — Deterministic Alert Engine (DAG 3)

**Source Module:** `dags/dag_alert_engine.py`

## Operational Risk Rules

DAG 3 evaluates four automated health and safety rules:

1. **Rule 1 — Overdue Caregiver Visits:** Flags visits in `Scheduled` status whose `scheduled_datetime < current_time`.
2. **Rule 2 — Upcoming Medical Appointments:** Evaluates clinical appointments scheduled within the next 48 hours to coordinate transportation.
3. **Rule 3 — High-Priority Household Tickets:** Escalates tickets marked `High` or `Critical` priority remaining in `Pending` status.
4. **Rule 4 — Inactivity Watchdog (Dead-Man Switch):** Checks `parents.last_heartbeat`. If elapsed time exceeds 8 hours, emits a critical escalation alert.

## Sliding-Window SHA-256 Deduplication

To prevent alert flooding storms (e.g. 40 identical alarms triggered in 2 minutes):
- Computes SHA-256 signature: `hash = sha256(f"{parent_id}:{alert_type}:{time_bucket}")`.
- Records signature in `alert_dedup_cache`.
- If an alert with the same signature was recorded within the active sliding window (60 minutes), the new trigger is suppressed while updating `occurrence_count` and `last_seen`.
