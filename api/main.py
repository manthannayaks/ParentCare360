import os
import json
import hashlib
import random
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database.db import get_connection
from dags.orchestrator import run_orchestrated_pipeline
from dags.dag_alert_engine import run_alert_engine, emit_alert_with_dedup
from utils.voice_proto import parse_voice_text

app = FastAPI(
    title="ParentCare360 API Gateway",
    description="REST & WebSocket API for Remote Elder-Care Coordination, Inter-DAG Pipeline & Alert Engine",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    """Ensure database schema and pre-seeded demo accounts exist on cloud startup."""
    from database.db import init_db, get_connection
    from database.seed_data import seed_all
    init_db()
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT count(*) as count FROM users")
        row = cursor.fetchone()
        user_count = row["count"] if row else 0
        conn.close()
        if user_count == 0:
            seed_all()
    except Exception as e:
        print(f"Startup database initialization error: {e}")

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "ParentCare360 Live API Gateway",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat()
    }

# WebSocket Connection Manager for Real-Time Alerts
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

# --- Pydantic Request Models ---
class AppointmentCreate(BaseModel):
    parent_id: int
    doctor_name: str
    hospital_clinic: str
    appointment_date: str
    appointment_time: str
    purpose: str

class RequestCreate(BaseModel):
    parent_id: int
    title: str
    category: str = "General"
    priority: str = "Medium"
    notes: Optional[str] = ""

class VoiceInput(BaseModel):
    parent_id: int
    speech_text: str

class VisitCheckin(BaseModel):
    visit_id: int
    caregiver_id: int
    completion_datetime: str
    visit_notes: str

class RequestStatusUpdate(BaseModel):
    status: str
    assigned_to: Optional[str] = None
    notes: Optional[str] = None

class LocationShare(BaseModel):
    latitude: float
    longitude: float
    address: str
    accuracy: Optional[float] = 10.0
    battery_level: Optional[int] = None
    note: Optional[str] = ""

class DocumentCreate(BaseModel):
    parent_id: int
    title: str
    category: str
    document_url: Optional[str] = ""
    notes: Optional[str] = ""
    uploaded_by: Optional[str] = "Family"

class DoctorNotesUpdate(BaseModel):
    doctor_notes: str
    status: Optional[str] = None

class TravelJourneyCreate(BaseModel):
    parent_id: int
    origin: str
    destination: str
    departure_time: str
    arrival_time: str
    current_location: str
    status: Optional[str] = "Scheduled"

class TravelJourneyStatusUpdate(BaseModel):
    status: str
    current_location: Optional[str] = None

class EdgeCaseSimulate(BaseModel):
    edge_case_type: str  # "inactivity", "dedup_storm", "poison_pill", "out_of_order"
    parent_id: Optional[int] = 1

# --- Independent Accounts, Connections, Permissions, Prescriptions & Voice Models ---
class UserRegister(BaseModel):
    username: str
    email: Optional[str] = None
    password: str
    full_name: str
    role: str  # "parent", "child", "caregiver", "doctor"
    phone: Optional[str] = ""
    city: Optional[str] = ""
    address: Optional[str] = ""
    age: Optional[int] = None
    gender: Optional[str] = ""
    emergency_contact: Optional[str] = ""
    medical_notes: Optional[str] = ""
    preferred_language: Optional[str] = "en-IN"

class UserLogin(BaseModel):
    username: str
    password: str

class ConnectionRequestCreate(BaseModel):
    requester_user_id: int
    target_identifier: str  # username or invitation code
    relationship_type: Optional[str] = "Child"

class ConnectionRespond(BaseModel):
    connection_id: int
    user_id: int  # must match recipient
    action: str  # "accept" | "reject"

class PermissionUpdate(BaseModel):
    connection_id: int
    parent_user_id: int
    view_prescriptions: int = 1
    view_appointments: int = 1
    view_documents: int = 1
    receive_voice: int = 1
    receive_location: int = 1
    receive_help: int = 1
    manage_caregiver: int = 1

class PrescriptionCreate(BaseModel):
    parent_user_id: int
    medicine_name: str
    dosage: str
    frequency: str
    instructions: Optional[str] = ""
    doctor_name: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""
    source: Optional[str] = "Doctor Rx"

class VoiceMessageSend(BaseModel):
    sender_user_id: int
    recipient_user_id: int
    audio_data: Optional[str] = None
    speech_text: Optional[str] = None
    duration_seconds: Optional[int] = 0
    language: Optional[str] = "en-IN"

class LocationShareCreate(BaseModel):
    sender_user_id: int
    recipient_user_id: int
    latitude: float
    longitude: float
    address: str
    accuracy: Optional[float] = 10.0
    battery_level: Optional[int] = None
    note: Optional[str] = ""

class HelpRequestCreate(BaseModel):
    parent_user_id: int
    category: str
    description: str
    assigned_family_user_id: Optional[int] = None
    voice_message_id: Optional[int] = None
    location_share_id: Optional[int] = None

class HelpRequestStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

# --- Routes ---

@app.get("/api/health")
def health_check():
    conn = get_connection()
    c = conn.cursor()
    c.execute("PRAGMA journal_mode")
    journal_mode = c.fetchone()[0]
    conn.close()
    return {
        "status": "Healthy",
        "system": "ParentCare360",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "sqlite_journal_mode": journal_mode,
        "inter_dag_pipeline": "Active"
    }

