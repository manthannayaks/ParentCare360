# Data Engineering — Schemas & Provenance Models

**Source Directory:** `models/`

## Domain Models
- `parent_model.py`: Parent profile attributes, contacts, baseline vitals.
- `caregiver_model.py`: Certified caregiver credentials, roster assignment.
- `appointment_model.py`: Clinical visits, specialty, hospital location, doctor notes.
- `alert_model.py`: Risk classification, severity, resolution state.
- `request_model.py`: Household assistance tasks, priority categorization.
- `journey_model.py`: Transit tracking, departure/arrival timestamps, waypoints.
- `event_model.py`: Immutable care ledger (`care_events`) tracking state transitions.

## Data Provenance Standards
All ingestion models implement W3C PROV lineage attributes:
- `_batch_id`: Cryptographic UUID v4 batch identity.
- `_ingested_at`: UTC arrival watermark.
- `_source`: Upstream origin system / feed tag.
