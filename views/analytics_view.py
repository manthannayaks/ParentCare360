import streamlit as st
import pandas as pd
from database.db import get_connection

def render_analytics_view():
    st.title("📈 ParentCare360 Analytics Dashboard")
    st.markdown("Operational data engineering insights derived from ParentCare360 database records.")

    conn = get_connection()

    # KPI Metrics
    parents_df = pd.read_sql_query("SELECT COUNT(*) as cnt FROM parents", conn)
    appts_df = pd.read_sql_query("SELECT COUNT(*) as cnt FROM appointments", conn)
    visits_df = pd.read_sql_query("SELECT COUNT(*) as cnt FROM caregiver_visits WHERE status = 'Completed'", conn)
    reqs_df = pd.read_sql_query("SELECT COUNT(*) as cnt FROM household_requests WHERE status = 'Pending'", conn)

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total Parents", parents_df.iloc[0]['cnt'])
    c2.metric("Total Appointments", appts_df.iloc[0]['cnt'])
    c3.metric("Completed Visits", visits_df.iloc[0]['cnt'])
    c4.metric("Pending Requests", reqs_df.iloc[0]['cnt'])

    st.markdown("---")

    col_chart1, col_chart2 = st.columns(2)

    with col_chart1:
        st.subheader("1. Care Events Breakdown by Type")
        events_df = pd.read_sql_query("""
        SELECT event_type, COUNT(*) as Count
        FROM care_events
        GROUP BY event_type
        """, conn)
        if not events_df.empty:
            events_chart = events_df.set_index("event_type")
            st.bar_chart(events_chart)
        else:
            st.info("No events available for charting.")

    with col_chart2:
        st.subheader("2. Household Request Status Distribution")
        req_status_df = pd.read_sql_query("""
        SELECT status, COUNT(*) as Count
        FROM household_requests
        GROUP BY status
        """, conn)
        if not req_status_df.empty:
            req_chart = req_status_df.set_index("status")
            st.bar_chart(req_chart)
        else:
            st.info("No request status data available.")

    st.markdown("---")
    col_chart3, col_chart4 = st.columns(2)

    with col_chart3:
        st.subheader("3. Appointment Status Breakdown")
        apt_status_df = pd.read_sql_query("""
        SELECT status, COUNT(*) as Count
        FROM appointments
        GROUP BY status
        """, conn)
        if not apt_status_df.empty:
            apt_chart = apt_status_df.set_index("status")
            st.bar_chart(apt_chart)
        else:
            st.info("No appointment status data available.")

    with col_chart4:
        st.subheader("4. Caregiver Visit Status Summary")
        visit_status_df = pd.read_sql_query("""
        SELECT status, COUNT(*) as Count
        FROM caregiver_visits
        GROUP BY status
        """, conn)
        if not visit_status_df.empty:
            v_chart = visit_status_df.set_index("status")
            st.bar_chart(v_chart)
        else:
            st.info("No caregiver visit data available.")

    conn.close()