# 1. Parents & Family
@app.get("/api/parents")
def get_parents():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT p.*, COUNT(DISTINCT a.id) as active_alerts_count
    FROM parents p
    LEFT JOIN alerts a ON p.id = a.parent_id AND a.is_resolved = 0
    GROUP BY p.id
    """)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@app.get("/api/parents/{parent_id}")
def get_parent_detail(parent_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM parents WHERE id = ?", (parent_id,))
    parent = cursor.fetchone()
    if not parent:
        conn.close()
        raise HTTPException(status_code=404, detail="Parent not found")

    cursor.execute("SELECT * FROM family_members WHERE parent_id = ?", (parent_id,))
    family = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM appointments WHERE parent_id = ? ORDER BY appointment_date DESC", (parent_id,))
    appts = [dict(r) for r in cursor.fetchall()]

    cursor.execute("""
    SELECT v.*, c.full_name as caregiver_name, c.phone as caregiver_phone, c.role as caregiver_role
    FROM caregiver_visits v
    JOIN caregivers c ON v.caregiver_id = c.id
    WHERE v.parent_id = ?
    ORDER BY v.scheduled_datetime DESC
    """, (parent_id,))
    visits = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM household_requests WHERE parent_id = ? ORDER BY id DESC", (parent_id,))
    requests = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {
        "parent": dict(parent),
        "family_members": family,
        "appointments": appts,
        "caregiver_visits": visits,
        "household_requests": requests
    }

@app.post("/api/parents/{parent_id}/heartbeat")
async def trigger_heartbeat(parent_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()
    cursor.execute("UPDATE parents SET last_heartbeat = ? WHERE id = ?", (now_iso, parent_id))
    cursor.execute("""
    INSERT INTO care_events (parent_id, event_type, title, description, timestamp, status)
    VALUES (?, 'Sensor Ping', 'Elder Check-in Telemetry Received', 'Parent device reported active heartbeat', ?, 'Active')
    """, (parent_id, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
    conn.commit()
    conn.close()
    return {"status": "Success", "parent_id": parent_id, "last_heartbeat": now_iso}

@app.get("/api/parents/{parent_id}/timeline")
def get_parent_timeline(parent_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM care_events
    WHERE parent_id = ?
    ORDER BY timestamp DESC LIMIT 30
    """, (parent_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

# 2. Appointments
@app.get("/api/appointments")
def get_appointments(parent_id: Optional[int] = None):
    conn = get_connection()
    cursor = conn.cursor()
    if parent_id:
        cursor.execute("SELECT * FROM appointments WHERE parent_id = ? ORDER BY appointment_date DESC", (parent_id,))
    else:
        cursor.execute("""
        SELECT a.*, p.full_name as parent_name
        FROM appointments a
        JOIN parents p ON a.parent_id = p.id
        ORDER BY a.appointment_date DESC
        """)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@app.post("/api/appointments")
def create_appointment(data: AppointmentCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO appointments (parent_id, doctor_name, hospital_clinic, appointment_date, appointment_time, purpose, status)
    VALUES (?, ?, ?, ?, ?, ?, 'Upcoming')
    """, (data.parent_id, data.doctor_name, data.hospital_clinic, data.appointment_date, data.appointment_time, data.purpose))
    appt_id = cursor.lastrowid
    cursor.execute("""
    INSERT INTO care_events (parent_id, event_type, title, description, timestamp, status)
    VALUES (?, 'Appointment', ?, ?, ?, 'Upcoming')
    """, (data.parent_id, f"Appointment booked with {data.doctor_name}", f"At {data.hospital_clinic} on {data.appointment_date}", datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
    conn.commit()
    conn.close()
    return {"status": "Created", "id": appt_id}

@app.patch("/api/appointments/{appt_id}/status")
def update_appointment_status(appt_id: int, status: str = Query(...)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE appointments SET status = ? WHERE id = ?", (status, appt_id))
    conn.commit()
    conn.close()
    return {"status": "Updated", "id": appt_id, "new_status": status}

# 3. Caregivers
@app.get("/api/caregivers")
def get_caregivers():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM caregivers")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@app.get("/api/caregivers/{caregiver_id}/roster")
def get_caregiver_roster(caregiver_id: int):
    """RBAC / ABAC View: Restricted only to assigned visits for this caregiver."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT v.*, p.full_name as parent_name, p.address as parent_address, p.emergency_contact
    FROM caregiver_visits v
    JOIN parents p ON v.parent_id = p.id
    WHERE v.caregiver_id = ?
    ORDER BY v.scheduled_datetime ASC
    """, (caregiver_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@app.post("/api/caregivers/checkin")
async def caregiver_checkin(data: VisitCheckin):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE caregiver_visits
    SET status = 'Completed', actual_completion_datetime = ?, visit_notes = ?
    WHERE id = ? AND caregiver_id = ?
    """, (data.completion_datetime, data.visit_notes, data.visit_id, data.caregiver_id))

    cursor.execute("SELECT parent_id FROM caregiver_visits WHERE id = ?", (data.visit_id,))
    row = cursor.fetchone()
    if row:
        pid = row["parent_id"]
        cursor.execute("""
        INSERT INTO care_events (parent_id, event_type, title, description, timestamp, status)
        VALUES (?, 'Caregiver Visit', 'Caregiver Visit Completed', ?, ?, 'Completed')
        """, (pid, data.visit_notes, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))

    conn.commit()
    conn.close()
    return {"status": "Success", "visit_id": data.visit_id}

# 4. Household Requests & Voice Parser
@app.get("/api/requests")
def get_requests(parent_id: Optional[int] = None):
    conn = get_connection()
    cursor = conn.cursor()
    if parent_id:
        cursor.execute("SELECT * FROM household_requests WHERE parent_id = ? ORDER BY id DESC", (parent_id,))
    else:
        cursor.execute("""
        SELECT r.*, p.full_name as parent_name
        FROM household_requests r
        JOIN parents p ON r.parent_id = p.id
        ORDER BY r.id DESC
        """)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@app.post("/api/requests")
def create_request(data: RequestCreate):
    conn = get_connection()
    cursor = conn.cursor()
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    INSERT INTO household_requests (parent_id, title, category, priority, status, created_at, notes)
    VALUES (?, ?, ?, ?, 'Pending', ?, ?)
    """, (data.parent_id, data.title, data.category, data.priority, created_at, data.notes))
    req_id = cursor.lastrowid
    cursor.execute("""
    INSERT INTO care_events (parent_id, event_type, title, description, timestamp, status)
    VALUES (?, 'Household Request', ?, ?, ?, 'Pending')
    """, (data.parent_id, f"Request: {data.title}", f"Category: {data.category} | Priority: {data.priority}", created_at))
    conn.commit()
    conn.close()
    return {"status": "Created", "id": req_id}

@app.post("/api/requests/voice-transcribe")
def voice_transcribe(data: VoiceInput):
    """Bilingual Hindi/English Voice NLP Prototype Parser."""
    parsed = parse_voice_text(data.speech_text)
    conn = get_connection()
    cursor = conn.cursor()
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    INSERT INTO household_requests (parent_id, title, category, priority, status, created_at, notes)
    VALUES (?, ?, ?, ?, 'Pending', ?, ?)
    """, (data.parent_id, parsed["title"], parsed["category"], parsed["priority"], created_at, f"Voice dictation: '{data.speech_text}'"))
    req_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {
        "status": "Created",
        "id": req_id,
        "parsed_metadata": parsed
    }

