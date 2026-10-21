#!/bin/bash
set -e

# ParentCare360: Local Development Startup Script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/../.." >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "  🚀 Starting ParentCare360 Development Environment"
echo "=========================================================="

echo "1. Verifying database and schema..."
PYTHONPATH=. python3 database/db.py

echo "2. Seeding initial demo accounts..."
PYTHONPATH=. python3 database/seed_data.py

echo "3. Running verification test suite..."
PYTHONPATH=. python3 -m pytest tests/test_deterministic_dags.py -q

echo "4. Launching FastAPI Backend on http://localhost:8000..."
python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
