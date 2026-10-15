import streamlit as st
from models.journey_model import get_all_journeys, update_journey_status

def render_journey_view():
    st.title("🚗 Elder Journey & Location Simulation (Optional Feature A)")
    st.markdown("Simulate elder travel updates (e.g. Jodhpur ➔ Pune) with location timeline updates.")

    journeys = get_all_journeys()
    if not journeys:
        st.info("No active travel journeys.")
    else:
        for j in journeys:
            badge = "🟢 Arrived" if j['status'] == "Arrived" else ("🚗 In Transit" if j['status'] == "In Transit" else "🛫 Scheduled")

            with st.expander(f"{badge} | {j['parent_name']} ({j['origin']} ➔ {j['destination']})", expanded=True):
                col1, col2 = st.columns([3, 2])

                with col1:
                    st.markdown(f"**Parent:** {j['parent_name']}")
                    st.markdown(f"**Origin:** {j['origin']} ➔ **Destination:** {j['destination']}")
                    st.markdown(f"**Departure:** {j['departure_time']} | **Arrival:** {j['arrival_time']}")
                    st.markdown(f"**Current Status:** `{j['status']}`")
                    st.markdown(f"**Current Location:** `{j['current_location']}`")

                with col2:
                    st.markdown("**Update Journey Simulation:**")
                    new_st = st.selectbox("Journey State:", ["Scheduled", "Departure", "In Transit", "Arrived"], key=f"j_st_{j['id']}")
                    curr_loc = st.text_input("Updated Location:", value=j['current_location'], key=f"j_loc_{j['id']}")
                    if st.button("Update Journey", key=f"j_btn_{j['id']}"):
                        update_journey_status(j['id'], new_st, curr_loc)
                        st.success(f"Journey updated to {new_st}!")
                        st.rerun()
