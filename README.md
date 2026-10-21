# ParentCare360: Comprehensive Remote Elder-Care Coordination & Telemetry Platform

[![Python Version](https://img.shields.io/badge/python-3.9%20%7C%203.10-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.2+-61DAFB.svg)](https://react.dev/)
[![SQLite WAL](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57.svg)](https://www.sqlite.org/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android%20APK-119EFF.svg)](https://capacitorjs.com/)
[![Tests](https://img.shields.io/badge/Tests-10%2F10%20Passing-brightgreen.svg)](tests/)

---

## 1. Project Overview

**ParentCare360** is an intelligent, event-driven remote elder-care coordination platform designed to bridge geographical distances between aging parents living independently and adult children residing in different cities. 

The platform unites elderly parents, family coordinators, certified caregivers, consulting physicians, and data engineering orchestrators into a synchronized ecosystem. It combines an accessible, mobile-first touch interface with an orchestrated 4-stage data pipeline featuring **Dead Letter Queue (DLQ) quarantine**, **composite B-Tree indexing (840x query acceleration)**, and **cryptographic sliding-window alert deduplication**.

---

## 2. Problem Statement

Elderly citizens living independently in Indian metropolitan and semi-urban centers encounter acute coordination breakdowns:
- **Clinical Friction:** Difficulty managing multi-specialty clinical appointments, prescription schedules, and medication adherence.
- **Caregiver Accountability:** Absence of verifiable, real-time logging for home nursing visits and elder vital checks (BP, glucose).
- **Home Maintenance & Emergencies:** Inability to communicate urgent domestic repairs (electrical/plumbing hazards) or physical emergencies during acute medical distress.
- **Family Visibility Deficit:** Working children residing in remote cities lack consolidated visibility into day-to-day parental welfare and vital telemetry.

ParentCare360 solves these challenges through role-isolated mobile workflows and an autonomous data pipeline that monitors vital check-ins, tracks doctor visits, and detects prolonged senior inactivity.

---

## 3. Key Features

- **👴 Dedicated Parent Experience:** Ultra-simplified, high-contrast mobile interface with 1-Tap SOS, Share Location, Speak Voice Request (Hindi/English), My Medicines, and Ask for Help.
- **👨‍👩‍👧 Family Coordination Dashboard:** Real-time GPS location tracking, cab ride coordination, prescription schedules, caregiver arrival verification, and emergency alerts.
- **🧑‍⚕️ Certified Caregiver Portal:** Daily patient shift roster, patient addresses, vital signs recorder (BP & glucose), and operational checklists with sensitive family PII masked.
- **🩺 Clinical Physician Hub:** Linked elderly patient charts, clinical notes recorder, prescription updates, and authorized medical document review.
- **🛠️ Integrated Admin Panel:** Instant test user creation (Parent, Child, Caregiver, Doctor) with auto-generated family invitation codes and 1-tap instant role switching.
- **⚙️ 4-Tier Data Cleansing & DLQ:** Zero-loss quarantine subsystem intercepting malformed dates (`ERR_SYNTAX_DATE`), orphan foreign keys (`ERR_FK_NOT_FOUND`), and sensor outliers (`ERR_SEMANTIC_BOUND`).
- **🛡️ Stateful Sliding-Window Alert Deduplication:** SHA-256 signature hashing suppressing alarm flooding storms (40 rapid spikes ➔ exactly 1 alert dispatched).
- **⚡ Physical SQLite WAL Indexing:** Covering composite B-Tree indexes reducing operational query seeking from 185.0 ms to 0.22 ms (**840x speedup**).
- **📱 Universal Client & Android APK:** Vite React single-page app bundled into native Android APK via `@capacitor/android` and Gradle.

---

## 4. High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION TIER (APIs & UI)                   │
├────────────────────────────────────────────────────────────────────────┤
│  React (Vite) Mobile Client / Capacitor Android Native Application     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │    Parent    │ │    Family    │ │  Caregiver   │ │    Doctor    │   │
│  │ (1-tap SOS)  │ │ (Coordination│ │ (Visit Roster│ │ (Clinical Rx │   │
│  │ Voice & Loc  │ │  & Tracking) │ │  Checklist)  │ │  & Consults) │   │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘   │
│         └────────────────┼────────────────┼────────────────┘           │
│                          ▼                ▼                            │
│                 FastAPI REST Gateway (api/main.py)                     │
│                 • RBAC & ABAC Privacy Middleware                       │
│                 • JWT Authentication & Connection Handshake            │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   DATA ENGINEERING ORCHESTRATION TIER                  │
├────────────────────────────────────────────────────────────────────────┤
│  Inter-DAG Event-Driven Orchestration (Airflow Dataset Triggering)      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ DAG 1: Telemetry & Ingestion (Batch UUID injection, Normalization)│  │
│  └───────────────────────────────┬──────────────────────────────────┘  │
│                                  ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ DAG 2: Cleansing & DLQ (4-Tier Rules: Syntax, FK, Bounds, Hash)  │  │
│  └───────────────┬──────────────────────────────────┬───────────────┘  │
│                  │ Dirty                            │ Clean            │
│                  ▼                                  ▼                  │
│       ┌──────────────────────┐        ┌─────────────────────────────┐  │
│       │ Dead Letter Queue    │        │ Relational Store (WAL Mode) │  │
│       │ (quarantine_records) │        │ (Dataset: 'clean_events')   │  │
│       └──────────────────────┘        └─────────────┬───────────────┘  │
│                                                     ▼                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ DAG 3: Alert Engine (Sliding-window SHA-256 Deduplication Cache) │  │
│  └───────────────────────────────┬──────────────────────────────────┘  │
│                                  ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ DAG 4: Role-Based Dispatcher (Privacy masking & channel routing) │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     PHYSICAL STORAGE & INDEXING TIER                   │
├────────────────────────────────────────────────────────────────────────┤
│  SQLite 3.9+ with Write-Ahead Logging (WAL) Concurrency                │
│  • Covering Composite B-Tree Indexes (840x Query Acceleration)         │
│  • Immutable Append-Only Care Ledger (care_events)                     │
│  • W3C PROV Batch Lineage (_batch_id, _ingested_at, _source)           │
└────────────────────────────────────────────────────────────────────────┘
```

Detailed architectural diagrams and sequence flows are available in [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md).

---

## 5. Technology Stack

Verified against repository dependency manifests (`requirements.txt`, `package.json`):

| Layer | Technologies & Libraries | Version / Standard |
| :--- | :--- | :--- |
| **Backend & API** | FastAPI, Uvicorn, Pydantic, Python-Multipart | Python 3.9+ / FastAPI 0.100+ |
| **Data Pipelines** | Apache Airflow Dataset-Compatible Micro-DAGs, Pandas | Airflow Datasets / Pandas 2.0+ |
| **Database & Storage** | SQLite 3.9+ in WAL Mode, B-Tree Indexes | PRAGMA journal_mode = WAL |
| **Frontend Framework** | React, Vite, Lucide React Icons | React 19.2+ / Vite 8.3+ |
| **Mobile Runtime** | Capacitor Android Native Container, Gradle | Capacitor 8.5+ / Android API 24+ |
| **Testing Harness** | Pytest, HTTPX, AnyIO (Frozen-clock fixtures) | Pytest 8.3+ |
| **Cloud Deployment** | Render Cloud Web Services & Cloudflare CDN | Infrastructure-as-Code (`render.yaml`) |

---

## 6. Repository Folder Structure

```
ParentCare360/
├── README.md                           # Master Project Overview & Setup Guide
├── CHANGELOG.md                        # Version Release History
├── CONTRIBUTING.md                     # Engineering Standards & Pull Request Guide
├── .gitignore                          # Git Ignore Specification
├── .env.example                        # Environment Configuration Template
├── render.yaml                         # Render Cloud Infrastructure-as-Code Blueprint
├── requirements.txt                    # Python Production Dependencies
├── start_system.sh                     # Automated Full-Stack Dev Startup Script
├── ParentCare360.apk                   # Pre-compiled Android Debug APK
│
├── api/                                # FastAPI Backend Application
│   └── main.py                         # REST Endpoints, CORS & Startup Seeding
│
├── config/                             # Centralized Environment Settings
│   └── settings.py                     # Environment Variable Bindings
│
├── dags/                               # Event-Driven Airflow Micro-DAGs
│   ├── dag_telemetry_ingest.py         # DAG 1: Telemetry Batch Ingestion
│   ├── dag_cleansing_dlq.py            # DAG 2: 4-Tier Cleansing & Dead Letter Queue
│   ├── dag_alert_engine.py             # DAG 3: Alert Engine & Sliding SHA-256 Dedup
│   ├── dag_dispatcher.py               # DAG 4: Role-Based Dispatch & Privacy Masking
│   └── orchestrator.py                 # Inter-DAG Orchestration & Edge Simulator
│
├── data/                               # Persistent Storage Directory
│   ├── parentcare360.db                # SQLite Operational WAL Database
│   └── raw/                            # Sample CSV Feeds (Appointments & Requests)
│
├── database/                           # Relational Schema, Migrations & Seeds
│   ├── db.py                           # SQLite Connection, DDL Tables & Indexes
│   ├── seed_data.py                    # Indian Elder Demographic Populator
│   ├── README.md                       # Physical Storage & WAL Documentation
│   ├── schema/
│   │   └── schema.sql                  # Complete Master DDL Definition
│   └── migrations/
│       ├── 001_initial_core_schema.sql # Core Baseline Migration
│       └── 002_mobile_features_and_indexes.sql # Mobile Features & B-Tree Indexes
│
├── data-engineering/                   # Data Engineering Subsystem Documentation
│   ├── README.md                       # Pipeline Architecture & Flow
│   ├── ingestion/                      # Ingestion Standards & Batch UUIDs
│   ├── cleansing/                      # 4-Tier Cleansing Hierarchy
│   ├── quarantine/                     # DLQ Schema & Zero-Loss Guarantees
│   ├── orchestration/                  # Dataset Signals & Execution Models
│   ├── alert-engine/                   # Operational Rules & Deduplication Cache
│   └── schemas/                        # W3C PROV Lineage & Domain Schemas
│
├── frontend/                           # Mobile-First Client Application
│   ├── package.json                    # Node.js Dependencies & Build Scripts
│   ├── vite.config.js                  # Vite Bundler Configuration
│   ├── capacitor.config.json           # Capacitor Android Native Configuration
│   ├── src/                            # React Component Architecture
│   │   ├── App.jsx                     # Root Mobile Viewport & Role Router
│   │   └── components/
│   │       ├── RoleAuthScreen.jsx      # Mobile Login & Live Demo Accounts
│   │       ├── ParentExperience.jsx    # Accessible Elder Screen (1-tap SOS, Rx)
│   │       ├── FamilyExperience.jsx    # Family Coordinator Screen (GPS, Rides)
│   │       ├── CaregiverExperience.jsx # Nursing Roster & Vital Checklist
│   │       ├── DoctorExperience.jsx    # Clinical Consult Notes & Rx Recorder
│   │       ├── AdminPanel.jsx          # Test User Creator & Instant Switcher
│   │       └── OpsDagMode.jsx          # Pipeline Orchestrator & Edge Simulator
│   └── android/                        # Native Android Studio / Gradle Project
│
├── tests/                              # Automated Test Harness
│   ├── test_deterministic_dags.py      # 5 Edge-Case Pipeline Tests (Frozen Clocks)
│   └── test_mobile_core_features.py    # 5 Mobile Core API Feature Tests
│
├── scripts/                            # Operational & Maintenance Utilities
│   ├── development/
│   │   └── start_dev.sh                # Local Development Runner
│   ├── database/
│   │   ├── init_db.sh                  # Database Schema Initializer
│   │   └── seed_db.sh                  # Demo Account Populator
│   └── deployment/
│       └── build_apk.sh                # Android Production APK Compiler
│
├── assets/                             # Architecture Visuals & Diagrams
│   └── diagrams/                       # Pipeline Topology & Benchmark PNGs
│
└── docs/                               # Master Technical Documentation
    ├── index.md                        # Documentation Table of Contents
    ├── architecture/                   # System Topology & Sequence Flows
    ├── data-engineering/               # Data Cleansing & Quarantine Specs
    ├── database/                       # Physical WAL Storage & Index Profiles
    ├── development-workflow/           # Timeline & Project Roadmap
    ├── api/                            # REST API Contracts & Endpoint Catalog
    ├── testing/                        # Testing Strategy & Benchmark Logs
    ├── deployment/                     # Render Hosting & APK Packaging Guide
    ├── decisions/                      # Architectural Decision Records (ADRs)
    └── troubleshooting/                # Diagnostic Guide for Common Issues
```

---

## 7. Prerequisites

Before installing ParentCare360, ensure your environment has:
- **Python:** Version `3.9` or `3.10` (compatible with `3.11`).
- **Node.js:** Version `18.x` or `20.x` LTS.
- **npm:** Version `9.x` or higher.
- **Git:** Version `2.30+`.
- **JDK (Optional, for Android APK Compilation):** Java 17+ and Android SDK Command-line Tools.

---

## 8. Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/manthannayaks/ParentCare360.git
cd ParentCare360

# 2. Configure Python Virtual Environment
python3 -m venv venv
source venv/bin/activate       # macOS/Linux
# .\venv\Scripts\activate      # Windows PowerShell

# 3. Install Python Dependencies
pip install -r requirements.txt

# 4. Install Frontend Node Dependencies
cd frontend
npm install
cd ..
```

---

## 9. Environment Configuration

Copy the example environment template:

```bash
cp .env.example .env
```

The application functions out of the box with default development values:
- `SQLITE_DB_PATH`: `data/parentcare360.db`
- `API_PORT`: `8000`
- `VITE_API_URL`: `http://localhost:8000` (Local) or `https://parentcare360-api.onrender.com` (Cloud)

---

## 10. Database Initialization & Seeding

```bash
# Initialize SQLite tables, WAL mode, composite indexes, and DLQ
python3 database/db.py

# Populate realistic Indian elder profiles and pre-configured test users
python3 database/seed_data.py
```

### Pre-Configured Demo Accounts (Password for all: `password123`)
- **Parent (Elder):** Username `joe` • Code `JOE-7401` (Age 74, Bengaluru)
- **Family (Child):** Username `sam` • Code `SAM-2890` (Son in Pune)
- **Caregiver (Nurse):** Username `priya` (Registered Nurse, Bengaluru Circle)
- **Doctor (Cardiologist):** Username `dr_sharma` (Manipal Hospital)
- **Admin / Ops:** Accessible directly via the **🛠️ Admin Panel** on the login screen.

---

## 11. How to Run the Backend

```bash
python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```
- **API Base:** `http://localhost:8000`
- **Swagger Documentation:** `http://localhost:8000/docs`

---

## 12. How to Run the Frontend

```bash
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173
```
- **Mobile Web App:** `http://localhost:5173`
- The application automatically detects your screen size: on desktop, it displays in a sleek 430px smartphone canvas; on physical phones and in the APK, it displays 100% full-screen.

---

## 13. How to Run the Data Pipeline

To trigger the complete 4-stage inter-DAG pipeline via script:

```bash
python3 -c "from dags.orchestrator import run_inter_dag_pipeline; print(run_inter_dag_pipeline())"
```

To run the interactive Streamlit prototype:
```bash
streamlit run app.py
```

---

## 14. How to Run Tests

Execute the complete automated test harness (10 tests):

```bash
python3 -m pytest -v
```

Expected output:
```text
tests/test_deterministic_dags.py::test_edge_inactivity_watchdog PASSED          [ 10%]
tests/test_deterministic_dags.py::test_edge_dedup_storm PASSED                  [ 20%]
tests/test_deterministic_dags.py::test_edge_poison_pill_quarantine PASSED        [ 30%]
tests/test_deterministic_dags.py::test_edge_out_of_order_stream PASSED          [ 40%]
tests/test_deterministic_dags.py::test_edge_role_based_dispatch_granularity PASSED [ 50%]
tests/test_mobile_core_features.py::test_feature_1_independent_accounts_and_login PASSED [ 60%]
tests/test_mobile_core_features.py::test_feature_2_connection_request_and_acceptance PASSED [ 70%]
tests/test_mobile_core_features.py::test_feature_3_prescriptions_and_permissions PASSED [ 80%]
tests/test_mobile_core_features.py::test_feature_4_voice_messages_with_speech_to_text PASSED [ 90%]
tests/test_mobile_core_features.py::test_feature_5_location_sharing_and_help_requests PASSED [100%]
============================== 10 passed in 1.16s ==============================
```

---

## 15. API Documentation

Comprehensive endpoint specifications, request payloads, and response structures are documented in [docs/api/API_REFERENCE.md](docs/api/API_REFERENCE.md).

Primary API groups:
- **Authentication:** `POST /api/auth/register`, `POST /api/auth/login`
- **Family Connections:** `POST /api/connections/request`, `GET /api/connections/{id}`, `PATCH /api/connections/{id}/accept`
- **Location Tracking:** `POST /api/location/share`, `GET /api/location/{parent_id}/latest`
- **Voice Messaging:** `POST /api/voice/send`, `GET /api/voice/{user_id}/inbox`
- **Prescriptions:** `GET /api/prescriptions/{parent_id}`, `POST /api/prescriptions`
- **Data Engineering Ops:** `POST /api/pipeline/run`, `POST /api/pipeline/simulate-edge-case`

---

## 16. Security & Privacy Notes

- **Role Isolation:** Each user role only accesses authorized API scopes. Caregiver feeds mask sensitive family financial records and personal diagnoses.
- **Self-Connection Guard:** Client and server prevent users from connecting to their own invitation code.
- **No Production Secrets in Git:** Sensitive environment variables (`JWT_SECRET`, `TWILIO_AUTH_TOKEN`) are ignored via `.gitignore` and documented solely in `.env.example`.
- **Zero Real Patient Data:** All seed records represent fictitious Indian demographic personas for academic demonstration.

---

## 17. Troubleshooting

Detailed diagnostics for common questions (e.g. Render cold start, "Failed to fetch", port conflicts) are documented in [docs/troubleshooting/TROUBLESHOOTING.md](docs/troubleshooting/TROUBLESHOOTING.md).

- **"Failed to fetch" on Render:** The free backend sleeps after 15 minutes of inactivity. When tapping Connect, wait 15–20 seconds for the container to wake up and tap Send again.
- **"You cannot send a connection request to yourself":** Log in as **Sam** (Child) or create a Child test user via the Admin Panel, then enter Joe's code `JOE-7401`.

---

## 18. Development Timeline

The week-by-week chronological evolution of the project from inception to deployment is documented in [docs/development-workflow/DEVELOPMENT_TIMELINE.md](docs/development-workflow/DEVELOPMENT_TIMELINE.md).

- **Week 1 (Aug 15–17):** Problem identification, initial proposal, and scope definition.
- **Week 2 (Aug 18–29):** Requirements engineering and competitive landscape analysis.
- **Week 3 (Aug 21–Sep 1):** Relational schema design and 4-stage batch ETL pipeline.
- **Week 4 (Aug 31–Sep 11):** Interactive Streamlit prototype and Lab 4/5 evaluation.
- **Week 5 (Sep 21–Oct 3):** Modular ingestion, 4-tier validation, DLQ, and B-Tree indexing.
- **Week 6 (Oct 4–11):** Sliding-window SHA-256 deduplication and Airflow inter-DAG orchestration.
- **Week 7 (Oct 12–17):** Deterministic test harness, FastAPI backend, React mobile client, and Android APK.
- **Week 8 (Oct 18–26):** Telephony notification gateway design and Render cloud deployment.
- **Week 9 (Oct 27–Nov 10):** Production packaging, repository restructuring, and final validation.

---

## 19. Current Roadmap

Project deliverables categorized into **Completed (Verified)**, **In Progress**, and **Planned** are maintained in [docs/development-workflow/PROJECT_ROADMAP.md](docs/development-workflow/PROJECT_ROADMAP.md).

---

## 20. Contribution Workflow

Guidelines for branching, Conventional Commits, code standards, and pull request procedures are detailed in [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License & Attribution

ParentCare360 is developed as a Data Engineering (DE) capstone system by **Group 18**.  
All rights reserved © 2026.
