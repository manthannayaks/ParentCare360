import streamlit as st
import pandas as pd
from etl.pipeline import run_etl_pipeline
from database.db import get_connection

def render_etl_view():
    st.title("🔄 ETL Data Engineering Pipeline")
    st.markdown("Automated Extract-Validate-Transform-Load (ETL) pipeline processing synthetic data feeds into SQLite analytical tables.")

    st.info("📂 Source Directory: `data/raw/` (Files: `raw_appointments.csv`, `raw_requests.csv`)")

    if st.button("🚀 Run ETL Pipeline", type="primary", use_container_width=True):
        with st.spinner("Processing Extract ➔ Validate ➔ Transform ➔ Load..."):
            summary = run_etl_pipeline()

        st.success("ETL Pipeline Executed Successfully!")

        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Total Extracted", summary["total_extracted"])
        c2.metric("Valid Records", summary["total_valid"])
        c3.metric("Invalid Records", summary["total_invalid"], delta=f"{summary['total_invalid']} Rejected", delta_color="inverse")
        c4.metric("Loaded to DB", summary["total_loaded"])

        st.markdown("---")
        st.subheader("⚠️ Data Validation & Quality Error Log")
        if summary["errors"]:
            err_df = pd.DataFrame(summary["errors"])
            st.dataframe(err_df, use_container_width=True)
        else:
            st.success("No validation errors detected!")

    st.markdown("---")
    st.subheader("🔍 Database Analytical Table Previews")
    conn = get_connection()
    tab1, tab2 = st.tabs(["Appointments Table", "Household Requests Table"])

    with tab1:
        appts_df = pd.read_sql_query("SELECT * FROM appointments ORDER BY id DESC LIMIT 15", conn)
        st.dataframe(appts_df, use_container_width=True)

    with tab2:
        reqs_df = pd.read_sql_query("SELECT * FROM household_requests ORDER BY id DESC LIMIT 15", conn)
        st.dataframe(reqs_df, use_container_width=True)

    conn.close()