# 5. Alerts
@app.get("/api/alerts")
def get_alerts(resolved: Optional[int] = 0):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT a.*, p.full_name as parent_name
    FROM alerts a
    JOIN parents p ON a.parent_id = p.id
    WHERE a.is_resolved = ?
    ORDER BY a.id DESC
    """, (resolved,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@app.patch("/api/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE alerts SET is_resolved = 1 WHERE id = ?", (alert_id,))
    conn.commit()
    conn.close()
    return {"status": "Resolved", "alert_id": alert_id}

# 6. Request Status Update
@app.patch("/api/requests/{req_id}/status")
def update_request_status(req_id: int, data: RequestStatusUpdate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT parent_id, title FROM household_requests WHERE id = ?", (req_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Request not found")
    parent_id, title = row["parent_id"], row["title"]
    
    if data.assigned_to:
        cursor.execute("UPDATE household_requests SET status = ?, assigned_to = ? WHERE id = ?", (data.status, data.assigned_to, req_id))
    else:
        cursor.execute("UPDATE household_requests SET status = ? WHERE id = ?", (data.status, req_id))
        
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    INSERT INTO care_events (parent_id, event_type, title, description, timestamp, status)
    VALUES (?, 'Request Status Update', ?, ?, ?, ?)
    """, (parent_id, f"Request '{title}' status: {data.status}", data.notes or f"Status set to {data.status}", now_str, data.status))
    
    conn.commit()
    conn.close()
    return {"status": "Updated", "id": req_id, "new_status": data.status}

# 7. Location Sharing & Telemetry
@app.get("/api/parents/{parent_id}/location")
def get_parent_location(parent_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM parent_locations
    WHERE parent_id = ?
    ORDER BY id DESC LIMIT 1
    """, (parent_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {"location": None, "freshness": "unavailable"}
    
    loc = dict(row)
    try:
        shared_dt = datetime.fromisoformat(loc["shared_at"].replace(" ", "T"))
        age_minutes = (datetime.now() - shared_dt).total_seconds() / 60
        if age_minutes < 15:
            freshness = "current"
        elif age_minutes < 120:
            freshness = "recent"
        else:
            freshness = "stale"
    except Exception:
        freshness = "recent"
        
    return {"location": loc, "freshness": freshness}

@app.post("/api/parents/{parent_id}/location")
async def share_parent_location(parent_id: int, data: LocationShare):
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    INSERT INTO parent_locations (parent_id, latitude, longitude, address, accuracy, battery_level, shared_at, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (parent_id, data.latitude, data.longitude, data.address, data.accuracy, data.battery_level, now_str, data.note))
    loc_id = cursor.lastrowid
    
    # Also update active travel journey if any
    cursor.execute("""
    UPDATE travel_journeys
    SET current_location = ?
    WHERE parent_id = ? AND status != 'Completed'
    """, (data.address, parent_id))
    
    cursor.execute("SELECT full_name FROM parents WHERE id = ?", (parent_id,))
    p = cursor.fetchone()
    p_name = p["full_name"] if p else "Parent"
    
    cursor.execute("""
    INSERT INTO care_events (parent_id, event_type, title, description, timestamp, status)
    VALUES (?, 'Location Share', ?, ?, ?, 'Active')
    """, (parent_id, f"{p_name} shared location", f"{data.address} - {data.note or 'Live location update'}", now_str))
    
    conn.commit()
    conn.close()
    
    await manager.broadcast({
        "event": "LOCATION_SHARED",
        "parent_id": parent_id,
        "address": data.address,
        "shared_at": now_str
    })
    
    return {"status": "Success", "id": loc_id, "shared_at": now_str}

# 8. Documents
@app.get("/api/parents/{parent_id}/documents")
def get_parent_documents(parent_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE parent_id = ? ORDER BY id DESC", (parent_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@app.post("/api/parents/{parent_id}/documents")
def create_parent_document(parent_id: int, data: DocumentCreate):
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    INSERT INTO documents (parent_id, title, category, document_url, notes, uploaded_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (parent_id, data.title, data.category, data.document_url, data.notes, data.uploaded_by, now_str))
    doc_id = cursor.lastrowid
    cursor.execute("""
    INSERT INTO care_events (parent_id, event_type, title, description, timestamp, status)
    VALUES (?, 'Document Uploaded', ?, ?, ?, 'Active')
    """, (parent_id, f"Document: {data.title}", f"Category: {data.category} | Uploaded by: {data.uploaded_by}", now_str))
    conn.commit()
    conn.close()
    return {"status": "Created", "id": doc_id}

# 9. Doctors & Clinical Notes
@app.get("/api/doctors")
def get_doctors():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM doctors")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@app.get("/api/doctors/{doctor_id}/dashboard")
def get_doctor_dashboard(doctor_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM doctors WHERE id = ?", (doctor_id,))
    doctor = cursor.fetchone()
    if not doctor:
        conn.close()
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    cursor.execute("""
    SELECT a.*, p.full_name as parent_name, p.age, p.gender, p.phone as parent_phone, p.medical_notes, p.emergency_contact
    FROM appointments a
    JOIN parents p ON a.parent_id = p.id
    WHERE a.doctor_id = ? OR a.doctor_name LIKE ?
    ORDER BY a.appointment_date DESC
    """, (doctor_id, f"%{doctor['full_name']}%"))
    appointments = [dict(r) for r in cursor.fetchall()]
    
    parent_ids = list(set([a["parent_id"] for a in appointments]))
    patients = []
    docs = []
    if parent_ids:
        placeholders = ",".join(["?"] * len(parent_ids))
        cursor.execute(f"SELECT * FROM parents WHERE id IN ({placeholders})", parent_ids)
        patients = [dict(r) for r in cursor.fetchall()]
        
        cursor.execute(f"SELECT * FROM documents WHERE parent_id IN ({placeholders}) ORDER BY id DESC", parent_ids)
        docs = [dict(r) for r in cursor.fetchall()]
        
    conn.close()
    return {
        "doctor": dict(doctor),
        "appointments": appointments,
        "patients": patients,
        "documents": docs
    }

@app.patch("/api/appointments/{appt_id}/notes")
def update_appointment_doctor_notes(appt_id: int, data: DoctorNotesUpdate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT parent_id, doctor_name FROM appointments WHERE id = ?", (appt_id,))
    appt = cursor.fetchone()
    if not appt:
        conn.close()
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if data.status:
        cursor.execute("UPDATE appointments SET doctor_notes = ?, status = ? WHERE id = ?", (data.doctor_notes, data.status, appt_id))
    else:
        cursor.execute("UPDATE appointments SET doctor_notes = ? WHERE id = ?", (data.doctor_notes, appt_id))
        
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    INSERT INTO care_events (parent_id, event_type, title, description, timestamp, status)
    VALUES (?, 'Clinical Note', ?, ?, ?, 'Completed')
    """, (appt["parent_id"], f"Clinical notes added by {appt['doctor_name']}", data.doctor_notes, now_str))
    
    conn.commit()
    conn.close()
    return {"status": "Updated", "id": appt_id}

