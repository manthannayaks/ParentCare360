# Changelog

All notable changes to the **ParentCare360** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.0] - 2026-10-21

### Added
- Complete project folder restructuring into an industry-standard layout (`config/`, `database/`, `scripts/`, `data-engineering/`, `docs/`, `assets/diagrams/`).
- Master documentation suite including `docs/index.md`, `ARCHITECTURE.md`, `DATA_ENGINEERING.md`, `DATABASE_DESIGN.md`, `API_REFERENCE.md`, `TESTING_STRATEGY.md`, `DEPLOYMENT_GUIDE.md`, `DECISION_RECORDS.md`, and `TROUBLESHOOTING.md`.
- Chronological week-by-week development timeline (`docs/development-workflow/DEVELOPMENT_TIMELINE.md`) covering Weeks 1 through 9.
- Granular project roadmap (`docs/development-workflow/PROJECT_ROADMAP.md`) categorizing Completed (Verified), In Progress, and Planned work.
- Modular database migration scripts (`001_initial_core_schema.sql`, `002_mobile_features_and_indexes.sql`).
- Automated development and deployment scripts in `scripts/`.
- Diagnostic network error handling in `FamilyExperience.jsx` with automatic guidance for Render free-tier cold starts.

### Removed
- Academic lab reports, PDF/DOCX drafts, and submission-specific charts (`Lab678_Group18.pdf`, `ParentCare360_Lab4_5_Progress_Report.pdf`, `reports/`).
- Runtime temporary logs (`backend.log`).

---

## [2.0.0] - 2026-10-16

### Added
- Pure mobile-first user experience eliminating top desktop navigation bar and enforcing strict single-role isolation.
- Dedicated Admin Panel (`AdminPanel.jsx`) allowing instant test account creation (Parent, Child, Caregiver, Doctor) and 1-tap role switching.
- Client-side and server-side self-connection prevention.
- Render Blueprint deployment configuration (`render.yaml`) hosting live FastAPI API and Vite React frontend.
- Native Android APK generation via `@capacitor/android` and Gradle.
- Mobile core features test suite (`tests/test_mobile_core_features.py`).

---

## [1.5.0] - 2026-10-11

### Added
- Inter-DAG event-driven orchestration with Apache Airflow Datasets (`dags/orchestrator.py`).
- 4-Tier data cleansing engine and Dead Letter Queue (`quarantine_records`) in `dags/dag_cleansing_dlq.py`.
- Deterministic alert evaluation engine (DAG 3) with sliding-window SHA-256 deduplication cache (`dags/dag_alert_engine.py`).
- Five composite B-Tree indexes on SQLite WAL store, reducing query latency from 185ms to 0.22ms (840x acceleration).
- Deterministic test harness (`tests/test_deterministic_dags.py`) validating 5 real-world edge cases.

---

## [1.0.0] - 2026-09-11

### Added
- Initial operational prototype in Streamlit (`app.py`, `views/`).
- 9 core relational tables in SQLite (`database/db.py`).
- 4-stage batch ETL pipeline (`etl/extract.py`, `validate.py`, `transform.py`, `load.py`).
- Synthetic Indian elder demographic seed records (`database/seed_data.py`).
- Rule-based alert evaluator (`utils/alert_engine.py`) and bilingual voice NLP prototype (`utils/voice_proto.py`).
