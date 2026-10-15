import streamlit as st
import pandas as pd
from datetime import date
from models.parent_model import get_all_parents
from models.appointment_model import get_all_appointments, create_appointment, update_appointment_status

def render_healthcare_view():
    st.title("🏥 Healthcare & Appointment Workflow")

    parents = get_all_parents()
    if not parents:
        st.warning("No parents found. Please register a parent first.")
        return

    tab1, tab2 = st.tabs(["📅 Appointments List", "➕ Schedule New Appointment"])

    with tab1:
        st.subheader("Doctor Appointments")
        parent_filter = st.selectbox("Filter by Parent:", ["All Parents"] + [f"{p['full_name']} (ID: {p['id']})" for p in parents])

        if parent_filter == "All Parents":
            appts = get_all_appointments()
        else:
            pid = int(parent_filter.split("ID: ")[1].replace(")", ""))
            appts = get_all_appointments(parent_id=pid)

        if not appts:
            st.info("No appointments found for the selected view.")
        else:
            for apt in appts:
                status_color = "🟢" if apt['status'] == "Completed" else ("🔴" if apt['status'] == "Cancelled" else "🟡")
                with st.expander(f"{status_color} {apt['appointment_date']} at {apt['appointment_time']} - {apt['doctor_name']} ({apt['parent_name']})", expanded=True):
                    col_info, col_act = st.columns([3, 1])

                    with col_info:
                        st.markdown(f"**Parent:** {apt['parent_name']}")
                        st.markdown(f"**Doctor:** {apt['doctor_name']}")
                        st.markdown(f"**Hospital / Clinic:** {apt['hospital_clinic']}")
                        st.markdown(f"**Purpose:** {apt['purpose']}")
                        st.markdown(f"**Current Status:** `{apt['status']}`")

                    with col_act:
                        st.markdown("**Update Status:**")
                        new_st = st.selectbox(
                            "Status:",
                            ["Upcoming", "Completed", "Cancelled"],
                            index=["Upcoming", "Completed", "Cancelled"].index(apt['status']),
                            key=f"apt_st_{apt['id']}"
                        )
                        if st.button("Update Status", key=f"btn_apt_{apt['id']}"):
                            update_appointment_status(apt['id'], new_st)
                            st.success(f"Updated status to '{new_st}'")
                            st.rerun()

    with tab2:
        st.subheader("➕ Schedule New Doctor Appointment")
        with st.form("create_appointment_form"):
            p_opts = {f"{p['full_name']} (ID: {p['id']})": p['id'] for p in parents}
            target_p = st.selectbox("Parent *", list(p_opts.keys()))
            doctor = st.text_input("Doctor Name *", value="Dr. A. K. Sharma")
            hospital = st.text_input("Hospital / Clinic *", value="AIIMS Jodhpur")
            apt_d = st.date_input("Appointment Date *", value=date.today())
            apt_t = st.time_input("Appointment Time *")
            purpose = st.text_input("Purpose of Visit *", value="Routine Health Checkup")
            status = st.selectbox("Status", ["Upcoming", "Completed", "Cancelled"])

            sub = st.form_submit_button("Schedule Appointment")
            if sub:
                if doctor and hospital and purpose:
                    pid = p_opts[target_p]
                    time_str = apt_t.strftime("%I:%M %p")
                    date_str = apt_d.strftime("%Y-%m-%d")
                    create_appointment(pid, doctor, hospital, date_str, time_str, purpose, status)
                    st.success("Appointment scheduled successfully!")
                    st.rerun()
                else:
                    st.error("Please fill in doctor name, hospital, and purpose.")
