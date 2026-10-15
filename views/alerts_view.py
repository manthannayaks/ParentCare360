import streamlit as st
from models.parent_model import get_all_parents
from models.alert_model import get_all_alerts, resolve_alert
from utils.alert_engine import evaluate_automatic_alerts

def render_alerts_view():
    st.title("🔔 Automatic Rule-Based Alerts")
    st.markdown("Automated trigger engine detecting overdue visits, approaching appointments, and unresolved high-priority household requests.")

    c_left, c_right = st.columns([3, 1])

    with c_right:
        if st.button("⚡ Run Alert Engine", use_container_width=True):
            cnt = evaluate_automatic_alerts()
            st.success(f"Evaluated alert rules! Evaluated/Created alerts: {cnt}")
            st.rerun()

    show_resolved = st.checkbox("Include Resolved Alerts", value=False)

    parents = get_all_parents()
    alerts = get_all_alerts(include_resolved=show_resolved)

    if not alerts:
        st.success("🎉 No active alerts in the system!")
    else:
        for alt in alerts:
            sev = alt['severity']
            badge = "🔴 CRITICAL" if sev == "Critical" else ("🟡 WARNING" if sev == "Warning" else "🔵 INFO")
            st_text = "RESOLVED" if alt['is_resolved'] else "ACTIVE"

            with st.expander(f"{badge} | [{alt['parent_name']}] {alt['alert_type']} ({st_text})", expanded=not alt['is_resolved']):
                col_m, col_b = st.columns([3, 1])

                with col_m:
                    st.markdown(f"**Parent:** {alt['parent_name']}")
                    st.markdown(f"**Alert Type:** `{alt['alert_type']}`")
                    st.markdown(f"**Severity:** `{alt['severity']}`")
                    st.markdown(f"**Triggered At:** `{alt['created_at']}`")
                    st.markdown(f"**Message:** {alt['message']}")
                    st.markdown(f"**Status:** `{'Resolved' if alt['is_resolved'] else 'Active'}`")

                with col_b:
                    if not alt['is_resolved']:
                        if st.button("Resolve Alert", key=f"res_{alt['id']}"):
                            resolve_alert(alt['id'])
                            st.success("Alert resolved!")
                            st.rerun()
                    else:
                        st.info("Resolved")
