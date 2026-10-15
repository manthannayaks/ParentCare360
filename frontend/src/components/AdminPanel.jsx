import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Key, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  ArrowLeft,
  Copy,
  Radio,
  RefreshCw,
  Search
} from 'lucide-react';

export default function AdminPanel({ apiBase, onLogout, onSelectUser, onBackToLogin }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create User Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState('child'); // 'parent' | 'child' | 'caregiver' | 'doctor'
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [age, setAge] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/users/search?q= `);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.warn("Could not fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [apiBase]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim() || !username.trim() || !password) {
      setErrorMsg('Please fill in Name, Username, and Password.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        username: username.trim().toLowerCase(),
        password: password,
        full_name: fullName.trim(),
        role: role,
        phone: phone.trim() || '+91 98765 00000',
        city: city.trim() || 'Bengaluru',
        age: age ? parseInt(age) : (role === 'parent' ? 70 : 35),
        emergency_contact: '+91 98765 43210'
      };

      const res = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to create user');
      }

      setSuccessMsg(`User created! Username: "${data.user.username}" • Code: "${data.user.invitation_code}"`);
      setFullName('');
      setUsername('');
      setPhone('');
      setCity('');
      setAge('');
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.message || 'Error creating user. Username might already exist.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (text, id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.invitation_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{
      width: '100%',
      minHeight: '100%',
      background: '#041f1e',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <header style={{
        padding: '16px',
        background: '#021110',
        borderBottom: '1px solid rgba(20, 184, 166, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={onLogout}
            style={{ background: 'transparent', border: 'none', color: '#5eead4', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>User Admin Panel</h1>
            <div style={{ fontSize: '11px', color: '#99f6e4' }}>Create & Manage Test Accounts</div>
          </div>
        </div>

        <button
          onClick={onLogout}
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '11px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <LogOut size={13} />
          <span>Exit Admin</span>
        </button>
      </header>

      {/* Content */}
      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
        
        {/* CREATE TEST USER FORM */}
        <div style={{
          background: 'rgba(19, 78, 74, 0.35)',
          border: '1px solid rgba(20, 184, 166, 0.3)',
          borderRadius: '16px',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <UserPlus size={18} color="#5eead4" />
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>
              Create New Test Account
            </span>
          </div>

          {successMsg && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '12px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '12px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Role Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#99f6e4', marginBottom: '4px' }}>Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px' }}>
                {[
                  { id: 'parent', label: 'Parent' },
                  { id: 'child', label: 'Child' },
                  { id: 'caregiver', label: 'Caregiver' },
                  { id: 'doctor', label: 'Doctor' }
                ].map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: role === r.id ? '2px solid #14b8a6' : '1px solid rgba(20, 184, 166, 0.2)',
                      background: role === r.id ? 'rgba(20, 184, 166, 0.3)' : 'transparent',
                      color: role === r.id ? '#fff' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#99f6e4', marginBottom: '4px' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh"
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#99f6e4', marginBottom: '4px' }}>Username *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ramesh"
                  className="input-field"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#99f6e4', marginBottom: '4px' }}>Password *</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password123"
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#99f6e4', marginBottom: '4px' }}>City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="input-field"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ padding: '12px', marginTop: '4px' }}
            >
              {submitting ? 'Creating...' : '+ Add Test User to Database'}
            </button>
          </form>
        </div>

        {/* USERS LIST */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#5eead4' }}>
              All Registered Accounts ({filteredUsers.length})
            </span>
            <button
              onClick={fetchUsers}
              style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
            >
              <RefreshCw size={12} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Search box */}
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, role, username, or code..."
              className="input-field"
              style={{ fontSize: '12px' }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Loading accounts...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.15)',
                    borderRadius: '12px',
                    padding: '10px 12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>
                        {u.full_name} <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '400' }}>({u.username})</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#5eead4', textTransform: 'capitalize', marginTop: '2px' }}>
                        Role: <strong>{u.role}</strong> • {u.city || 'No city'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopy(u.invitation_code, u.id)}
                      style={{
                        background: 'rgba(20, 184, 166, 0.15)',
                        border: '1px solid rgba(20, 184, 166, 0.3)',
                        color: '#5eead4',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Copy invitation code"
                    >
                      <Copy size={11} />
                      <span>{copiedId === u.id ? 'Copied!' : (u.invitation_code || 'No code')}</span>
                    </button>
                  </div>

                  {onSelectUser && (
                    <button
                      onClick={() => onSelectUser(u)}
                      style={{
                        marginTop: '10px',
                        width: '100%',
                        background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '7px 10px',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>🚀 Log In As {u.full_name || u.username} ({u.role})</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