# 10. Travel & Pickup Assistance
@app.get("/api/travel")
def get_travel_journeys(parent_id: Optional[int] = None):
    conn = get_connection()
    cursor = conn.cursor()
    if parent_id:
        cursor.execute("""
        SELECT t.*, p.full_name as parent_name, p.phone as parent_phone
        FROM travel_journeys t
        JOIN parents p ON t.parent_id = p.id
        WHERE t.parent_id = ?
        ORDER BY t.id DESC
        """, (parent_id,))
    else:
        cursor.execute("""
        SELECT t.*, p.full_name as parent_name, p.phone as parent_phone
        FROM travel_journeys t
        JOIN parents p ON t.parent_id = p.id
        ORDER BY t.id DESC
        """)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@app.post("/api/travel")
def create_travel_journey(data: TravelJourneyCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO travel_journeys (parent_id, origin, destination, departure_time, arrival_time, current_location, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (data.parent_id, data.origin, data.destination, data.departure_time, data.arrival_time, data.current_location, data.status))
    j_id = cursor.lastrowid
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    INSERT INTO care_events (parent_id, event_type, title, description, timestamp, status)
    VALUES (?, 'Travel Journey', ?, ?, ?, 'Scheduled')
    """, (data.parent_id, f"Trip scheduled: {data.origin} -> {data.destination}", f"Current location: {data.current_location}", now_str))
    conn.commit()
    conn.close()
    return {"status": "Created", "id": j_id}

@app.patch("/api/travel/{journey_id}/status")
def update_travel_status(journey_id: int, data: TravelJourneyStatusUpdate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT parent_id, origin, destination FROM travel_journeys WHERE id = ?", (journey_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Journey not found")
    
    if data.current_location:
        cursor.execute("UPDATE travel_journeys SET status = ?, current_location = ? WHERE id = ?", (data.status, data.current_location, journey_id))
    else:
        cursor.execute("UPDATE travel_journeys SET status = ? WHERE id = ?", (data.status, journey_id))
    
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    INSERT INTO care_events (parent_id, event_type, title, description, timestamp, status)
    VALUES (?, 'Travel Update', ?, ?, ?, ?)
    """, (row["parent_id"], f"Travel status: {data.status}", f"Location: {data.current_location or 'N/A'}", now_str, data.status))
    conn.commit()
    conn.close()
    return {"status": "Updated", "id": journey_id, "new_status": data.status}

# 11. Auth Personas Directory
@app.get("/api/auth/personas")
def get_auth_personas():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, full_name, age, gender, city, emergency_contact, medical_notes FROM parents")
    parents = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT f.*, p.full_name as parent_name FROM family_members f JOIN parents p ON f.parent_id = p.id")
    family = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT * FROM caregivers")
    caregivers = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT * FROM doctors")
    doctors = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    return {
        "parents": parents,
        "family_members": family,
        "caregivers": caregivers,
        "doctors": doctors
    }

# 12. Independent Authentication & Profiles (Feature 1)
@app.post("/api/auth/register")
def register_user(data: UserRegister):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE username = ? OR (email IS NOT NULL AND email != '' AND email = ?)", (data.username, data.email))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    pwd_hash = hashlib.sha256(data.password.encode()).hexdigest()
    code_prefix = (data.username[:3].upper() if len(data.username) >= 3 else data.username.upper()).replace(" ", "")
    invitation_code = f"{code_prefix}-{random.randint(1000, 9999)}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
    INSERT INTO users (username, email, password_hash, full_name, role, phone, city, address, age, gender, emergency_contact, medical_notes, preferred_language, invitation_code, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (data.username, data.email, pwd_hash, data.full_name, data.role, data.phone, data.city, data.address, data.age, data.gender, data.emergency_contact, data.medical_notes, data.preferred_language, invitation_code, now_str))
    user_id = cursor.lastrowid

    # Sync to legacy table for backwards-compatibility with DAGs
    if data.role == 'parent':
        cursor.execute("""
        INSERT INTO parents (full_name, age, gender, phone, city, address, emergency_contact, medical_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (data.full_name, data.age or 70, data.gender or 'Male', data.phone or '', data.city or '', data.address or '', data.emergency_contact or '', data.medical_notes or ''))
    elif data.role == 'caregiver':
        cursor.execute("""
        INSERT INTO caregivers (full_name, phone, role, city)
        VALUES (?, ?, ?, ?)
        """, (data.full_name, data.phone or '', 'Care Assistant', data.city or ''))
    elif data.role == 'doctor':
        cursor.execute("""
        INSERT INTO doctors (full_name, specialty, phone, email, hospital_clinic)
        VALUES (?, ?, ?, ?, ?)
        """, (data.full_name, 'General Physician', data.phone or '', data.email or '', 'Clinic'))

    conn.commit()
    cursor.execute("SELECT id, username, email, full_name, role, phone, city, address, age, gender, emergency_contact, medical_notes, preferred_language, invitation_code, created_at FROM users WHERE id = ?", (user_id,))
    user_row = dict(cursor.fetchone())
    conn.close()
    return {"status": "Registered", "user": user_row}

@app.post("/api/auth/login")
def login_user(data: UserLogin):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, username, email, password_hash, full_name, role, phone, city, address, age, gender, emergency_contact, medical_notes, preferred_language, invitation_code, created_at
    FROM users
    WHERE username = ? OR email = ?
    """, (data.username, data.username))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    pwd_hash = hashlib.sha256(data.password.encode()).hexdigest()
    if row["password_hash"] != pwd_hash:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    user_data = dict(row)
    del user_data["password_hash"]
    return {"status": "Success", "user": user_data}

