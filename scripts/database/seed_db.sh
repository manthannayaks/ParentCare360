#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/../.." >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "Populating ParentCare360 realistic Indian elder demo accounts..."
PYTHONPATH=. python3 database/seed_data.py
echo "Done."
