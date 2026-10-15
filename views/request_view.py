import streamlit as st
from models.parent_model import get_all_parents
from models.request_model import (
    get_all_requests, create_household_request, update_request_status
)
from utils.voice_proto import parse_voice_or_text_request

def render_request_view():
    st.title("🛠️ Household & Daily Need Requests")

    parents = get_all_parents()
    if not parents:
        st.warning("No parents found. Please add a parent first.")
        return

    tab1, tab2, tab3 = st.tabs(["📌 Active & Past Requests", "➕ Create Request", "🎙️ Voice / NLP Request Prototype"])

    with tab1:
        st.subheader("Household Requests Lifecycle")
        reqs = get_all_requests()

        if not reqs:
            st.info("No household requests logged.")
        else:
            for r in reqs:
                badge = "🔴 Pending" if r['status'] == "Pending" else ("🟡 In Progress" if r['status'] == "In Progress" else "🟢 Completed")
                prio_badge = f"🔥 {r['priority']}" if r['priority'] == "High" else f"⚙️ {r['priority']}"

                with st.expander(f"{badge} | {prio_badge} | {r['title']} ({r['parent_name']})", expanded=True):
                    col1, col2 = st.columns([3, 2])
                    with col1:
                        st.markdown(f"**Parent:** {r['parent_name']}")
                        st.markdown(f"**Category:** `{r['category']}` | **Priority:** `{r['priority']}`")
                        st.markdown(f"**Created At:** {r['created_at']}")
                        st.markdown(f"**Details:** {r['notes'] or 'None'}")
                        st.markdown(f"**Status:** `{r['status']}`")

                    with col2:
                        st.markdown("**Update Request Lifecycle:**")
                        new_st = st.selectbox(
                            "Lifecycle Phase:",
                            ["Pending", "In Progress", "Completed"],
                            index=["Pending", "In Progress", "Completed"].index(r['status']),
                            key=f"req_st_{r['id']}"
                        )
                        update_notes = st.text_input("Resolution Notes:", value=r['notes'] or "", key=f"req_nt_{r['id']}")
                        if st.button("Update Request", key=f"req_btn_{r['id']}"):
                            update_request_status(r['id'], new_st, update_notes)
                            st.success(f"Request status updated to '{new_st}'")
                            st.rerun()

    with tab2:
        st.subheader("➕ Create Household Request")
        with st.form("create_request_form"):
            p_opts = {f"{p['full_name']} (ID: {p['id']})": p['id'] for p in parents}
            target_p = st.selectbox("Select Parent *", list(p_opts.keys()))

            req_title = st.text_input("Request Title *", value="Bathroom tap is broken")
            req_cat = st.selectbox("Category *", ["Maintenance", "Grocery", "Utility", "Errand", "Other"])
            req_prio = st.selectbox("Priority *", ["Low", "Medium", "High"])
            req_notes = st.text_area("Detailed Notes / Location", value="Water dripping constantly in main bathroom.")

            if st.form_submit_button("Submit Household Request"):
                if req_title:
                    pid = p_opts[target_p]
                    create_household_request(pid, req_title, req_cat, req_prio, req_notes, status="Pending")
                    st.success(f"Request '{req_title}' created successfully!")
                    st.rerun()
                else:
                    st.error("Please enter a request title.")

    with tab3:
        st.subheader("🎙️ Voice & Text Request Prototype (Optional Feature B)")
        st.markdown("Demonstration of natural language / Hindi-English speech transcript parsing into structured elder-care tickets.")

        sample_prompt = st.text_input(
            "Speak or type request prompt:",
            value="Bathroom ka tap kharab hai aur paani beh raha hai"
        )

        if st.button("⚡ Parse & Extract Ticket Data"):
            parsed = parse_voice_or_text_request(sample_prompt)

            st.success("Successfully Parsed Input via NLP/Keyword Rules:")
            st.json(parsed)

            st.markdown("---")
            st.subheader("Auto-Populated Request Ticket Preview:")
            p_opts = {f"{p['full_name']} (ID: {p['id']})": p['id'] for p in parents}
            selected_parent = st.selectbox("Assign to Parent:", list(p_opts.keys()), key="voice_p_select")

            if st.button("Submit Auto-Generated Request"):
                pid = p_opts[selected_parent]
                create_household_request(
                    parent_id=pid,
                    title=parsed['title'],
                    category=parsed['category'],
                    priority=parsed['priority'],
                    notes=parsed['notes'],
                    status="Pending"
                )
                st.success(f"Created request ticket for {selected_parent}!")
                st.rerun()
