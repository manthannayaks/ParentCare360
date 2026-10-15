import streamlit as st
from models.parent_model import get_all_parents
from models.event_model import get_care_events

def render_timeline_view():
    st.title("📅 Parent-Care Unified Activity Timeline")
    st.markdown("Chronological feed combining **Appointments**, **Caregiver Visits**, **Household Requests**, and **Alerts**.")

    parents = get_all_parents()
    if not parents:
        st.warning("No parents found.")
        return

    p_options = {"All Parents": None}
    p_options.update({f"{p['full_name']} (ID: {p['id']})": p['id'] for p in parents})

    selected_p_label = st.selectbox("Filter Timeline by Parent:", list(p_options.keys()))
    selected_pid = p_options[selected_p_label]

    events = get_care_events(parent_id=selected_pid, limit=100)

    if not events:
        st.info("No timeline events logged yet.")
    else:
        st.markdown("### Activity Timeline")
        for ev in events:
            ev_type = ev['event_type']
            if ev_type == "Appointment":
                icon = "🏥"
            elif ev_type == "Caregiver Visit":
                icon = "🧑‍⚕️"
            elif ev_type == "Household Request":
                icon = "🛠️"
            elif ev_type == "Alert":
                icon = "🔔"
            else:
                icon = "📌"

            with st.container():
                c1, c2 = st.columns([1, 4])
                with c1:
                    st.caption(f"⏱️ {ev['timestamp']}")
                    st.markdown(f"**{icon} {ev['event_type']}**")
                    st.code(ev['status'])
                with c2:
                    st.markdown(f"#### {ev['title']} ({ev['parent_name']})")
                    st.markdown(ev['description'])
                st.markdown("---")
