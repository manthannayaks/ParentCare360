-- ParentCare360: Master Relational Schema Definition
-- Engine: SQLite 3.9+ with Write-Ahead Logging (WAL)
-- Target: data/parentcare360.db

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

-- ============================================================================
-- 1. Core Elderly Care Operational Entities
-- ============================================================================

CREATE TABLE IF NOT EXISTS parents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    emergency_contact TEXT NOT NULL,
    medical_notes TEXT,
    last_heartbeat TEXT
);

CREATE TABLE IF NOT EXISTS family_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER NOT NULL,
    full_name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    city TEXT NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES parents (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS caregivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    role TEXT NOT NULL,
    city TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    hospital_clinic TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER NOT NULL,
    doctor_id INTEGER,
    doctor_name TEXT NOT NULL,
    hospital_clinic TEXT NOT NULL,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    purpose TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Upcoming',
    doctor_notes TEXT,
    FOREIGN KEY (parent_id) REFERENCES parents (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS caregiver_visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER NOT NULL,
    caregiver_id INTEGER NOT NULL,
    scheduled_datetime TEXT NOT NULL,
    actual_completion_datetime TEXT,
    status TEXT NOT NULL DEFAULT 'Scheduled',
    visit_notes TEXT,
    FOREIGN KEY (parent_id) REFERENCES parents (id) ON DELETE CASCADE,
    FOREIGN KEY (caregiver_id) REFERENCES caregivers (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS household_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium',
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TEXT NOT NULL,
    notes TEXT,
    assigned_to TEXT,
    FOREIGN KEY (parent_id) REFERENCES parents (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    document_url TEXT,
    notes TEXT,
    uploaded_by TEXT NOT NULL DEFAULT 'Family',
    created_at TEXT NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES parents (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS parent_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER NOT NULL,
    latitude REAL,
    longitude REAL,
    address TEXT NOT NULL,
    accuracy REAL,
    battery_level INTEGER,
    shared_at TEXT NOT NULL,
    note TEXT,
    FOREIGN KEY (parent_id) REFERENCES parents (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS travel_journeys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    current_location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Scheduled',
    FOREIGN KEY (parent_id) REFERENCES parents (id) ON DELETE CASCADE
);

-- ============================================================================
-- 2. Data Engineering & Governance Subsystem (DLQ & Deduplication)
-- ============================================================================

CREATE TABLE IF NOT EXISTS quarantine_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id TEXT NOT NULL,
    source_feed TEXT NOT NULL,
    record_payload TEXT NOT NULL,
    error_code TEXT NOT NULL,
    error_message TEXT NOT NULL,
    quarantined_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alert_dedup_cache (
    dedup_hash TEXT PRIMARY KEY,
    parent_id INTEGER NOT NULL,
    alert_type TEXT NOT NULL,
    first_seen TEXT NOT NULL,
    last_seen TEXT NOT NULL,
    occurrence_count INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER NOT NULL,
    alert_type TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'Warning',
    is_resolved INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES parents (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS care_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    timestamp TEXT NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES parents (id) ON DELETE CASCADE
);

-- ============================================================================
-- 3. Mobile Platform, Multi-Persona RBAC & Privacy Controls
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    city TEXT,
    address TEXT,
    age INTEGER,
    gender TEXT,
    emergency_contact TEXT,
    medical_notes TEXT,
    preferred_language TEXT DEFAULT 'en-IN',
    invitation_code TEXT UNIQUE,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS family_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_user_id INTEGER NOT NULL,
    recipient_user_id INTEGER NOT NULL,
    relationship_type TEXT DEFAULT 'Child',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    responded_at TEXT,
    FOREIGN KEY (requester_user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS permission_grants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_id INTEGER NOT NULL,
    parent_user_id INTEGER NOT NULL,
    family_user_id INTEGER NOT NULL,
    view_prescriptions INTEGER NOT NULL DEFAULT 1,
    view_appointments INTEGER NOT NULL DEFAULT 1,
    view_documents INTEGER NOT NULL DEFAULT 1,
    receive_voice INTEGER NOT NULL DEFAULT 1,
    receive_location INTEGER NOT NULL DEFAULT 1,
    receive_help INTEGER NOT NULL DEFAULT 1,
    manage_caregiver INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (connection_id) REFERENCES family_connections (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_user_id INTEGER NOT NULL,
    doctor_name TEXT,
    medicine_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    instructions TEXT,
    start_date TEXT,
    end_date TEXT,
    source TEXT DEFAULT 'Doctor Rx',
    created_at TEXT NOT NULL,
    FOREIGN KEY (parent_user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS voice_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_user_id INTEGER NOT NULL,
    recipient_user_id INTEGER NOT NULL,
    audio_data TEXT,
    transcript TEXT,
    language TEXT DEFAULT 'en-IN',
    status TEXT DEFAULT 'Transcribed',
    duration_seconds INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    listened_at TEXT,
    FOREIGN KEY (sender_user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS location_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_user_id INTEGER NOT NULL,
    recipient_user_id INTEGER NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    address TEXT NOT NULL,
    accuracy REAL,
    battery_level INTEGER,
    note TEXT,
    shared_at TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (sender_user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS help_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_user_id INTEGER NOT NULL,
    assigned_family_user_id INTEGER,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    voice_message_id INTEGER,
    location_share_id INTEGER,
    status TEXT NOT NULL DEFAULT 'Submitted',
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY (parent_user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_family_user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    related_entity_id INTEGER,
    read_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- ============================================================================
-- 4. Composite Performance B-Tree Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_visits_status_time ON caregiver_visits (status, scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_appts_status_date ON appointments (status, appointment_date);
CREATE INDEX IF NOT EXISTS idx_reqs_priority_status ON household_requests (priority, status);
CREATE INDEX IF NOT EXISTS idx_alerts_parent_res ON alerts (parent_id, is_resolved);
CREATE INDEX IF NOT EXISTS idx_quarantine_batch ON quarantine_records (batch_id);
CREATE INDEX IF NOT EXISTS idx_docs_parent ON documents (parent_id);
CREATE INDEX IF NOT EXISTS idx_loc_parent ON parent_locations (parent_id, shared_at);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_conn_users ON family_connections (requester_user_id, recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications (user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_voice_recip ON voice_messages (recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_loc_share_recip ON location_shares (recipient_user_id);