@app.get("/api/users/search")
def search_users(q: str = Query(...)):
    conn = get_connection()
    cursor = conn.cursor()
    search_term = f"%{q.strip()}%"
    cursor.execute("""
    SELECT id, username, full_name, role, city, invitation_code, preferred_language
    FROM users
    WHERE username LIKE ? OR invitation_code = ? OR full_name LIKE ?
    LIMIT 10
    """, (search_term, q.strip(), search_term))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@app.get("/api/users/{user_id}")
def get_user_profile(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, username, email, full_name, role, phone, city, address, age, gender, emergency_contact, medical_notes, preferred_language, invitation_code, created_at
    FROM users WHERE id = ?
    """, (user_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(row)

# 13. Parent-Child Connection Requests & Permissions (Feature 2)
@app.post("/api/connections/request")
async def send_connection_request(data: ConnectionRequestCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (data.requester_user_id,))
    requester = cursor.fetchone()
    if not requester:
        conn.close()
        raise HTTPException(status_code=404, detail="Requester user not found")
    
    target_ident = data.target_identifier.strip()
    cursor.execute("SELECT * FROM users WHERE username = ? OR invitation_code = ?", (target_ident, target_ident))
    target = cursor.fetchone()
    if not target:
        conn.close()
        raise HTTPException(status_code=404, detail=f"No user found matching '{target_ident}'")
    
    if target["id"] == data.requester_user_id:
        conn.close()
        raise HTTPException(status_code=400, detail="You cannot send a connection request to yourself")
    
    cursor.execute("""
    SELECT id, status FROM family_connections
    WHERE (requester_user_id = ? AND recipient_user_id = ?)
       OR (requester_user_id = ? AND recipient_user_id = ?)
    """, (data.requester_user_id, target["id"], target["id"], data.requester_user_id))
    existing = cursor.fetchone()
    if existing:
        if existing["status"] == "pending":
            conn.close()
            return {"status": "Already Pending", "connection_id": existing["id"], "message": "Connection request is already pending approval."}
        elif existing["status"] == "accepted":
            conn.close()
            return {"status": "Already Connected", "connection_id": existing["id"], "message": "You are already connected."}
        elif existing["status"] == "rejected":
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute("UPDATE family_connections SET status = 'pending', requester_user_id = ?, recipient_user_id = ?, created_at = ? WHERE id = ?", (data.requester_user_id, target["id"], now_str, existing["id"]))
            conn.commit()
            conn.close()
            return {"status": "Requested", "connection_id": existing["id"], "message": "Connection request re-sent."}

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    INSERT INTO family_connections (requester_user_id, recipient_user_id, relationship_type, status, created_at)
    VALUES (?, ?, ?, 'pending', ?)
    """, (data.requester_user_id, target["id"], data.relationship_type, now_str))
    conn_id = cursor.lastrowid

    cursor.execute("""
    INSERT INTO notifications (user_id, event_type, title, body, related_entity_id, created_at)
    VALUES (?, 'connection_request', 'New Family Connection Request', ?, ?, ?)
    """, (target["id"], f"{requester['full_name']} wants to connect with you as {data.relationship_type}.", conn_id, now_str))

    conn.commit()
    conn.close()

    await manager.broadcast({
        "event": "CONNECTION_REQUEST_RECEIVED",
        "recipient_user_id": target["id"],
        "requester_name": requester["full_name"],
        "connection_id": conn_id
    })

    return {"status": "Requested", "connection_id": conn_id, "recipient_name": target["full_name"]}

