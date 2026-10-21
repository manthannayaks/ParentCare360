-- Migration 002: Mobile Features, Privacy Control, and Composite Performance Indexes
-- Date: 2026-10-14
-- Description: Independent accounts, RBAC permissions, prescriptions, audio notes, GPS shares, notifications, and B-Tree indexes

-- 1. Sliding-window Alert Deduplication Cache
CREATE TABLE IF NOT EXISTS alert_dedup_cache (
    dedup_hash TEXT PRIMARY KEY,
    parent_id INTEGER NOT NULL,
    alert_type TEXT NOT NULL,
    first_seen TEXT NOT NULL,
    last_seen TEXT NOT NULL,
    occurrence_count INTEGER DEFAULT 1
);

-- 2. Independent Accounts & Authentication
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

-- 3. Family Connections & Granular Permissions
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

-- 4. Clinical Prescriptions
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

-- 5. Audio Voice Messaging
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

-- 6. GPS Location Sharing & Assistance Requests
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

-- 7. Composite Performance B-Tree Indexes
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
