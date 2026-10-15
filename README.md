# ParentCare360 — Mobile-First Remote Elder-Care Coordination Platform

ParentCare360 is an elder-care coordination platform designed for children living away from their aging parents to coordinate healthcare, communication, ride pickups, caregiver services, and daily needs. Developed as an advanced college **Data Engineering (DE)** project.

---

## 📱 Mobile Architecture & Key Features

1. **Independent Account Creation & Persistent Role Authentication**:
   - Independent account onboarding with hashed credentials and unique invitation codes (e.g. `JOE-7401`, `SAM-2890`).
   - Four distinct user experiences: **Parent**, **Child / Family Member**, **Caregiver**, and **Doctor**.
   - No mixed dashboards — each role logs into their dedicated interface.

2. **Parent–Child Connection Requests & Granular Consent Permissions**:
   - Privacy-preserving discovery by invitation code or username.
   - Pending request handshake with Accept / Decline flow.
   - Granular ABAC permissions for viewing prescriptions, receiving location shares, voice notes, and booking caregiver visits.

3. **Healthcare, Prescriptions & Clinic Appointments**:
   - Parent manages daily medications, dosages, and prescribing doctors.
   - Backend-enforced authorization (`403 Forbidden` if revoked or unconnected).
   - Coordinated doctor appointments with status tracking.

4. **Real Voice Messages with Speech-to-Text**:
   - Audio recording via `MediaRecorder` saved as playable audio.
   - Live speech recognition for English (`en-IN`) and Hindi (`hi-IN`).
   - Dual-linked persistence of original recording and transcript.

5. **Location Sharing, Help Requests & Ride Coordination**:
   - Real-time GPS location sharing with accuracy and battery telemetry.
   - Location freshness badges: **Current (Live)** (<15m), **Recent** (<2h), or **Stale**.
   - Direct Google Maps deep-link navigation.
   - Honest ride coordination status workflow (`Submitted` -> `Acknowledged` -> `Assistance Being Arranged` -> `Completed`).

6. **Data Engineering ETL & Airflow DAGs**:
   - Sliding-window 60-second deduplication eliminating alarm storms.
   - Poison-pill Dead Letter Queue (DLQ) isolating malformed sensor streams.
   - Hourly telemetry aggregation producing Gold analytical datasets.

---

## 🛠️ Technology Stack

* **Frontend**: React 18, Vite 6, Capacitor 6 (Android native bridge), Lucide Icons, Vanilla CSS Design System.
* **Backend**: FastAPI (Python 3.9+ / Starlette ASGI), WebSockets (`/ws/alerts`), SQLite (`database/parentcare360.db`).
* **Data Engineering**: Apache Airflow DAGs, Pytest, Pandas.
* **Mobile Packaging**: Android Gradle Build-Tools, debug APK compilation (`ParentCare360.apk`).

---

## 🚀 Quick Start Guide

### 1. Prerequisites
* Python 3.9+
* Node.js 18+ and npm
* Android SDK / Android phone (for APK testing)

### 2. Backend Setup
```bash
# Clone the repository
git clone https://github.com/manthannayaks/ParentCare360.git
cd ParentCare360

# Install Python dependencies
pip install fastapi uvicorn pytest pydantic httpx

# Initialize and seed database
python3 -m database.seed_data

# Start FastAPI server
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```
Open `http://localhost:5173` in your browser.

### 4. Build or Install Mobile APK
A pre-built Android APK is available in the repository:
* Root folder: `ParentCare360-debug.apk`
* Frontend folder: `frontend/ParentCare360.apk`

To rebuild the APK from source:
```bash
./build_apk.sh
```

---

## 🧪 Testing

Run all deterministic Data Engineering DAG tests and mobile integration tests:
```bash
python3 -m pytest tests/ -v
```
*(All 10 tests execute deterministically in ~1.3 seconds)*

---

## 👥 Pre-seeded Demonstration Personas

| Name | Role | Username | Password | Invitation Code | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Joe** | Parent | `joe` | `password123` | `JOE-7401` | Simple elder UI: Voice notes, location share, help requests |
| **Sam** | Child / Son | `sam` | `password123` | `SAM-2890` | Coordinator UI: Parent search, health records, ride pickup |
| **Priya Verma** | Caregiver | `priya` | `password123` | — | Field nurse roster & vitals check-in |
| **Dr. Sharma** | Doctor | `dr_sharma` | `password123` | — | Patient consultations & clinic notes |
| **Ops Admin** | DE Admin | — | — | — | Airflow DAG evaluation & DLQ inspection |
