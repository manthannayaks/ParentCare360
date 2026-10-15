import streamlit as st
from database.db import get_connection
from utils.alert_engine import evaluate_automatic_alerts

def render_dashboard():
    st.title("📊 ParentCare360 Overview Dashboard")
    st.markdown("##### *Comprehensive Remote Elder-Care Coordination & Monitoring System*")

    # Run quick background check for alerts
    evaluate_automatic_alerts()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as count FROM parents")
    total_parents = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM appointments")
    total_appts = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM caregiver_visits WHERE status = 'Completed'")
    completed_visits = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM household_requests WHERE status = 'Pending'")
    pending_reqs = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM alerts WHERE is_resolved = 0")
    open_alerts = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM care_events")
    total_events = cursor.fetchone()['count']

    conn.close()

    # KPI Metrics Row 1
    col1, col2, col3 = st.columns(3)
    col1.metric("👴 Total Parents", total_parents)
    col2.metric("🏥 Total Appointments", total_appts)
    col3.metric("🧑‍⚕️ Completed Visits", completed_visits)

    # KPI Metrics Row 2
    col4, col5, col6 = st.columns(3)
    col4.metric("🛠️ Pending Requests", pending_reqs, delta="-Requires Attention" if pending_reqs > 0 else "All clear", delta_color="inverse")
    col5.metric("🔔 Open Alerts", open_alerts, delta=f"{open_alerts} Active" if open_alerts > 0 else "0 Active", delta_color="inverse")
    col6.metric("📅 Total Care Events", total_events)

    st.markdown("---")

    col_left, col_right = st.columns([3, 2])

    with col_left:
        st.subheader("🔔 Active System Alerts")
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT a.*, p.full_name as parent_name
        FROM alerts a
        JOIN parents p ON a.parent_id = p.id
        WHERE a.is_resolved = 0
        ORDER BY a.created_at DESC
        LIMIT 5
        """)
        alerts = cursor.fetchall()
        conn.close()

        if alerts:
            for alt in alerts:
                sev = alt['severity']
                if sev == 'Critical':
                    st.error(f"**[{alt['parent_name']}]** {alt['alert_type']}: {alt['message']}")
                elif sev == 'Warning':
                    st.warning(f"**[{alt['parent_name']}]** {alt['alert_type']}: {alt['message']}")
                else:
                    st.info(f"**[{alt['parent_name']}]** {alt['alert_type']}: {alt['message']}")
        else:
            st.success("No active alerts! All parents are well-monitored.")

    with col_right:
        st.subheader("⚡ Quick Actions")
        if st.button("🔄 Trigger Alert Engine", use_container_width=True):
            count = evaluate_automatic_alerts()
            st.success(f"Evaluated alert rules! Evaluated/Created alerts: {count}")
            st.rerun()

        if st.button("🌱 Reset / Re-seed Data", use_container_width=True):
            from database.seed_data import seed_all
            seed_all()
            st.success("Database re-seeded with clean synthetic data!")
            st.rerun()
