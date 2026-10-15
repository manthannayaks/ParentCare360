import React, { useState } from 'react';
import { 
  Heart, 
  Users, 
  Stethoscope, 
  ShieldCheck, 
  Settings, 
  ArrowRight, 
  Radio,
  Lock,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  UserPlus,
  LogIn
} from 'lucide-react';

export default function RoleAuthScreen({ onSelectRole, apiBase, onUpdateApiBase }) {
  const [authMode, setAuthMode] = useState('welcome'); // 'welcome' | 'register' | 'login' | 'demo'
  const [showConfig, setShowConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState(apiBase);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState('child'); // 'parent' | 'child' | 'caregiver' | 'doctor'
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regEmergencyContact, setRegEmergencyContact] = useState('');

  // Login Form State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const demoAccounts = [
    {
      role: 'child',
      username: 'sam',
      password: 'password123',
      title: 'Child / Family Member',
      name: 'Sam',
      meta: 'Son in Pune • Inv Code: SAM-2890',
      icon: Users,
      accent: '#6366f1',
      bgGlow: 'rgba(99, 102, 241, 0.15)',
      description: 'Coordinates Joe\'s healthcare, receives location shares & voice notes, organizes rides, and reviews care records.',
      badge: 'Family Coordinator'
    },
    {
      role: 'parent',
      username: 'joe',
      password: 'password123',
      title: 'Parent (Elder)',
      name: 'Joe',
      meta: 'Age 74 • Bengaluru • Inv Code: JOE-7401',
      icon: Heart,
      accent: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      description: 'Ultra-simplified mobile view: Share Location with Sam, send Voice Messages with transcription, view Medicines, Ask for Help.',
      badge: 'Parent Mode'
    },
    {
      role: 'caregiver',
      username: 'priya',
      password: 'password123',
      title: 'Caregiver (Registered Nurse)',
      name: 'Priya Verma',
      meta: 'Bengaluru Healthcare Circle',
      icon: ShieldCheck,
      accent: '#ec4899',
      bgGlow: 'rgba(236, 72, 153, 0.15)',
      description: 'Operational visit roster: Patient address, vital signs recording (BP & Glucose), care checklist, and completion reports.',
      badge: 'Field Ops'
    },
    {
      role: 'doctor',
      username: 'dr_sharma',
      password: 'password123',
      title: 'Doctor (Cardiologist)',
      name: 'Dr. A. K. Sharma',
      meta: 'Manipal Hospital, Bengaluru',
      icon: Stethoscope,
      accent: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.15)',
      description: 'Healthcare dashboard: Linked elder patients, appointment notes recorder, prescription updates, authorized medical records.',
      badge: 'Physician'
    },
    {
      role: 'ops',
      username: '',
      password: '',
      id: 0,
      name: 'System Orchestrator',
      title: 'DAG Pipeline & DLQ Admin',
      meta: 'Data Engineering Course Evaluation',
      icon: Radio,
      accent: '#06b6d4',
      bgGlow: 'rgba(6, 182, 212, 0.15)',
      description: 'Faculty demo panel: Run inter-DAG pipeline, simulate 40-alarm dedup storm, test poison-pill DLQ quarantine.',
      badge: 'Admin'
    }
  ];

  const handleDemoLogin = async (demo) => {
    if (demo.role === 'ops') {
      onSelectRole('ops', 0, 'System Orchestrator', { role: 'ops', id: 0, name: 'System Orchestrator' });
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: demo.username, password: demo.password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed');
      }
      onSelectRole(data.user.role, data.user.id, data.user.full_name, data.user);
    } catch (err) {
      setErrorMessage(err.message || 'Could not connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regFullName.trim() || !regUsername.trim() || !regPassword) {
      setErrorMessage('Please fill in all required fields (Name, Username, Password).');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: regUsername.trim().toLowerCase(),
        email: regEmail.trim().toLowerCase() || `${regUsername.trim().toLowerCase()}@example.com`,
        password: regPassword,
        full_name: regFullName.trim(),
        role: regRole,
        phone: regPhone.trim(),
        city: regCity.trim(),
        age: regAge ? parseInt(regAge) : null,
        emergency_contact: regEmergencyContact.trim()
      };

      const res = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      setSuccessMessage(`Account created! Invitation Code: ${data.user.invitation_code}`);
      setTimeout(() => {
        onSelectRole(data.user.role, data.user.id, data.user.full_name, data.user);
      }, 1000);
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Username may already exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginUsername.trim() || !loginPassword) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim().toLowerCase(),
          password: loginPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid username or password');
      }

      onSelectRole(data.user.role, data.user.id, data.user.full_name, data.user);
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Check your credentials or connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    onUpdateApiBase(customUrl);
    setShowConfig(false);
  };

  return (
    <div style={{
      minHeight: '100%',
      padding: '24px 18px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      background: 'radial-gradient(circle at 50% 0%, #134e4a 0%, #041f1e 50%, #021110 100%)',
      color: '#fff'
    }}>
      {/* Top Branding */}
      <div>
        <div style={{ textAlign: 'center', marginBottom: '20px', paddingTop: '8px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0d9488, #0f766e)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 25px rgba(13, 148, 136, 0.5)',
            marginBottom: '10px'
          }}>
            <Heart size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            ParentCare360
          </h1>
          <p style={{ fontSize: '13px', color: '#99f6e4', maxWidth: '300px', margin: '0 auto', lineHeight: 1.4 }}>
            "Care for your parents, wherever life takes you."
          </p>
        </div>

        {/* Global Error & Success Feedback */}
        {errorMessage && (
          <div style={{
            marginBottom: '14px',
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            marginBottom: '14px',
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#6ee7b7',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ===================== SCREEN 1: WELCOME SCREEN ===================== */}
        {authMode === 'welcome' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Primary Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => { setAuthMode('register'); setErrorMessage(''); }}
                style={{
                  background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '15px',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(13, 148, 136, 0.4)'
                }}
              >
                <UserPlus size={18} />
                <span>Create Account</span>
              </button>

              <button
                onClick={() => { setAuthMode('login'); setErrorMessage(''); }}
                style={{
                  background: 'rgba(15, 118, 110, 0.25)',
                  border: '1px solid rgba(20, 184, 166, 0.4)',
                  color: '#ccfbf1',
                  borderRadius: '14px',
                  padding: '14px',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <LogIn size={18} />
                <span>Log In</span>
              </button>
            </div>

            {/* Quick-Access Demo Section for Professor / Grading */}
            <div style={{ marginTop: '10px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
                borderTop: '1px solid rgba(20, 184, 166, 0.2)',
                paddingTop: '14px'
              }}>
                <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5eead4' }}>
                  Quick Demo Accounts
                </span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  1-Tap Faculty Evaluation
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {demoAccounts.map((d) => {
                  const Icon = d.icon;
                  return (
                    <div
                      key={d.name}
                      onClick={() => !loading && handleDemoLogin(d)}
                      className="persona-picker-card"
                      style={{
                        borderLeft: `4px solid ${d.accent}`,
                        background: 'rgba(19, 78, 74, 0.35)',
                        border: '1px solid rgba(20, 184, 166, 0.25)',
                        borderLeftWidth: '4px',
                        borderLeftColor: d.accent,
                        padding: '12px',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div 
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          background: d.bgGlow,
                          color: d.accent,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Icon size={20} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: '700', fontSize: '14px', color: '#fff' }}>
                            {d.name}
                          </span>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: '800',
                            padding: '2px 6px',
                            borderRadius: '99px',
                            background: d.bgGlow,
                            color: d.accent
                          }}>
                            {d.badge}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#99f6e4', marginTop: '1px' }}>
                          {d.meta}
                        </div>
                      </div>
                      <ArrowRight size={16} color="#5eead4" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===================== SCREEN 2: CREATE ACCOUNT ===================== */}
        {authMode === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>
                Create Your Account
              </h2>
              <button
                type="button"
                onClick={() => setAuthMode('welcome')}
                style={{ background: 'transparent', border: 'none', color: '#5eead4', fontSize: '12px', cursor: 'pointer' }}
              >
                Back
              </button>
            </div>

            {/* Role Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#99f6e4', marginBottom: '6px', textTransform: 'uppercase' }}>
                Select Your Role:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { id: 'parent', label: 'Parent (Elder)', icon: Heart },
                  { id: 'child', label: 'Child / Family', icon: Users },
                  { id: 'caregiver', label: 'Caregiver', icon: ShieldCheck },
                  { id: 'doctor', label: 'Doctor', icon: Stethoscope }
                ].map((r) => {
                  const Icon = r.icon;
                  const isSelected = regRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRegRole(r.id)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #14b8a6' : '1px solid rgba(20, 184, 166, 0.2)',
                        background: isSelected ? 'rgba(20, 184, 166, 0.25)' : 'rgba(19, 78, 74, 0.3)',
                        color: isSelected ? '#fff' : '#94a3b8',
                        fontSize: '12px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Icon size={14} color={isSelected ? '#14b8a6' : '#94a3b8'} />
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Standard Profile Fields */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#99f6e4', marginBottom: '4px' }}>Full Name *</label>
              <input
                type="text"
                required
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder={regRole === 'parent' ? 'e.g. Joe' : 'e.g. Sam'}
                className="input-field"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#99f6e4', marginBottom: '4px' }}>Username *</label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="e.g. sam"
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#99f6e4', marginBottom: '4px' }}>City</label>
                <input
                  type="text"
                  value={regCity}
                  onChange={(e) => setRegCity(e.target.value)}
                  placeholder={regRole === 'parent' ? 'Bengaluru' : 'Pune'}
                  className="input-field"
                />
              </div>
            </div>

            {/* Role-Specific Fields */}
            {regRole === 'parent' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#99f6e4', marginBottom: '4px' }}>Age</label>
                  <input
                    type="number"
                    value={regAge}
                    onChange={(e) => setRegAge(e.target.value)}
                    placeholder="74"
                    className="input-field"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#99f6e4', marginBottom: '4px' }}>Emergency Contact</label>
                  <input
                    type="text"
                    value={regEmergencyContact}
                    onChange={(e) => setRegEmergencyContact(e.target.value)}
                    placeholder="Phone number"
                    className="input-field"
                  />
                </div>
              </div>
            )}

            {regRole === 'child' && (
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#99f6e4', marginBottom: '4px' }}>Phone Number</label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="input-field"
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#99f6e4', marginBottom: '4px' }}>Password *</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#99f6e4', marginBottom: '4px' }}>Confirm Password *</label>
                <input
                  type="password"
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '6px'
              }}
            >
              {loading ? 'Creating Account...' : 'Complete Registration & Open App'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Already have an account? </span>
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setErrorMessage(''); }}
                style={{ background: 'transparent', border: 'none', color: '#5eead4', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                Log In
              </button>
            </div>
          </form>
        )}

        {/* ===================== SCREEN 3: LOG IN ===================== */}
        {authMode === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>
                Log In to ParentCare360
              </h2>
              <button
                type="button"
                onClick={() => setAuthMode('welcome')}
                style={{ background: 'transparent', border: 'none', color: '#5eead4', fontSize: '12px', cursor: 'pointer' }}
              >
                Back
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#99f6e4', marginBottom: '4px' }}>
                Username or Email
              </label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="e.g. joe or sam"
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#99f6e4', marginBottom: '4px' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              {loading ? 'Logging In...' : 'Log In'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Don't have an account yet? </span>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setErrorMessage(''); }}
                style={{ background: 'transparent', border: 'none', color: '#5eead4', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                Create Account
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer / Server Settings for Local Phone APK Testing */}
      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(20, 184, 166, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#99f6e4' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            Backend: {apiBase}
          </div>
          <button
            onClick={() => setShowConfig(!showConfig)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#5eead4',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Settings size={13} />
            Configure IP
          </button>
        </div>

        {showConfig && (
          <form onSubmit={handleSaveConfig} style={{ marginTop: '12px', background: 'rgba(4, 31, 30, 0.9)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(20, 184, 166, 0.3)' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#99f6e4', marginBottom: '6px' }}>
              Backend Server URL (e.g. http://10.22.16.111:8000 for phone Wi-Fi):
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="http://10.22.16.111:8000"
                style={{
                  flex: 1,
                  background: '#021110',
                  border: '1px solid #134e4a',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '6px 10px',
                  fontSize: '12px'
                }}
              />
              <button
                type="submit"
                style={{
                  background: '#0d9488',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
