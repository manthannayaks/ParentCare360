import sqlite3
from database.db import get_connection, init_db

def seed_all():
    """Populate database with synthetic data for ParentCare360 demo."""
    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    # Clear existing records
    tables = [
        "notifications", "help_requests", "location_shares", "voice_messages",
        "prescriptions", "permission_grants", "family_connections", "users",
        "alert_dedup_cache", "quarantine_records",
        "parent_locations", "documents", "doctors", "travel_journeys", "care_events",
        "alerts", "household_requests", "caregiver_visits", "caregivers",
        "appointments", "family_members", "parents"
    ]
    for tbl in tables:
        cursor.execute(f"DELETE FROM {tbl}")
        try:
            cursor.execute(f"DELETE FROM sqlite_sequence WHERE name='{tbl}'")
        except Exception:
            pass

    # 1. Seed Parents
    parents = [
        ("Ravi Kumar", 72, "Male", "+91 94140 12345", "Jodhpur", "124, Shastri Nagar, Jodhpur", "+91 98765 43210 (Amit - Son)", "Hypertension, Mild Arthritis"),
        ("Savitri Sharma", 68, "Female", "+91 98290 54321", "Jaipur", "45, Malviya Nagar, Jaipur", "+91 98123 45678 (Sunita - Daughter)", "Type 2 Diabetes"),
        ("Ramesh Patel", 75, "Male", "+91 97120 67890", "Pune", "88, Kothrud, Pune", "+91 99000 11223 (Vikram - Son)", "Post-knee surgery recovery")
    ]
    cursor.executemany("""
    INSERT INTO parents (full_name, age, gender, phone, city, address, emergency_contact, medical_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, parents)

    # 2. Seed Family Members
    family_members = [
        (1, "Amit Kumar", "Son", "+91 98765 43210", "amit.kumar@example.com", "Pune"),
        (1, "Sneha Kumar", "Daughter-in-law", "+91 98765 43211", "sneha.k@example.com", "Pune"),
        (2, "Sunita Sharma", "Daughter", "+91 98123 45678", "sunita.s@example.com", "Delhi"),
        (3, "Vikram Patel", "Son", "+91 99000 11223", "vikram.p@example.com", "Mumbai")
    ]
    cursor.executemany("""
    INSERT INTO family_members (parent_id, full_name, relationship, phone, email, city)
    VALUES (?, ?, ?, ?, ?, ?)
    """, family_members)

    # 3. Seed Caregivers
    caregivers = [
        ("Priya Verma", "+91 91122 33445", "Registered Nurse", "Jodhpur"),
        ("Rajesh Gupta", "+91 92233 44556", "Physiotherapist", "Jaipur"),
        ("Meena Joshi", "+91 93344 55667", "Elderly Care Assistant", "Pune")
    ]
    cursor.executemany("""
    INSERT INTO caregivers (full_name, phone, role, city)
    VALUES (?, ?, ?, ?)
    """, caregivers)

    # 4. Seed Appointments
    appointments = [
        (1, "Dr. A. K. Sharma", "AIIMS Jodhpur", "2026-09-12", "10:30 AM", "Cardiology Follow-up Checkup", "Upcoming"),
        (2, "Dr. Neha Kapoor", "Fortis Hospital Jaipur", "2026-09-10", "11:00 AM", "Routine HbA1c & Blood Sugar Checkup", "Completed"),
        (3, "Dr. S. N. Roy", "Ruby Hall Clinic Pune", "2026-09-08", "04:00 PM", "Post-Surgery Knee Joint Evaluation", "Completed")
    ]
    cursor.executemany("""
    INSERT INTO appointments (parent_id, doctor_name, hospital_clinic, appointment_date, appointment_time, purpose, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, appointments)

    # 5. Seed Caregiver Visits
    visits = [
        (1, 1, "2026-09-11 09:00:00", None, "Scheduled", "Morning vital stats monitoring & morning medication assist."),
        (2, 2, "2026-09-09 10:00:00", "2026-09-09 10:45:00", "Completed", "Vital signs normal (BP 125/82, Sugar 110 mg/dL). Assisted with light physical exercises."),
        (3, 3, "2026-09-07 14:00:00", "2026-09-07 15:00:00", "Completed", "Assisted with mobility & evening meal preparation.")
    ]
    cursor.executemany("""
    INSERT INTO caregiver_visits (parent_id, caregiver_id, scheduled_datetime, actual_completion_datetime, status, visit_notes)
    VALUES (?, ?, ?, ?, ?, ?)
    """, visits)

    # 6. Seed Household Requests
    requests = [
        (1, "Bathroom tap is broken and leaking water", "Maintenance", "High", "Pending", "2026-09-10 08:30:00", "Water dripping constantly in master bath."),
        (2, "Monthly prescription refill from Apollo Pharmacy", "Grocery", "Medium", "In Progress", "2026-09-09 14:15:00", "Insulin and BP medication."),
        (3, "Assistance with online electricity bill payment", "Utility", "Low", "Completed", "2026-09-06 11:00:00", "Bill paid successfully online.")
    ]
    cursor.executemany("""
    INSERT INTO household_requests (parent_id, title, category, priority, status, created_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, requests)

    # 7. Seed Initial Alerts
    alerts = [
        (1, "Upcoming Appointment", "Doctor appointment scheduled with Dr. A. K. Sharma on 2026-09-12 at 10:30 AM", "Info", 0, "2026-09-10 09:00:00"),
        (1, "High-Priority Request Pending", "Household request 'Bathroom tap is broken' remains unresolved", "Warning", 0, "2026-09-10 10:30:00")
    ]
    cursor.executemany("""
    INSERT INTO alerts (parent_id, alert_type, message, severity, is_resolved, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, alerts)

    # 8. Seed Initial Care Events (Timeline)
    events = [
        (1, "Household Request", "Maintenance request created: Bathroom tap is broken", "High priority maintenance request submitted by family.", "2026-09-10 08:30:00", "Pending"),
        (1, "Appointment", "Cardiology Follow-up scheduled", "Doctor appointment with Dr. A. K. Sharma at AIIMS Jodhpur.", "2026-09-09 16:00:00", "Upcoming"),
        (2, "Caregiver Visit", "Caregiver Visit Completed by Rajesh Gupta", "Vitals checked and physical therapy session done.", "2026-09-09 10:45:00", "Completed"),
        (3, "Household Request", "Utility bill payment completed", "Electricity bill paid successfully.", "2026-09-06 11:00:00", "Completed")
    ]
    cursor.executemany("""
    INSERT INTO care_events (parent_id, event_type, title, description, timestamp, status)
    VALUES (?, ?, ?, ?, ?, ?)
    """, events)

    # 9. Seed Travel Journeys
    journeys = [
        (1, "Jodhpur", "Bengaluru", "2026-09-10 14:00:00", "2026-09-10 16:30:00", "BLR Airport Terminal 1", "Arrived - Awaiting Pickup")
    ]
    cursor.executemany("""
    INSERT INTO travel_journeys (parent_id, origin, destination, departure_time, arrival_time, current_location, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, journeys)

    # 10. Seed Doctors
    doctors = [
        ("Dr. A. K. Sharma", "Cardiologist", "+91 98290 11111", "dr.sharma@aiims.edu", "AIIMS Jodhpur"),
        ("Dr. Neha Kapoor", "Endocrinologist & Diabetologist", "+91 98290 22222", "dr.kapoor@fortis.com", "Fortis Hospital Jaipur"),
        ("Dr. S. N. Roy", "Orthopedic Surgeon", "+91 98290 33333", "dr.roy@rubyhall.com", "Ruby Hall Clinic Pune")
    ]
    cursor.executemany("""
    INSERT INTO doctors (full_name, specialty, phone, email, hospital_clinic)
    VALUES (?, ?, ?, ?, ?)
    """, doctors)

    # Update appointments with doctor_ids and notes
    cursor.execute("UPDATE appointments SET doctor_id = 1, doctor_notes = 'Blood pressure 128/82. Mild exertional dyspnea discussed. Review in 3 months.' WHERE id = 1")
    cursor.execute("UPDATE appointments SET doctor_id = 2, doctor_notes = 'HbA1c 6.8%, well controlled. Continue Metformin 500mg BD after meals.' WHERE id = 2")
    cursor.execute("UPDATE appointments SET doctor_id = 3, doctor_notes = 'Surgical incision healed cleanly. Range of motion 95 degrees. Continue physiotherapy.' WHERE id = 3")

    # 11. Seed Documents
    documents = [
        (1, "Cardiac ECG & Holter Monitor Report", "Lab Report", "/docs/ecg_ravi_2026.pdf", "Normal sinus rhythm with isolated PACs. Ventricular function preserved (LVEF 58%).", "Dr. A. K. Sharma", "2026-09-08 14:00:00"),
        (1, "Quarterly Hypertension Rx & Diet Chart", "Prescription", "/docs/rx_ravi_q3.pdf", "Telmisartan 40mg OD morning, Atorvastatin 10mg night. Restrict salt to <4g/day.", "Dr. A. K. Sharma", "2026-09-08 14:30:00"),
        (1, "Star Health Senior Citizen Health Card", "Insurance", "/docs/star_health_ravi.pdf", "Policy No: SH-2026-90412. Cashless network across AIIMS & Fortis.", "Amit Kumar (Son)", "2026-08-01 10:00:00"),
        (2, "HbA1c & Lipid Profile Fasting Lab Report", "Lab Report", "/docs/hba1c_savitri.pdf", "Fasting blood sugar 112 mg/dL. HbA1c 6.8%. Triglycerides slightly elevated at 168.", "Dr. Neha Kapoor", "2026-09-09 11:30:00"),
        (3, "Total Knee Arthroscopy Post-Op Discharge", "Discharge Summary", "/docs/discharge_ramesh.pdf", "Uncomplicated right knee arthroscopy. Follow-up physiotherapy twice weekly.", "Dr. S. N. Roy", "2026-09-05 16:30:00")
    ]
    cursor.executemany("""
    INSERT INTO documents (parent_id, title, category, document_url, notes, uploaded_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, documents)

    # 12. Seed Parent Locations
    locations = [
        (1, 12.9716, 77.5946, "Kempegowda International Airport, Terminal 1, Bengaluru", 12.0, 84, "2026-09-10 16:45:00", "Reached Bengaluru Airport. Waiting at Arrival Gate Pillar 4 for pickup."),
        (2, 26.8525, 75.8145, "45, Malviya Nagar, Jaipur, Rajasthan", 8.0, 68, "2026-09-10 12:00:00", "At home residence"),
        (3, 18.5074, 73.8077, "88, Kothrud, Pune, Maharashtra", 10.0, 91, "2026-09-10 11:30:00", "At home residence")
    ]
    cursor.executemany("""
    INSERT INTO parent_locations (parent_id, latitude, longitude, address, accuracy, battery_level, shared_at, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, locations)

    # 13. Seed Independent Users (Feature 1 & Demo Mode)
    import hashlib
    default_pwd_hash = hashlib.sha256("password123".encode()).hexdigest()
    created_at = "2026-09-01 10:00:00"

    users = [
        # id 1: Joe (Parent)
        ("joe", "joe@example.com", default_pwd_hash, "Joe", "parent", "+91 98290 55555", "Bengaluru", "Flat 302, Palm Meadows, Whitefield, Bengaluru", 74, "Male", "+91 98765 43210 (Sam - Son)", "Hypertension, Mild Arthritis, Post-op Knee Recovery", "en-IN", "JOE-7401", created_at),
        # id 2: Sam (Child / Family Member)
        ("sam", "sam@example.com", default_pwd_hash, "Sam", "child", "+91 98765 43210", "Pune", "14, Baner Road, Pune", 38, "Male", "+91 98290 55555 (Joe - Father)", "", "en-IN", "SAM-2890", created_at),
        # id 3: Priya (Caregiver / Registered Nurse)
        ("priya", "priya@example.com", default_pwd_hash, "Priya Verma", "caregiver", "+91 91122 33445", "Bengaluru", "Koramangala Health Hub, Bengaluru", 29, "Female", "+91 91122 00000", "Registered Nurse, Geriatric Care", "en-IN", "PRIYA-102", created_at),
        # id 4: Dr. Sharma (Doctor / Cardiologist)
        ("dr_sharma", "dr.sharma@example.com", default_pwd_hash, "Dr. A. K. Sharma", "doctor", "+91 98290 11111", "Bengaluru", "Manipal Hospital, Whitefield, Bengaluru", 52, "Male", "+91 98290 00000", "Cardiology & Vascular Medicine", "en-IN", "DOC-SHARMA", created_at),
        # id 5: Ravi Kumar (Parent)
        ("ravi", "ravi@example.com", default_pwd_hash, "Ravi Kumar", "parent", "+91 94140 12345", "Jodhpur", "124, Shastri Nagar, Jodhpur", 72, "Male", "+91 98765 43210 (Amit - Son)", "Hypertension, Mild Arthritis", "en-IN", "RAVI-1245", created_at)
    ]
    cursor.executemany("""
    INSERT INTO users (username, email, password_hash, full_name, role, phone, city, address, age, gender, emergency_contact, medical_notes, preferred_language, invitation_code, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, users)

    # 14. Seed Prescriptions (for Joe, user_id=1)
    prescriptions = [
        (1, "Dr. A. K. Sharma", "Amlodipine Besylate", "5 mg", "Once daily (Morning)", "Take after breakfast with water. For blood pressure control.", "2026-09-01", "2026-12-01", "Doctor Rx", created_at),
        (1, "Dr. Neha Kapoor", "Metformin HCl", "500 mg", "Twice daily (Morning & Night)", "Take with meals. For blood sugar management.", "2026-08-15", "2026-11-15", "Doctor Rx", created_at),
        (1, "Dr. S. N. Roy", "Glucosamine Sulfate", "750 mg", "Once daily (Afternoon)", "Take with lunch for knee joint cartilage support.", "2026-09-05", "2026-12-05", "Doctor Rx", created_at)
    ]
    cursor.executemany("""
    INSERT INTO prescriptions (parent_user_id, doctor_name, medicine_name, dosage, frequency, instructions, start_date, end_date, source, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, prescriptions)

    # 15. Initial Welcome Notifications for Joe
    notifications = [
        (1, "system", "Welcome to ParentCare360", "Your independent parent account has been created. Connect with family members to coordinate care.", None, "2026-09-01 10:05:00")
    ]
    cursor.executemany("""
    INSERT INTO notifications (user_id, event_type, title, body, related_entity_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, notifications)

    conn.commit()
    conn.close()
    print("Database successfully seeded with synthetic data!")

seed_database = seed_all

if __name__ == "__main__":
    seed_all()
