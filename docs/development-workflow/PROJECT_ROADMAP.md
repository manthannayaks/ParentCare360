# ParentCare360 — Project Roadmap & Implementation Status

This document separates all project capabilities into **Completed — Verified**, **In Progress**, and **Planned Work**, backed by source code, tests, and repository evidence.

---

## Section A: Completed — Verified

The following features and architectural deliverables are implemented, operational, and verified through automated test suites and live execution.

| Task ID | Feature / Module | Scope & Description | Status | Responsible | Dependencies | Target Date | Acceptance Criteria | Verified Evidence & Linked Files |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| **T-01** | **Database Schema** | Formulated 22 SQLite tables with WAL mode, foreign keys, cascading deletes, and initial seed profiles. | **Completed** | Group 18 | None | 2026-08-31 | Tables initialize cleanly with WAL mode; zero foreign key violations. | `database/db.py`, `database/schema/schema.sql`, `database/seeds/` |
| **T-02** | **ETL Ingestion Pipeline** | 4-stage batch pipeline (`extract`, `validate`, `transform`, `load`) parsing dirty CSV inputs into SQLite. | **Completed** | Group 18 | T-01 | 2026-09-07 | Intercepts invalid rows; commits clean rows; emits care events. | `etl/extract.py`, `etl/validate.py`, `etl/transform.py`, `etl/load.py` |
| **T-03** | **Interactive Streamlit Prototype** | 11-view operations management UI for rapid Lab 4/5 evaluation. | **Completed** | Group 18 | T-01, T-02 | 2026-09-09 | All 11 views render live without crashes; interactive status updates work. | `app.py`, `views/*.py` |
| **T-04** | **DAG 1 Telemetry Ingestion** | Ingestion micro-DAG injecting batch UUIDs, source tags, and UTC timestamps. | **Completed** | Group 18 | T-01 | 2026-09-24 | Injects `_batch_id` (UUID v4) and `_ingested_at` on every raw batch. | `dags/dag_telemetry_ingest.py` |
| **T-05** | **DAG 2 Cleansing & DLQ** | 4-tier validation engine diverting corrupted payloads to Dead Letter Queue (`quarantine_records`). | **Completed** | Group 18 | T-04 | 2026-09-29 | Non-ISO dates, orphan FKs, and out-of-bound HR/BP routed to DLQ without halting pipeline. | `dags/dag_cleansing_dlq.py`, `tests/test_deterministic_dags.py::test_edge_poison_pill_quarantine` |
| **T-06** | **Physical B-Tree Indexing** | Engineered 5 composite B-Tree indexes on operational tables for alert queries. | **Completed** | Group 18 | T-01 | 2026-10-03 | Query scan switches from full-table `SCAN` to `SEARCH ... USING COVERING INDEX` (<1ms seek). | `database/db.py`, `assets/diagrams/indexing_benchmark.png` |
| **T-07** | **DAG 3 Alert Engine & Dedup** | Operational risk rules (Overdue visits, upcoming appts, urgent tickets, inactivity watchdog) with sliding SHA-256 deduplication cache. | **Completed** | Group 18 | T-05, T-06 | 2026-10-07 | 40-alarm sensor spike produces exactly 1 alert; 39 duplicates suppressed in cache. | `dags/dag_alert_engine.py`, `tests/test_deterministic_dags.py::test_edge_dedup_storm` |
| **T-08** | **DAG 4 Role Dispatcher** | Role-based (RBAC) and attribute-based (ABAC) privacy boundaries with caregiver PII masking. | **Completed** | Group 18 | T-07 | 2026-10-10 | Caregivers receive operational checklist with medical notes masked; sponsors receive full alerts. | `dags/dag_dispatcher.py`, `tests/test_deterministic_dags.py::test_edge_role_based_dispatch_granularity` |
| **T-09** | **Inter-DAG Orchestrator** | Coordinates 4 micro-DAGs via Airflow dataset dependencies (`clean_events`). | **Completed** | Group 18 | T-04..T-08 | 2026-10-11 | Triggers complete 4-stage pipeline and injects edge-case scenarios. | `dags/orchestrator.py` |
| **T-10** | **Deterministic Test Suite** | 5 pytest test cases verifying real-world elder telemetry edge scenarios with frozen clocks. | **Completed** | Group 18 | T-09 | 2026-10-14 | 100% pass rate in sub-second execution (0.13s total). | `tests/test_deterministic_dags.py` |
| **T-11** | **FastAPI Backend Services** | REST API endpoints for authentication, connections, location sharing, prescriptions, and simulation. | **Completed** | Group 18 | T-01, T-09 | 2026-10-16 | OpenAPI documentation generated at `/docs`; handles CORS and async request handling. | `api/main.py` |
| **T-12** | **Pure Mobile-First Frontend** | Modern React + Vite application enforcing strict single-role views (Parent, Family, Caregiver, Doctor, Admin). | **Completed** | Group 18 | T-11 | 2026-10-16 | Zero desktop role-switching tabs; dedicated full-screen mobile experience with clean Sign Out. | `frontend/src/App.jsx`, `frontend/src/components/*.jsx` |
| **T-13** | **Admin & Test User Panel** | Interface to create and manage test users with roles, passwords, cities, and 1-tap role switching. | **Completed** | Group 18 | T-11, T-12 | 2026-10-16 | Allows creating custom test users and instantly logging in as that user to verify flows. | `frontend/src/components/AdminPanel.jsx` |
| **T-14** | **Connection Error Diagnostics** | Client-side self-connection prevention and Render cold-start diagnostic guidance. | **Completed** | Group 18 | T-12 | 2026-10-21 | Eliminates self-connection error; guides user through Render free-tier cold-start wakeups. | `frontend/src/components/FamilyExperience.jsx` |
| **T-15** | **Android APK Build** | Capacitor Android integration and automated debug APK assembly via Gradle. | **Completed** | Group 18 | T-12 | 2026-10-21 | Generates installable `ParentCare360.apk` containing latest web bundle. | `frontend/android/`, `ParentCare360.apk`, `scripts/deployment/build_apk.sh` |

