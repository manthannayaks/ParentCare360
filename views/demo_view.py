import streamlit as st
from datetime import datetime, timedelta
from database.seed_data import seed_all
from models.parent_model import get_all_parents
from models.appointment_model import create_appointment, get_all_appointments
from models.caregiver_model import schedule_visit, update_visit_status, get_all_visits
from models.request_model import create_household_request, get_all_requests
from utils.alert_engine import evaluate_automatic_alerts
from models.event_model import get_care_events

def render_demo_view():
    st.title("🎯 Guided Synthetic Demo Scenario")
    st.markdown("##### *1-Click Interactive Walkthrough of ParentCare360 for Lab 4/5 Viva Evaluation*")
    st.markdown("Target Parent: **Ravi Kumar** (72 years, Jodhpur)")

    st.markdown("---")

    if st.button("🔄 Reset Demo Scenario State", type="secondary", use_container_width=True):
        seed_all()
        st.session_state['demo_step'] = 0
        st.success("Demo scenario state reset to default seed data!")
        st.rerun()

    # Step state control
    step = st.session_state.get('demo_step', 0)

    col_w1, col_w2 = st.columns([1, 1])

    with col_w1:
        st.markdown(f"### Current Step: **Step {step} / 8**")
    with col_w2:
        if st.button("⏩ Advance Next Step", type="primary", use_container_width=True):
            st.session_state['demo_step'] = min(8, step + 1)
            st.rerun()

    st.markdown("---")

    # Step Descriptions & Actions
    steps_info = [
        "**Step 0: Initial Setup** — Reset DB & load initial profiles for Ravi Kumar.",
        "**Step 1: Upcoming Appointment** — Ravi has an upcoming doctor appointment scheduled with Dr. A. K. Sharma.",
        "**Step 2: Caregiver Visit Scheduled** — A morning caregiver visit with nurse Priya Verma is scheduled.",
        "**Step 3: Caregiver Visit Execution** — Caregiver visit becomes overdue or is completed with vital notes.",
        "**Step 4: Household Issue Occurs** — Ravi creates a High-priority household request: 'Bathroom tap is broken'.",
        "**Step 5: Request Pending** — The request remains in 'Pending' state.",
        "**Step 6: Automatic Alert Triggered** — System alert engine automatically generates a Critical/Warning alert.",
        "**Step 7: Care Timeline Aggregation** — Unified Parent-Care Timeline reflects all events chronologically.",
        "**Step 8: Analytics Reflection** — Operational Analytics Dashboard metrics update in real-time."
    ]

    for i, s_desc in enumerate(steps_info):
        if i == step:
            st.info(f"👉 **ACTIVE:** {s_desc}")
        elif i < step:
            st.success(f"✅ **COMPLETED:** {s_desc}")
        else:
            st.caption(f"⚪ **UPCOMING:** {s_desc}")

    st.markdown("---")

    # Step Execution Logic
    if step == 1:
        st.subheader("Step 1: Doctor Appointment Scheduled")
        appts = get_all_appointments(parent_id=1)
        st.write("Current Appointments for Ravi Kumar:")
        st.dataframe(appts)

    elif step == 2:
        st.subheader("Step 2: Scheduling Caregiver Visit")
        visits = get_all_visits(parent_id=1)
        st.write("Caregiver Visits for Ravi Kumar:")
        st.dataframe(visits)

    elif step == 3:
        st.subheader("Step 3: Caregiver Visit Update (Overdue / Completed)")
        if st.button("Mark Caregiver Visit as Overdue & Completed"):
            now_ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            update_visit_status(1, "Completed", actual_completion_datetime=now_ts, visit_notes="Vitals checked, BP 122/80. Assisted morning routine.")
            st.success("Updated caregiver visit to Completed!")
            st.rerun()

    elif step == 4 or step == 5:
        st.subheader("Step 4 & 5: High-Priority Household Request Pending")
        reqs = get_all_requests(parent_id=1)
        st.write("Household Requests for Ravi Kumar:")
        st.dataframe(reqs)

    elif step == 6:
        st.subheader("Step 6: Triggering Automatic Rule-Based Alerts")
        cnt = evaluate_automatic_alerts()
        st.success(f"Alert Engine evaluated rules! Evaluated/Created alerts: {cnt}")
        from models.alert_model import get_all_alerts
        alerts = get_all_alerts(parent_id=1)
        st.dataframe(alerts)

    elif step == 7:
        st.subheader("Step 7: Unified Parent-Care Timeline")
        events = get_care_events(parent_id=1)
        for ev in events:
            st.markdown(f"- **{ev['timestamp']}** | `{ev['event_type']}` | **{ev['title']}** ({ev['status']})")

    elif step == 8:
        st.subheader("Step 8: Analytics Dashboard Summary")
        st.success("All 8 demo steps completed! The system state is fully updated.")
        from views.analytics_view import render_analytics_view
        render_analytics_view()
