#!/bin/bash
set -e

echo "=========================================================="
echo "  ParentCare360: System Startup & Orchestrator Runner"
echo "=========================================================="

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "1. Initializing SQLite Database (WAL mode, Indexes, DLQ)..."
PYTHONPATH=. python3 database/db.py

echo "2. Populating realistic Indian elder seed records..."
PYTHONPATH=. python3 database/seed_data.py

echo "3. Running Deterministic Edge-Case Test Suite..."
PYTHONPATH=. python3 -m pytest tests/test_deterministic_dags.py -q

echo "4. Starting FastAPI Backend on http://localhost:8000..."
nohup python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend running (PID: $BACKEND_PID, Log: backend.log)"

echo "5. Starting Vite Frontend on http://localhost:5173..."
cd frontend
nohup npm run dev -- --host 0.0.0.0 --port 5173 > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend running (PID: $FRONTEND_PID, Log: frontend.log)"

echo ""
echo "=========================================================="
echo "  🚀 ParentCare360 is LIVE and ready for demonstration!"
echo "=========================================================="
echo "  🌐 Web & Phone Frame App: http://localhost:5173"
echo "  🔌 FastAPI Documentation: http://localhost:8000/docs"
echo "  ⚙️ Inter-DAG Orchestration: http://localhost:8000/api/pipeline/quarantine"
echo ""
echo "  To stop services:"
echo "    kill $BACKEND_PID $FRONTEND_PID"
echo "=========================================================="
