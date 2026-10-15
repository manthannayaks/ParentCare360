import os
import pandas as pd
from config import RAW_DATA_DIR

def extract_raw_csv(filename):
    """
    Extract: Reads synthetic CSV files from raw data directory.
    """
    filepath = os.path.join(RAW_DATA_DIR, filename)
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Raw data file not found: {filepath}")

    df = pd.read_csv(filepath)
    print(f"[ETL EXTRACT] Extracted {len(df)} raw records from {filename}")
    return df
