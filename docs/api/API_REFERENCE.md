# ParentCare360 — REST API Reference & Endpoint Catalog

**Base URL (Local):** `http://localhost:8000`  
**Base URL (Cloud Render):** `https://parentcare360-api.onrender.com`  
**Interactive Swagger UI:** `/docs`  
**Interactive ReDoc:** `/redoc`

---

## 1. System Health & Gateway Endpoints

### `GET /`
- **Description:** Verifies service availability and gateway version.
- **Response `200 OK`:**
  ```json
  {
    "status": "online",
    "service": "ParentCare360 Live API Gateway",
    "version": "2.0.0",
    "timestamp": "2026-10-21T23:20:55.947149"
  }
  ```

---

## 2. Authentication & User Management

### `POST /api/auth/register`
- **Description:** Registers a new user account with hashed password and auto-generated invitation code.
- **Request Body:**
  ```json
  {
    "username": "ramesh_patel",
    "password": "password123",
    "full_name": "Ramesh Patel",
    "role": "parent",
    "phone": "+91 98765 11111",
    "city": "Ahmedabad",
    "age": 72,
    "emergency_contact": "+91 98765 22222"
  }
  ```
- **Response `200 OK`:** Returns created user object including `invitation_code` (e.g. `RAMESH-5812`).

### `POST /api/auth/login`
- **Description:** Authenticates username and password, returning user persona details.
- **Request Body:**
  ```json
  {
    "username": "joe",
    "password": "password123"
  }
  ```
- **Response `200 OK`:** User identity, role, and profile attributes.

---

## 3. Family Connection Handshake & Permissions

### `POST /api/connections/request`
- **Description:** Sends a relationship connection request using a parent's invitation code or username.
- **Request Body:**
  ```json
  {
    "requester_user_id": 2,
    "target_identifier": "JOE-7401",
    "relationship_type": "Child (Son)"
  }
  ```
- **Safety Checks:** Self-connection is blocked with `400 Bad Request` ("You cannot send a connection request to yourself").
- **Response `200 OK`:**
  ```json
  {
    "status": "Requested",
    "connection_id": 2,
    "recipient_name": "Joe"
  }
  ```

### `GET /api/connections/{user_id}`
- **Description:** Lists all `connected`, `incoming`, and `outgoing` connection requests for a user.

### `PATCH /api/connections/{connection_id}/accept`
- **Description:** Parent accepts a pending connection request and initializes permission grants.

---

## 4. Location & GPS Telemetry

### `POST /api/location/share`
- **Description:** Shares current GPS coordinates, reverse-geocoded address, accuracy, and battery level.
- **Request Body:**
  ```json
  {
    "sender_user_id": 1,
    "recipient_user_id": 2,
    "latitude": 12.9716,
    "longitude": 77.5946,
    "address": "Indiranagar 100ft Rd, Bengaluru",
    "accuracy": 12.0,
    "battery_level": 78,
    "note": "At morning walk"
  }
  ```

---

## 5. Voice Notes & Transcription

### `POST /api/voice/send`
- **Description:** Sends recorded audio base64 payload and transcript to a recipient.
- **Request Body:**
  ```json
  {
    "sender_user_id": 1,
    "recipient_user_id": 2,
    "audio_data": "data:audio/webm;base64,...",
    "transcript": "Bete, can you arrange cab for tomorrow's hospital checkup?",
    "duration_seconds": 6
  }
  ```

---

## 6. Clinical Prescriptions & Documents

### `GET /api/prescriptions/{parent_user_id}`
- **Description:** Returns active medications, dosage instructions, and doctor attribution.

### `POST /api/prescriptions`
- **Description:** Records a new prescription entry.

---

## 7. Pipeline & Edge-Case Simulation

### `POST /api/pipeline/run`
- **Description:** Manually triggers complete 4-stage inter-DAG pipeline.

### `POST /api/pipeline/simulate-edge-case`
- **Description:** Injects edge scenarios (`inactivity`, `dedup_storm`, `poison_pill`, `out_of_order`).
