import os

# Base directory of the repository
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Data Directories
DATA_DIR = os.getenv("DATA_DIR", os.path.join(BASE_DIR, "data"))
RAW_DATA_DIR = os.getenv("RAW_DATA_DIR", os.path.join(DATA_DIR, "raw"))
DB_PATH = os.getenv("SQLITE_DB_PATH", os.path.join(DATA_DIR, "parentcare360.db"))

# Ensure base directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(RAW_DATA_DIR, exist_ok=True)

# API Server Settings
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", 8000))
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Security
JWT_SECRET = os.getenv("JWT_SECRET", "parentcare360_dev_secret_key_2026")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
