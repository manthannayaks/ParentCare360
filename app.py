import streamlit as st
import os

from database.db import init_db, get_connection
from database.seed_data import seed_all
from utils.alert_engine import evaluate_automatic_alerts

from views.dashboard_view import render_dashboard
from views.parent_view import render_parent_view
from views.healthcare_view import render_healthcare_view
from views.caregiver_view import render_caregiver_view
from views.request_view import render_request_view
from views.alerts_view import render_alerts_view
from views.timeline_view import render_timeline_view
from views.analytics_view import render_analytics_view
from views.etl_view import render_etl_view
from views.journey_view import render_journey_view
from views.demo_view import render_demo_view

# Streamlit Page Config
st.set_page_config(
    page_title="ParentCare360 Prototype",
    page_icon="👴",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Auto-Initialize & Seed Database if empty
init_db()
conn = get_connection()
cursor = conn.cursor()
cursor.execute("SELECT COUNT(*) as count FROM parents")
count = cursor.fetchone()['count']
conn.close()

if count == 0:
    seed_all()

# Evaluate Alerts on boot
evaluate_automatic_alerts()

# Sidebar Navigation
st.sidebar.title("👴 ParentCare360")
st.sidebar.caption("Group 18 — Remote Elder-Care Coordination System")
st.sidebar.markdown("---")

nav_option = st.sidebar.radio(
    "Navigation Menu",
    [
        "📊 Dashboard",
        "👴 Parent & Family",
        "🏥 Healthcare",
        "🧑‍⚕️ Caregivers",
        "🛠️ Household Requests",
        "🔔 Automatic Alerts",
        "📅 Care Timeline",
        "📈 Analytics",
        "🔄 ETL Pipeline",
        "🚗 Travel Tracker",
        "🎯 Demo Scenario"
    ]
)

st.sidebar.markdown("---")
st.sidebar.info("💡 **Lab 4/5 Progress Prototype**\n\nBuilt with Python, SQLite & Streamlit.")

# View Router
if nav_option == "📊 Dashboard":
    render_dashboard()
elif nav_option == "👴 Parent & Family":
    render_parent_view()
elif nav_option == "🏥 Healthcare":
    render_healthcare_view()
elif nav_option == "🧑‍⚕️ Caregivers":
    render_caregiver_view()
elif nav_option == "🛠️ Household Requests":
    render_request_view()
elif nav_option == "🔔 Automatic Alerts":
    render_alerts_view()
elif nav_option == "📅 Care Timeline":
    render_timeline_view()
elif nav_option == "📈 Analytics":
    render_analytics_view()
elif nav_option == "🔄 ETL Pipeline":
    render_etl_view()
elif nav_option == "🚗 Travel Tracker":
    render_journey_view()
elif nav_option == "🎯 Demo Scenario":
    render_demo_view()
