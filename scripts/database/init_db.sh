#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/../.." >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "Initializing SQLite database with WAL mode and composite indexes..."
PYTHONPATH=. python3 database/db.py
echo "Done."
