# ParentCare360 — Deployment & Packaging Guide

## 1. Production Architecture Overview

ParentCare360 is deployed across two primary targets:
1. **Cloud Hosted Services (Render Infrastructure):**
   - **Backend Web Service (`parentcare360-api`):** Python 3.10 FastAPI server running via Uvicorn.
   - **Static Frontend Web App (`parentcare360-web`):** Single-page React application built with Vite and distributed globally over Cloudflare CDN.
2. **Native Android Client (Capacitor / Gradle):**
   - Packaged Android application (`ParentCare360.apk`) running on Android 7.0+ (API 24+).

---

## 2. Render Blueprint Specification (`render.yaml`)

ParentCare360 includes an Infrastructure-as-Code blueprint (`render.yaml`):

```yaml
services:
  # 1. FastAPI Backend Web Service
  - type: web
    name: parentcare360-api
    runtime: python
    region: oregon
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn api.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.10.12

  # 2. Vite React Frontend Mobile Web App
  - type: web
    name: parentcare360-web
    runtime: static
    rootDir: frontend
    buildCommand: npm install && npm run build
    staticPublishPath: dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

---

## 3. Android APK Compilation Workflow

The project uses `@capacitor/android` to bridge the web frontend into a native Android APK:

```bash
# Automated Build Script
./scripts/deployment/build_apk.sh

# Or Manual Step-by-Step Build:
cd frontend
npm run build
npx cap sync android
cd android
./gradlew assembleDebug --no-daemon
```

- **Output Location:** `frontend/android/app/build/outputs/apk/debug/app-debug.apk`
- **Root Convenience Location:** `ParentCare360.apk`

---

## 4. Local Development Execution

```bash
# 1. Clone repository
git clone https://github.com/manthannayaks/ParentCare360.git
cd ParentCare360

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Initialize database & seed demo accounts
python3 database/db.py
python3 database/seed_data.py

# 4. Start local system (FastAPI on :8000 & Vite on :5173)
./start_system.sh
```
