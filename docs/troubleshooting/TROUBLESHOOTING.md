# ParentCare360 — Troubleshooting & Diagnostic Guide

## 1. Common Diagnostics & Solutions

### Issue 1: "Failed to fetch" When Sending Connection Request
- **Symptom:** In the Family screen, tapping "Send Connection Request" displays `Network error connecting to API... Failed to fetch`.
- **Root Cause A (Render Cold Start):** On Render's free tier, the backend web service spins down after 15 minutes of inactivity. When accessed again, the container requires 30–50 seconds to boot up (cold start). Requests made during boot time time out.
  - **Resolution:** Wait 15–20 seconds and tap "Send Connection Request" again. Once awake, the server responds in milliseconds.
- **Root Cause B (Mixed Content HTTP vs. HTTPS):** If accessing the web app at `https://parentcare360-web.onrender.com` (HTTPS), but the client's `apiBase` was configured to `http://localhost:8000` (HTTP), modern browsers block the request due to Mixed Content security rules.
  - **Resolution:** On the mobile login screen, check the API indicator at the bottom. If it says `localhost:8000`, tap **Configure Backend**, enter `https://parentcare360-api.onrender.com`, and tap Save.
- **Root Cause C (Testing on Phone/APK):** A physical smartphone or Android emulator cannot reach `localhost:8000` because `localhost` refers to the mobile device itself.
  - **Resolution:** Set the backend URL to your machine's local LAN IP (e.g. `http://192.168.1.100:8000`) or the live cloud URL `https://parentcare360-api.onrender.com`.

---

### Issue 2: "You cannot send a connection request to yourself"
- **Symptom:** Error banner in red when submitting parent invitation code.
- **Root Cause:** Attempting to connect to the invitation code belonging to the currently authenticated user (e.g., logged in as Joe and submitting `JOE-7401`).
- **Resolution:** Log out to the Login Screen. Log in as **Sam** (Child/Family member) or use the **Admin Panel** to create a dedicated Child test user, then enter Joe's code `JOE-7401`.

---

### Issue 3: SQLite "database is locked" Error
- **Symptom:** Write transactions fail with `sqlite3.OperationalError: database is locked`.
- **Root Cause:** A long-running read process holding exclusive locks, or concurrent writers outside WAL mode.
- **Resolution:** Ensure WAL mode is active:
  ```bash
  python3 -c "import sqlite3; conn = sqlite3.connect('data/parentcare360.db'); print(conn.execute('PRAGMA journal_mode;').fetchone())"
  ```
  Should return `('wal',)`. If not, run `python3 database/db.py`.

---

### Issue 4: Vite Dev Server Port Conflict
- **Symptom:** `Port 5173 is in use, trying another one...`
- **Resolution:** Stop existing background Vite processes:
  ```bash
  lsof -ti :5173 | xargs kill -9
  ```