@app.get("/api/connections/{user_id}")
def get_user_connections(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT c.id as connection_id, c.relationship_type, c.status, c.created_at, c.responded_at,
           CASE WHEN c.requester_user_id = ? THEN u2.id ELSE u1.id END as connected_user_id,
           CASE WHEN c.requester_user_id = ? THEN u2.full_name ELSE u1.full_name END as connected_name,
           CASE WHEN c.requester_user_id = ? THEN u2.role ELSE u1.role END as connected_role,
           CASE WHEN c.requester_user_id = ? THEN u2.city ELSE u1.city END as connected_city,
           CASE WHEN c.requester_user_id = ? THEN u2.phone ELSE u1.phone END as connected_phone,
           CASE WHEN c.requester_user_id = ? THEN u2.medical_notes ELSE u1.medical_notes END as connected_medical_notes,
           CASE WHEN c.requester_user_id = ? THEN u2.address ELSE u1.address END as connected_address,
           p.view_prescriptions, p.view_appointments, p.view_documents, p.receive_voice, p.receive_location, p.receive_help, p.manage_caregiver
    FROM family_connections c
    JOIN users u1 ON c.requester_user_id = u1.id
    JOIN users u2 ON c.recipient_user_id = u2.id
    LEFT JOIN permission_grants p ON c.id = p.connection_id
    WHERE (c.requester_user_id = ? OR c.recipient_user_id = ?) AND c.status = 'accepted'
    """, (user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id))
    connected = [dict(r) for r in cursor.fetchall()]

    cursor.execute("""
    SELECT c.id as connection_id, c.relationship_type, c.status, c.created_at,
           u.id as requester_id, u.full_name as requester_name, u.role as requester_role, u.city as requester_city, u.phone as requester_phone
    FROM family_connections c
    JOIN users u ON c.requester_user_id = u.id
    WHERE c.recipient_user_id = ? AND c.status = 'pending'
    ORDER BY c.id DESC
    """, (user_id,))
    incoming = [dict(r) for r in cursor.fetchall()]

    cursor.execute("""
    SELECT c.id as connection_id, c.relationship_type, c.status, c.created_at,
           u.id as recipient_id, u.full_name as recipient_name, u.role as recipient_role, u.city as recipient_city
    FROM family_connections c
    JOIN users u ON c.recipient_user_id = u.id
    WHERE c.requester_user_id = ? AND c.status = 'pending'
    ORDER BY c.id DESC
    """, (user_id,))
    outgoing = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {
        "connected": connected,
        "incoming": incoming,
        "outgoing": outgoing
    }

@app.post("/api/connections/{connection_id}/respond")
async def respond_to_connection(connection_id: int, data: ConnectionRespond):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM family_connections WHERE id = ?", (connection_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Connection request not found")
    
    if row["recipient_user_id"] != data.user_id:
        conn.close()
        raise HTTPException(status_code=403, detail="You are not authorized to respond to this connection request")
    
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_status = 'accepted' if data.action == 'accept' else 'rejected'
    cursor.execute("UPDATE family_connections SET status = ?, responded_at = ? WHERE id = ?", (new_status, now_str, connection_id))

    cursor.execute("SELECT * FROM users WHERE id = ?", (row["recipient_user_id"],))
    recipient = cursor.fetchone()
    recip_name = recipient["full_name"] if recipient else "Family Member"

    if new_status == 'accepted':
        cursor.execute("SELECT id, role FROM users WHERE id IN (?, ?)", (row["requester_user_id"], row["recipient_user_id"]))
        roles = {r["id"]: r["role"] for r in cursor.fetchall()}
        parent_uid = row["recipient_user_id"] if roles.get(row["recipient_user_id"]) == 'parent' else row["requester_user_id"]
        family_uid = row["requester_user_id"] if parent_uid == row["recipient_user_id"] else row["recipient_user_id"]

        cursor.execute("""
        INSERT INTO permission_grants (connection_id, parent_user_id, family_user_id, view_prescriptions, view_appointments, view_documents, receive_voice, receive_location, receive_help, manage_caregiver, updated_at)
        VALUES (?, ?, ?, 1, 1, 1, 1, 1, 1, 1, ?)
        """, (connection_id, parent_uid, family_uid, now_str))

        cursor.execute("""
        INSERT INTO notifications (user_id, event_type, title, body, related_entity_id, created_at)
        VALUES (?, 'connection_accepted', 'Connection Accepted!', ?, ?, ?)
        """, (row["requester_user_id"], f"{recip_name} accepted your connection request.", connection_id, now_str))
    else:
        cursor.execute("""
        INSERT INTO notifications (user_id, event_type, title, body, related_entity_id, created_at)
        VALUES (?, 'connection_rejected', 'Connection Request Declined', ?, ?, ?)
        """, (row["requester_user_id"], f"{recip_name} declined the connection request.", connection_id, now_str))

    conn.commit()
    conn.close()

    await manager.broadcast({
        "event": "CONNECTION_STATUS_UPDATED",
        "connection_id": connection_id,
        "status": new_status,
        "requester_user_id": row["requester_user_id"],
        "recipient_user_id": row["recipient_user_id"]
    })

    return {"status": "Success", "connection_id": connection_id, "new_status": new_status}

@app.get("/api/connections/{connection_id}/permissions")
def get_connection_permissions(connection_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM permission_grants WHERE connection_id = ?", (connection_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {"permissions": None}
    return {"permissions": dict(row)}

@app.patch("/api/connections/{connection_id}/permissions")
def update_connection_permissions(connection_id: int, data: PermissionUpdate):
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    UPDATE permission_grants
    SET view_prescriptions = ?, view_appointments = ?, view_documents = ?,
        receive_voice = ?, receive_location = ?, receive_help = ?, manage_caregiver = ?, updated_at = ?
    WHERE connection_id = ? AND parent_user_id = ?
    """, (data.view_prescriptions, data.view_appointments, data.view_documents, data.receive_voice, data.receive_location, data.receive_help, data.manage_caregiver, now_str, connection_id, data.parent_user_id))
    conn.commit()
    conn.close()
    return {"status": "Permissions Updated"}

