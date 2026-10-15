import streamlit as st
from models.parent_model import (
    get_all_parents, get_parent_by_id, get_family_members_for_parent,
    add_parent, add_family_member
)

def render_parent_view():
    st.title("👴 Parent & Family Management")
    
    parents = get_all_parents()
    if not parents:
        st.info("No parents registered. Use the tab below to add a parent.")
        return

    tab1, tab2, tab3 = st.tabs(["📋 Parent Directory", "➕ Add New Parent", "👨‍👩‍👧 Add Family Member"])

    with tab1:
        parent_options = {f"{p['full_name']} (ID: {p['id']} - {p['city']})": p['id'] for p in parents}
        selected_label = st.selectbox("Select Parent:", list(parent_options.keys()))
        selected_id = parent_options[selected_label]

        parent = get_parent_by_id(selected_id)
        family = get_family_members_for_parent(selected_id)

        col1, col2 = st.columns([1, 1])

        with col1:
            st.subheader(f"👤 {parent['full_name']}")
            st.markdown(f"**Age:** {parent['age']} years | **Gender:** {parent['gender']}")
            st.markdown(f"**Phone:** {parent['phone']}")
            st.markdown(f"**City:** {parent['city']}")
            st.markdown(f"**Address:** {parent['address']}")
            st.markdown(f"**Emergency Contact:** `{parent['emergency_contact']}`")
            st.info(f"**Medical Notes:** {parent['medical_notes'] or 'None specified'}")

        with col2:
            st.subheader("👨‍👩‍👧 Associated Family Members")
            if family:
                for fm in family:
                    with st.expander(f"📌 {fm['full_name']} ({fm['relationship']})", expanded=True):
                        st.markdown(f"**Phone:** {fm['phone']}")
                        st.markdown(f"**Email:** {fm['email']}")
                        st.markdown(f"**Location:** {fm['city']}")
            else:
                st.warning("No linked family members registered.")

    with tab2:
        st.subheader("➕ Register New Parent")
        with st.form("add_parent_form"):
            name = st.text_input("Full Name *")
            col_a, col_g = st.columns(2)
            age = col_a.number_input("Age *", min_value=50, max_value=110, value=70)
            gender = col_g.selectbox("Gender *", ["Male", "Female", "Other"])
            phone = st.text_input("Phone Number *", value="+91 ")
            city = st.text_input("City *", value="Jodhpur")
            address = st.text_area("Full Address *")
            emergency = st.text_input("Emergency Contact Person & Phone *")
            medical = st.text_area("Medical History / Conditions")

            submitted = st.form_submit_button("Create Parent Record")
            if submitted:
                if name and phone and address and emergency:
                    pid = add_parent(name, age, gender, phone, city, address, emergency, medical)
                    st.success(f"Parent '{name}' registered successfully with ID: {pid}")
                    st.rerun()
                else:
                    st.error("Please fill in all required fields marked with *.")

    with tab3:
        st.subheader("👨‍👩‍👧 Link Family Member to Parent")
        with st.form("add_family_form"):
            p_opts = {f"{p['full_name']} (ID: {p['id']})": p['id'] for p in parents}
            target_p_label = st.selectbox("Select Parent *", list(p_opts.keys()))
            fm_name = st.text_input("Family Member Name *")
            relationship = st.selectbox("Relationship *", ["Son", "Daughter", "Son-in-law", "Daughter-in-law", "Sibling", "Relative"])
            fm_phone = st.text_input("Phone *", value="+91 ")
            fm_email = st.text_input("Email")
            fm_city = st.text_input("City *", value="Pune")

            fm_sub = st.form_submit_button("Link Family Member")
            if fm_sub:
                if fm_name and fm_phone:
                    target_pid = p_opts[target_p_label]
                    add_family_member(target_pid, fm_name, relationship, fm_phone, fm_email, fm_city)
                    st.success(f"Family member '{fm_name}' linked successfully!")
                    st.rerun()
                else:
                    st.error("Please provide family member name and phone number.")
