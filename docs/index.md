# ParentCare360 — Engineering Documentation Hub

Welcome to the comprehensive technical documentation for **ParentCare360 (Comprehensive Remote Elder-Care Coordination and Monitoring System)**.

This documentation suite details the architectural design, data engineering pipelines, physical database models, API contracts, testing methodologies, deployment procedures, and development history of the platform.

---

## Documentation Directory

```
docs/
├── index.md                            # Documentation Master Index (this document)
│
├── architecture/
│   └── ARCHITECTURE.md                 # System Architecture, Components & Data Flow
│
├── data-engineering/
│   └── DATA_ENGINEERING.md             # Ingestion, 4-Tier DLQ, Alert Engine & Lineage
│
├── database/
│   └── DATABASE_DESIGN.md              # Physical SQLite WAL Schema & Query Optimization
│
├── development-workflow/
│   ├── DEVELOPMENT_TIMELINE.md         # Chronological Week-by-Week Engineering Chronicle
│   └── PROJECT_ROADMAP.md              # Verified Completed, In Progress & Planned Work
│
├── api/
│   └── API_REFERENCE.md                # FastAPI REST API Endpoints, Models & Contracts
│
├── testing/
│   └── TESTING_STRATEGY.md             # Deterministic Harness, Scenarios & Benchmark Results
│
├── deployment/
│   └── DEPLOYMENT_GUIDE.md             # Render Cloud Hosting & Android APK Compilation
│
├── decisions/
│   └── DECISION_RECORDS.md             # Architectural Decision Records (ADRs)
│
└── troubleshooting/
    └── TROUBLESHOOTING.md              # Common Diagnostics, Network Issues & Fixes
```

---

## Quick Reference Guide

| Topic | Document Link | Key Information |
| :--- | :--- | :--- |
| **System Architecture** | [architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md) | Multi-tier topology, persona boundaries (Parent, Family, Caregiver, Doctor, Admin), event-driven micro-DAGs. |
| **Data Pipelines & DLQ** | [data-engineering/DATA_ENGINEERING.md](data-engineering/DATA_ENGINEERING.md) | 4-tier validation, Dead Letter Queue (`quarantine_records`), sliding-window SHA-256 deduplication, W3C PROV lineage. |
| **Database Design** | [database/DATABASE_DESIGN.md](database/DATABASE_DESIGN.md) | 22 relational tables, SQLite WAL mode concurrency, composite B-Tree indexes, 840x query acceleration benchmarks. |
| **Development Timeline** | [development-workflow/DEVELOPMENT_TIMELINE.md](development-workflow/DEVELOPMENT_TIMELINE.md) | Week-by-week chronicle from problem identification (Aug 2026) to production release (Nov 2026). |
| **Project Roadmap** | [development-workflow/PROJECT_ROADMAP.md](development-workflow/PROJECT_ROADMAP.md) | Granular matrix of Completed (Verified), In Progress, and Planned work with task IDs and acceptance criteria. |
| **REST API Reference** | [api/API_REFERENCE.md](api/API_REFERENCE.md) | Endpoints for authentication, family connection handshake, audio voice notes, GPS tracking, and pipeline simulations. |
| **Testing Strategy** | [testing/TESTING_STRATEGY.md](testing/TESTING_STRATEGY.md) | Deterministic test harness validating 5 real-world edge cases with frozen-clock fixtures, achieving 100% pass rates. |
| **Deployment & Build** | [deployment/DEPLOYMENT_GUIDE.md](deployment/DEPLOYMENT_GUIDE.md) | Render blueprint configuration (`render.yaml`), Capacitor Android project sync, and Gradle APK compilation. |
| **Architectural Decisions** | [decisions/DECISION_RECORDS.md](decisions/DECISION_RECORDS.md) | ADR-01 through ADR-06 covering SQLite WAL, JSON granules, Airflow Datasets, role-based mobile isolation. |
| **Troubleshooting Guide** | [troubleshooting/TROUBLESHOOTING.md](troubleshooting/TROUBLESHOOTING.md) | Resolving "Failed to fetch", Render free-tier cold starts, CORS configuration, and self-connection prevention. |

---

## Architectural Principles

1. **Role Boundary Isolation:** Users only see the interface of the persona they logged in as. Caregivers receive operational checklists with sensitive medical history masked; family sponsors receive full emergency escalations.
2. **Zero-Loss Data Quality Containment:** Corrupted rows are never dropped silently. They are trapped by the 4-tier validation engine and routed to `quarantine_records` (Dead Letter Queue) with structured error codes.
3. **Deterministic Alert Deduplication:** Flapping IoT sensors or network retries are checked against a stateful sliding-window SHA-256 deduplication cache, preventing panic-inducing alarm flooding storms.
4. **Physical Performance Optimization:** Covering composite B-Tree indexes eliminate table scans during high-frequency (60s) alert scans, accelerating query seek times by 840x under SQLite WAL concurrency.