---

## Section B: In Progress

The following features are partially implemented, with core database tables or simulation endpoints created, but full external production links undergoing integration.

| Task ID | Feature / Module | Scope & Description | Status | Responsible | Dependencies | Target Date | Acceptance Criteria | Current State & Blockers |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| **T-16** | **In-App Notification Ledger** | Push alert recording in SQLite `notifications` table upon high-priority requests and doctor notes. | **In Progress** | Group 18 | T-01, T-11 | 2026-10-24 | Notifications saved in database and queryable per user with unread count. | Table and API endpoints implemented; frontend notification bell dropdown in progress. |
| **T-17** | **Cloud Deployment Warmup** | Automated health check pinger to prevent Render free-tier cold-start timeouts. | **In Progress** | Group 18 | T-11 | 2026-10-25 | Background cron pings `https://parentcare360-api.onrender.com` every 14 minutes. | API runs live on Render; manual pings currently wake server. Ping cron script staged in `scripts/deployment/`. |
| **T-18** | **Speech-to-Text Multi-Language** | Local and cloud speech-to-text transcription supporting Hindi and regional Indian dialects. | **In Progress** | Group 18 | T-12 | 2026-10-26 | Transcribes Hindi audio notes accurately into structured emergency tickets. | Audio recorder and Hindi keyword extraction working in prototype; full Whisper model integration in progress. |

---

## Section C: Planned Work

The following items are scheduled for upcoming release cycles and production hardening.

| Task ID | Feature / Module | Scope & Description | Status | Responsible | Dependencies | Target Date | Acceptance Criteria | Planned Deliverables |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| **T-19** | **Twilio SMS Gateway** | Dispatch SMS text alerts to family sponsor phone numbers for Critical/Emergency severity events. | **Planned** | Group 18 | T-08, T-16 | 2026-10-28 | SMS delivered within 5 seconds of Inactivity Watchdog or SOS trigger. | `services/notifications/sms_dispatcher.py`, Twilio API keys. |
| **T-20** | **Web Push (VAPID)** | Browser and Android native push notifications when app is in the background. | **Planned** | Group 18 | T-16 | 2026-10-30 | Push notification displayed on device lockscreen with tap-to-open action. | Service worker `sw.js`, VAPID key pair, Web Push payload handler. |
| **T-21** | **Signed Release APK** | Production keystore signing, ProGuard obfuscation, and release bundle generation. | **Planned** | Group 18 | T-15 | 2026-11-02 | Signed APK passing Google Play Protect security scan with optimized bundle size. | `release.keystore`, `ParentCare360-release.apk`. |
| **T-22** | **PostgreSQL Cloud Store** | Optional migration path from SQLite WAL to hosted Supabase / Neon PostgreSQL instance. | **Planned** | Group 18 | T-01, T-11 | 2026-11-05 | Zero data loss during schema migration; identical API test pass rate. | SQLAlchemy / asyncpg connector, migration scripts in `database/migrations/`. |
| **T-23** | **End-to-End Cypress Tests** | Automated UI test suite verifying cross-role interactions in the browser. | **Planned** | Group 18 | T-12 | 2026-11-08 | Automated test runner simulating Parent SOS ➔ Family notification ➔ Doctor notes. | `tests/e2e/cypress/`, CI GitHub Action workflow. |
| **T-24** | **Final Security Review** | PII data sanitization, OWASP Top 10 API audit, and dependency vulnerability scanning. | **Planned** | Group 18 | T-11, T-12 | 2026-11-10 | Zero high/critical CVEs; verified compliance with healthcare privacy guidelines. | Security audit report in `docs/decisions/`. |