@app.delete("/api/connections/{connection_id}")
def revoke_connection(connection_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE family_connections SET status = 'revoked' WHERE id = ?", (connection_id,))
    conn.commit()
    conn.close()
    return {"status": "Connection Revoked"}

# 14. Prescriptions & Healthcare Records (Feature 3)
@app.get("/api/prescriptions")
def get_prescriptions(parent_user_id: int, requesting_user_id: Optional[int] = None):
    conn = get_connection()
    cursor = conn.cursor()

    # Permission check if requesting_user != parent_user
    if requesting_user_id and requesting_user_id != parent_user_id:
        cursor.execute("""
        SELECT p.view_prescriptions
        FROM family_connections c
        JOIN permission_grants p ON c.id = p.connection_id
        WHERE ((c.requester_user_id = ? AND c.recipient_user_id = ?) OR (c.requester_user_id = ? AND c.recipient_user_id = ?))
          AND c.status = 'accepted'
        """, (requesting_user_id, parent_user_id, parent_user_id, requesting_user_id))
        perm = cursor.fetchone()
        if not perm or perm["view_prescriptions"] != 1:
            conn.close()
            raise HTTPException(status_code=403, detail="Access denied: Prescription sharing not authorized by parent.")

    cursor.execute("""
    SELECT * FROM prescriptions
    WHERE parent_user_id = ?
    ORDER BY id DESC
    """, (parent_user_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@app.post("/api/prescriptions")
def create_prescription(data: PrescriptionCreate):
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    INSERT INTO prescriptions (parent_user_id, doctor_name, medicine_name, dosage, frequency, instructions, start_date, end_date, source, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (data.parent_user_id, data.doctor_name, data.medicine_name, data.dosage, data.frequency, data.instructions, data.start_date, data.end_date, data.source, now_str))
    p_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"status": "Created", "id": p_id}

# 15. Real Voice Messages with Speech-to-Text (Feature 4)
@app.post("/api/voice/send")
async def send_voice_message(data: VoiceMessageSend):
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    transcript_text = data.speech_text.strip() if data.speech_text else ""
    transcript_status = "Transcribed" if transcript_text else "Transcription Unavailable (Listen to audio)"

    cursor.execute("""
    INSERT INTO voice_messages (sender_user_id, recipient_user_id, audio_data, transcript, language, status, duration_seconds, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (data.sender_user_id, data.recipient_user_id, data.audio_data, transcript_text, data.language, transcript_status, data.duration_seconds, now_str))
    msg_id = cursor.lastrowid

    cursor.execute("SELECT full_name FROM users WHERE id = ?", (data.sender_user_id,))
    sender = cursor.fetchone()
    sender_name = sender["full_name"] if sender else "Parent"

    # Notification for recipient
    cursor.execute("""
    INSERT INTO notifications (user_id, event_type, title, body, related_entity_id, created_at)
    VALUES (?, 'voice_message', 'New Voice Message Received', ?, ?, ?)
    """, (data.recipient_user_id, f"{sender_name} sent you a voice message: '{transcript_text[:50]}...'" if transcript_text else f"{sender_name} sent you an audio voice message.", msg_id, now_str))

    conn.commit()
    conn.close()

    await manager.broadcast({
        "event": "VOICE_MESSAGE_RECEIVED",
        "recipient_user_id": data.recipient_user_id,
        "sender_id": data.sender_user_id,
        "sender_name": sender_name,
        "message_id": msg_id,
        "transcript": transcript_text
    })

    return {"status": "Sent", "id": msg_id, "transcript": transcript_text, "transcription_status": transcript_status}

@app.get("/api/voice/messages")
def get_voice_messages(user_id: int, other_user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT v.*, u.full_name as sender_name
    FROM voice_messages v
    JOIN users u ON v.sender_user_id = u.id
    WHERE (v.sender_user_id = ? AND v.recipient_user_id = ?)
       OR (v.sender_user_id = ? AND v.recipient_user_id = ?)
    ORDER BY v.id ASC
    """, (user_id, other_user_id, other_user_id, user_id))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

# 16. Location Sharing & Help Requests (Feature 5)
@app.post("/api/location/share")
async def share_location_record(data: LocationShareCreate):
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
    INSERT INTO location_shares (sender_user_id, recipient_user_id, latitude, longitude, address, accuracy, battery_level, note, shared_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    """, (data.sender_user_id, data.recipient_user_id, data.latitude, data.longitude, data.address, data.accuracy, data.battery_level, data.note, now_str))
    loc_id = cursor.lastrowid

    cursor.execute("SELECT full_name FROM users WHERE id = ?", (data.sender_user_id,))
    sender = cursor.fetchone()
    sender_name = sender["full_name"] if sender else "Parent"

    cursor.execute("""
    INSERT INTO notifications (user_id, event_type, title, body, related_entity_id, created_at)
    VALUES (?, 'location_shared', 'Location Shared', ?, ?, ?)
    """, (data.recipient_user_id, f"{sender_name} shared location: {data.address}", loc_id, now_str))

    conn.commit()
    conn.close()

    await manager.broadcast({
        "event": "LOCATION_SHARED",
        "recipient_user_id": data.recipient_user_id,
        "sender_id": data.sender_user_id,
        "sender_name": sender_name,
        "address": data.address,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "shared_at": now_str
    })

    return {"status": "Success", "id": loc_id, "shared_at": now_str}

@app.get("/api/location/latest")
def get_latest_location(parent_user_id: int, requesting_user_id: Optional[int] = None):
    conn = get_connection()
    cursor = conn.cursor()

    if requesting_user_id and requesting_user_id != parent_user_id:
        cursor.execute("""
        SELECT p.receive_location
        FROM family_connections c
        JOIN permission_grants p ON c.id = p.connection_id
        WHERE ((c.requester_user_id = ? AND c.recipient_user_id = ?) OR (c.requester_user_id = ? AND c.recipient_user_id = ?))
          AND c.status = 'accepted'
        """, (requesting_user_id, parent_user_id, parent_user_id, requesting_user_id))
        perm = cursor.fetchone()
        if not perm or perm["receive_location"] != 1:
            conn.close()
            raise HTTPException(status_code=403, detail="Access denied: Location sharing not authorized.")

    cursor.execute("""
    SELECT * FROM location_shares
    WHERE sender_user_id = ?
    ORDER BY id DESC LIMIT 1
    """, (parent_user_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {"location": None, "freshness": "unavailable"}

    loc = dict(row)
    try:
        shared_dt = datetime.fromisoformat(loc["shared_at"].replace(" ", "T"))
        age_minutes = (datetime.now() - shared_dt).total_seconds() / 60
        if age_minutes < 15:
            freshness = "current"
        elif age_minutes < 120:
            freshness = "recent"
        else:
            freshness = "stale"
    except Exception:
        freshness = "recent"

    return {"location": loc, "freshness": freshness}

@app.post("/api/help-requests")
async def create_help_request(data: HelpRequestCreate):
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
    INSERT INTO help_requests (parent_user_id, assigned_family_user_id, category, description, voice_message_id, location_share_id, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'Submitted', ?, ?)
    """, (data.parent_user_id, data.assigned_family_user_id, data.category, data.description, data.voice_message_id, data.location_share_id, now_str, now_str))
    req_id = cursor.lastrowid

    cursor.execute("SELECT full_name FROM users WHERE id = ?", (data.parent_user_id,))
    p = cursor.fetchone()
    parent_name = p["full_name"] if p else "Parent"

    if data.assigned_family_user_id:
        cursor.execute("""
        INSERT INTO notifications (user_id, event_type, title, body, related_entity_id, created_at)
        VALUES (?, 'help_request', 'Help Request from Parent', ?, ?, ?)
        """, (data.assigned_family_user_id, f"{parent_name} needs assistance: '{data.category}' - {data.description}", req_id, now_str))

    conn.commit()
    conn.close()

    await manager.broadcast({
        "event": "HELP_REQUEST_CREATED",
        "parent_id": data.parent_user_id,
        "parent_name": parent_name,
        "category": data.category,
        "request_id": req_id
    })

    return {"status": "Submitted", "id": req_id}

@app.get("/api/help-requests")
def get_help_requests(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT r.*, u1.full_name as parent_name, u2.full_name as assigned_name,
           v.audio_data, v.transcript as voice_transcript,
           l.latitude, l.longitude, l.address as location_address
    FROM help_requests r
    JOIN users u1 ON r.parent_user_id = u1.id
    LEFT JOIN users u2 ON r.assigned_family_user_id = u2.id
    LEFT JOIN voice_messages v ON r.voice_message_id = v.id
    LEFT JOIN location_shares l ON r.location_share_id = l.id
    WHERE r.parent_user_id = ? OR r.assigned_family_user_id = ?
    ORDER BY r.id DESC
    """, (user_id, user_id))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@app.patch("/api/help-requests/{request_id}/status")
async def update_help_request_status(request_id: int, data: HelpRequestStatusUpdate):
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("SELECT parent_user_id, category FROM help_requests WHERE id = ?", (request_id,))
    req = cursor.fetchone()
    if not req:
        conn.close()
        raise HTTPException(status_code=404, detail="Help request not found")

    cursor.execute("""
    UPDATE help_requests
    SET status = ?, updated_at = ?
    WHERE id = ?
    """, (data.status, now_str, request_id))

    # Notify parent
    cursor.execute("""
    INSERT INTO notifications (user_id, event_type, title, body, related_entity_id, created_at)
    VALUES (?, 'request_status_update', 'Request Status Update', ?, ?, ?)
    """, (req["parent_user_id"], f"Your request '{req['category']}' status is now: {data.status}.", request_id, now_str))

    conn.commit()
    conn.close()

    await manager.broadcast({
        "event": "HELP_REQUEST_UPDATED",
        "request_id": request_id,
        "new_status": data.status
    })

    return {"status": "Updated", "id": request_id, "new_status": data.status}

# 17. Notifications
@app.get("/api/notifications")
def get_user_notifications(user_id: int, unread_only: bool = False):
    conn = get_connection()
    cursor = conn.cursor()
    if unread_only:
        cursor.execute("SELECT * FROM notifications WHERE user_id = ? AND read_at IS NULL ORDER BY id DESC", (user_id,))
    else:
        cursor.execute("SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 30", (user_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@app.patch("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("UPDATE notifications SET read_at = ? WHERE id = ?", (now_str, notification_id))
    conn.commit()
    conn.close()
    return {"status": "Read", "id": notification_id}

# 6. Pipeline Orchestrator & Edge-Case Simulation
@app.post("/api/pipeline/trigger")
async def trigger_pipeline():
    result = run_orchestrated_pipeline()
    # Broadcast to websocket if alerts were created
    if result["summary"]["new_alerts"] > 0:
        await manager.broadcast({
            "event": "NEW_ALERTS_GENERATED",
            "count": result["summary"]["new_alerts"],
            "batch_id": result["batch_id"]
        })
    return result

@app.get("/api/pipeline/quarantine")
def get_quarantine_records():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM quarantine_records ORDER BY id DESC LIMIT 50")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@app.post("/api/pipeline/simulate-edge-case")
async def simulate_edge_case(data: EdgeCaseSimulate):
    """
    Live Demonstration Endpoint for Faculty / Evaluation Committee:
    Simulates any of the 5 edge cases on demand!
    """
    conn = get_connection()
    cursor = conn.cursor()

    if data.edge_case_type == "inactivity":
        # Simulate 8 hour inactivity on parent
        t_past = (datetime.now() - timedelta(hours=8)).isoformat()
        cursor.execute("UPDATE parents SET last_heartbeat = ? WHERE id = ?", (t_past, data.parent_id))
        conn.commit()
        conn.close()
        # Run alert engine
        summary = run_alert_engine(inactivity_threshold_hours=4.0)
        await manager.broadcast({"event": "EDGE_CASE_TRIGGERED", "type": "INACTIVITY_TIMEOUT", "details": summary})
        return {"status": "Simulated Inactivity Timeout (8h silent)", "alert_summary": summary}

    elif data.edge_case_type == "dedup_storm":
        # Simulate 40 rapid alarms
        now = datetime.now()
        created_count = 0
        suppressed_count = 0
        for i in range(40):
            created, aid, count = emit_alert_with_dedup(
                cursor, data.parent_id, "Acute Tachycardia Spike",
                "Heart rate spike to 138 bpm detected", "Emergency", now + timedelta(seconds=i)
            )
            if created:
                created_count += 1
            else:
                suppressed_count += 1
        conn.commit()
        conn.close()
        await manager.broadcast({"event": "EDGE_CASE_TRIGGERED", "type": "DEDUP_STORM", "created": created_count, "suppressed": suppressed_count})
        return {
            "status": "Simulated 40-Alarm Flood",
            "emitted": created_count,
            "suppressed_by_hash_cache": suppressed_count
        }

    elif data.edge_case_type == "poison_pill":
        conn.close()
        # Ingest poison records to test DLQ isolation
        poison_payload = [
            {"parent_id": 99999, "doctor_name": "Ghost Dr", "hospital_clinic": "Ghost", "appointment_date": "INVALID-DATE", "purpose": "Check", "feed_type": "appointments"}
        ]
        res = run_orchestrated_pipeline(synthetic_stream=poison_payload)
        await manager.broadcast({"event": "EDGE_CASE_TRIGGERED", "type": "POISON_PILL_DLQ", "quarantined": res["summary"]["dlq_quarantined"]})
        return {"status": "Injected Poison Pill Payload", "pipeline_result": res}

    conn.close()
    return {"status": "Unknown edge case type"}

# 7. WebSocket Live Feed
@app.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo heartbeat ping
            await websocket.send_text(json.dumps({"type": "PONG", "time": datetime.now().isoformat()}))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
