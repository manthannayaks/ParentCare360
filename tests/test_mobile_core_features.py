import pytest
from fastapi.testclient import TestClient
from api.main import app
from database.db import init_db

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    init_db()

def test_feature_1_independent_accounts_and_login():
    """TEST 1: Sam creates a Child account and Joe creates a Parent account independently."""
    # Register Sam
    sam_payload = {
        "username": "test_sam",
        "email": "test_sam@example.com",
        "password": "password123",
        "full_name": "Sam Test",
        "role": "child",
        "phone": "+91 98765 00001",
        "city": "Pune"
    }
    r = client.post("/api/auth/register", json=sam_payload)
    assert r.status_code == 200, r.text
    sam_data = r.json()["user"]
    assert sam_data["username"] == "test_sam"
    assert sam_data["role"] == "child"
    assert "invitation_code" in sam_data

    # Register Joe
    joe_payload = {
        "username": "test_joe",
        "email": "test_joe@example.com",
        "password": "password123",
        "full_name": "Joe Test",
        "role": "parent",
        "phone": "+91 98290 00002",
        "city": "Bengaluru",
        "age": 74
    }
    r = client.post("/api/auth/register", json=joe_payload)
    assert r.status_code == 200, r.text
    joe_data = r.json()["user"]
    assert joe_data["username"] == "test_joe"
    assert joe_data["role"] == "parent"
    assert "invitation_code" in joe_data

    # Verify both can log in separately
    r_login_sam = client.post("/api/auth/login", json={"username": "test_sam", "password": "password123"})
    assert r_login_sam.status_code == 200
    assert r_login_sam.json()["user"]["role"] == "child"

    r_login_joe = client.post("/api/auth/login", json={"username": "test_joe", "password": "password123"})
    assert r_login_joe.status_code == 200
    assert r_login_joe.json()["user"]["role"] == "parent"

    # Accounts are NOT automatically connected
    r_conn = client.get(f"/api/connections/{joe_data['id']}")
    assert r_conn.status_code == 200
    assert len(r_conn.json()["connected"]) == 0

def test_feature_2_connection_request_and_acceptance():
    """TEST 2: Sam searches for Joe by invitation code and connects."""
    # Find Joe's ID and invitation code
    r_joe = client.post("/api/auth/login", json={"username": "test_joe", "password": "password123"})
    joe_id = r_joe.json()["user"]["id"]
    joe_code = r_joe.json()["user"]["invitation_code"]

    r_sam = client.post("/api/auth/login", json={"username": "test_sam", "password": "password123"})
    sam_id = r_sam.json()["user"]["id"]

    # Sam sends connection request
    r_req = client.post("/api/connections/request", json={
        "requester_user_id": sam_id,
        "target_identifier": joe_code,
        "relationship_type": "Son"
    })
    assert r_req.status_code == 200, r_req.text
    conn_id = r_req.json()["connection_id"]

    # Joe sees incoming request
    r_incoming = client.get(f"/api/connections/{joe_id}")
    incoming_list = r_incoming.json()["incoming"]
    assert any(inc["connection_id"] == conn_id for inc in incoming_list)

    # Before Joe accepts, Sam cannot access Joe's prescriptions (403)
    r_presc_pre = client.get(f"/api/prescriptions?parent_user_id={joe_id}&requesting_user_id={sam_id}")
    assert r_presc_pre.status_code == 403

    # Joe accepts request
    r_accept = client.post(f"/api/connections/{conn_id}/respond", json={
        "connection_id": conn_id,
        "user_id": joe_id,
        "action": "accept"
    })
    assert r_accept.status_code == 200
    assert r_accept.json()["new_status"] == "accepted"

    # Both see active connection
    r_joe_conn = client.get(f"/api/connections/{joe_id}")
    assert any(c["connection_id"] == conn_id for c in r_joe_conn.json()["connected"])

    r_sam_conn = client.get(f"/api/connections/{sam_id}")
    assert any(c["connection_id"] == conn_id for c in r_sam_conn.json()["connected"])

