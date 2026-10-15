from database.db import get_connection

def get_all_parents():
    """Fetch list of all parents."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM parents ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_parent_by_id(parent_id):
    """Fetch single parent by ID."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM parents WHERE id = ?", (parent_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_family_members_for_parent(parent_id):
    """Fetch family members associated with a parent."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM family_members WHERE parent_id = ? ORDER BY id ASC", (parent_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def add_parent(full_name, age, gender, phone, city, address, emergency_contact, medical_notes=""):
    """Add a new parent record."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO parents (full_name, age, gender, phone, city, address, emergency_contact, medical_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (full_name, age, gender, phone, city, address, emergency_contact, medical_notes))
    parent_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return parent_id

def add_family_member(parent_id, full_name, relationship, phone, email, city):
    """Add a family member for a parent."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO family_members (parent_id, full_name, relationship, phone, email, city)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (parent_id, full_name, relationship, phone, email, city))
    conn.commit()
    conn.close()
