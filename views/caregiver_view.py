import streamlit as st
from datetime import datetime, date
from models.parent_model import get_all_parents
from models.caregiver_model import (
    get_all_caregivers, add_caregiver, get_all_visits,
    schedule_visit, update_visit_status
)

def render_caregiver_view():
    st.title("🧑‍⚕️ Caregiver Visit Management")

    parents = get_all_parents()
    caregivers = get_all_caregivers()

    if not parents:
        st.warning("No parents found. Please add a parent first.")
        return

    tab1, tab2, tab3 = st.tabs(["📅 Caregiver Visits", "➕ Schedule Visit", "👩‍⚕️ Caregiver Directory"])

    with tab1:
        st.subheader("Scheduled & Historic Caregiver Visits")
        visits = get_all_visits()
        if not visits:
            st.info("No caregiver visits logged yet.")
        else:
            for v in visits:
                badge = "✅" if v['status'] == "Completed" else ("❌" if v['status'] == "Missed" else "🕒")
                with st.expander(f"{badge} {v['scheduled_datetime']} - {v['caregiver_name']} ➔ {v['parent_name']} ({v['status']})", expanded=True):
                    c1, c2 = st.columns([3, 2])
                    with c1:
                        st.markdown(f"**Parent:** {v['parent_name']}")
                        st.markdown(f"**Caregiver:** {v['caregiver_name']} ({v['caregiver_role']})")
                        st.markdown(f"**Scheduled Date/Time:** {v['scheduled_datetime']}")
                        if v['actual_completion_datetime']:
                            st.markdown(f"**Actual Completion Time:** {v['actual_completion_datetime']}")
                        st.markdown(f"**Visit Notes:** {v['visit_notes'] or 'None'}")

                    with c2:
                        st.markdown("**Update Status:**")
                        notes_input = st.text_input("Visit Notes:", value=v['visit_notes'] or "", key=f"v_notes_{v['id']}")
                        col_btn1, col_btn2 = st.columns(2)
                        
                        if col_btn1.button("Mark Completed", key=f"cmpl_{v['id']}"):
                            now_ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                            update_visit_status(v['id'], "Completed", now_ts, notes_input)
                            st.success("Visit marked as Completed!")
                            st.rerun()

                        if col_btn2.button("Mark Missed", key=f"msd_{v['id']}"):
                            update_visit_status(v['id'], "Missed", visit_notes=notes_input)
                            st.warning("Visit marked as Missed!")
                            st.rerun()

    with tab2:
        st.subheader("➕ Schedule Caregiver Visit")
        if not caregivers:
            st.warning("No caregivers available in directory. Please add a caregiver first.")
        else:
            with st.form("schedule_visit_form"):
                p_opts = {f"{p['full_name']} (ID: {p['id']})": p['id'] for p in parents}
                cg_opts = {f"{cg['full_name']} ({cg['role']} - {cg['city']})": cg['id'] for cg in caregivers}

                target_p = st.selectbox("Select Parent *", list(p_opts.keys()))
                target_cg = st.selectbox("Select Caregiver *", list(cg_opts.keys()))

                v_date = st.date_input("Scheduled Date *", value=date.today())
                v_time = st.time_input("Scheduled Time *")
                notes = st.text_area("Visit Instructions / Care Plan Notes", value="Routine vital signs & assistance")

                submitted = st.form_submit_button("Schedule Visit")
                if submitted:
                    pid = p_opts[target_p]
                    cgid = cg_opts[target_cg]
                    sched_ts = f"{v_date.strftime('%Y-%m-%d')} {v_time.strftime('%H:%M:%S')}"
                    schedule_visit(pid, cgid, sched_ts, notes)
                    st.success("Caregiver visit scheduled successfully!")
                    st.rerun()

    with tab3:
        st.subheader("👩‍⚕️ Caregiver Roster")
        for cg in caregivers:
            st.markdown(f"- **{cg['full_name']}** | Role: `{cg['role']}` | City: `{cg['city']}` | Phone: `{cg['phone']}`")
        
        st.markdown("---")
        st.subheader("➕ Register New Caregiver")
        with st.form("add_caregiver_form"):
            cg_name = st.text_input("Caregiver Full Name *")
            cg_phone = st.text_input("Phone Number *", value="+91 ")
            cg_role = st.selectbox("Role / Specialty *", ["Registered Nurse", "Physiotherapist", "Elderly Care Assistant", "Doctor Companion"])
            cg_city = st.text_input("Assigned City *", value="Jodhpur")

            if st.form_submit_button("Register Caregiver"):
                if cg_name and cg_phone:
                    add_caregiver(cg_name, cg_phone, cg_role, cg_city)
                    st.success(f"Caregiver {cg_name} added to roster!")
                    st.rerun()
                else:
                    st.error("Please provide name and phone number.")