def test_feature_3_prescriptions_and_permissions():
    """TEST 3: Health information sharing and permission verification."""
    r_joe = client.post("/api/auth/login", json={"username": "test_joe", "password": "password123"})
    joe_id = r_joe.json()["user"]["id"]

    r_sam = client.post("/api/auth/login", json={"username": "test_sam", "password": "password123"})
    sam_id = r_sam.json()["user"]["id"]

    # Joe adds a prescription
    r_add_rx = client.post("/api/prescriptions", json={
        "parent_user_id": joe_id,
        "medicine_name": "Amlodipine Besylate",
        "dosage": "5 mg",
        "frequency": "Once daily",
        "doctor_name": "Dr. A. K. Sharma",
        "instructions": "Take after breakfast with water"
    })
    assert r_add_rx.status_code == 200

    # Sam can view the authorized prescription
    r_rx_sam = client.get(f"/api/prescriptions?parent_user_id={joe_id}&requesting_user_id={sam_id}")
    assert r_rx_sam.status_code == 200
    assert len(r_rx_sam.json()) >= 1
    assert r_rx_sam.json()[0]["medicine_name"] == "Amlodipine Besylate"

    # An unrelated user is blocked (403)
    r_unrelated = client.get(f"/api/prescriptions?parent_user_id={joe_id}&requesting_user_id=99999")
    assert r_unrelated.status_code == 403

def test_feature_4_voice_messages_with_speech_to_text():
    """TEST 4: Audio recording metadata and transcript linking."""
    r_joe = client.post("/api/auth/login", json={"username": "test_joe", "password": "password123"})
    joe_id = r_joe.json()["user"]["id"]

    r_sam = client.post("/api/auth/login", json={"username": "test_sam", "password": "password123"})
    sam_id = r_sam.json()["user"]["id"]

    # Joe sends voice message to Sam
    r_voice = client.post("/api/voice/send", json={
        "sender_user_id": joe_id,
        "recipient_user_id": sam_id,
        "audio_data": "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQ8USA==...",
        "speech_text": "I have reached Bangalore airport. Please help me get home.",
        "duration_seconds": 6,
        "language": "en-IN"
    })
    assert r_voice.status_code == 200, r_voice.text
    msg_data = r_voice.json()
    assert msg_data["status"] == "Sent"
    assert msg_data["transcript"] == "I have reached Bangalore airport. Please help me get home."

    # Sam receives message with transcript and audio
    r_inbox = client.get(f"/api/voice/messages?user_id={sam_id}&other_user_id={joe_id}")
    assert r_inbox.status_code == 200
    messages = r_inbox.json()
    assert len(messages) >= 1
    latest = messages[-1]
    assert latest["transcript"] == "I have reached Bangalore airport. Please help me get home."
    assert latest["audio_data"].startswith("data:audio/webm;base64")

def test_feature_5_location_sharing_and_help_requests():
    """TEST 5: Location sharing with freshness, and help request tracking."""
    r_joe = client.post("/api/auth/login", json={"username": "test_joe", "password": "password123"})
    joe_id = r_joe.json()["user"]["id"]

    r_sam = client.post("/api/auth/login", json={"username": "test_sam", "password": "password123"})
    sam_id = r_sam.json()["user"]["id"]

    # Joe shares location
    r_loc = client.post("/api/location/share", json={
        "sender_user_id": joe_id,
        "recipient_user_id": sam_id,
        "latitude": 12.9716,
        "longitude": 77.5946,
        "address": "Kempegowda International Airport, Terminal 1, Bengaluru",
        "accuracy": 10.0,
        "battery_level": 85,
        "note": "Waiting at Pillar 4"
    })
    assert r_loc.status_code == 200

    # Sam checks latest location
    r_latest = client.get(f"/api/location/latest?parent_user_id={joe_id}&requesting_user_id={sam_id}")
    assert r_latest.status_code == 200
    loc_data = r_latest.json()
    assert loc_data["location"]["address"] == "Kempegowda International Airport, Terminal 1, Bengaluru"
    assert loc_data["freshness"] == "current"

    # Joe creates help request for ride
    r_help = client.post("/api/help-requests", json={
        "parent_user_id": joe_id,
        "category": "Need a Ride",
        "description": "Landed at BLR airport. Need pickup to home.",
        "assigned_family_user_id": sam_id
    })
    assert r_help.status_code == 200
    req_id = r_help.json()["id"]

    # Sam updates status to Assistance Being Arranged
    r_update = client.patch(f"/api/help-requests/{req_id}/status", json={
        "status": "Assistance Being Arranged",
        "notes": "Cab dispatched"
    })
    assert r_update.status_code == 200
    assert r_update.json()["new_status"] == "Assistance Being Arranged"
