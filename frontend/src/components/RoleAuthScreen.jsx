import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Users, 
  Stethoscope, 
  ShieldCheck, 
  Settings, 
  ArrowRight, 
  Radio,
  Lock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Server
} from 'lucide-react';

export default function RoleAuthScreen({ onSelectRole, apiBase, onUpdateApiBase }) {
  const [showConfig, setShowConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState(apiBase);
  const [loadingRole, setLoadingRole] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [serverOnline, setServerOnline] = useState(null);
  const [showCreateDisabledNotice, setShowCreateDisabledNotice] = useState(false);

  // Pre-configured live demo accounts
  const demoAccounts = [
    {
      role: 'child',
      username: 'sam',
      password: 'password123',
      title: 'Child / Family Member',
      name: 'Sam',
      meta: 'Son in Pune • Code: SAM-2890',
      icon: Users,
      accent: '#6366f1',
      bgGlow: 'rgba(99, 102, 241, 0.18)',
      description: 'Coordinates Joe\'s healthcare, receives live location & voice messages, arranges airport ride pickup, and tracks clinic visits.',
      badge: 'Family Coordinator'
    },
    {
      role: 'parent',
      username: 'joe',
      password: 'password123',
      title: 'Parent (Elder)',
      name: 'Joe',
      meta: 'Age 74 • Bengaluru • Code: JOE-7401',
      icon: Heart,
      accent: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.18)',
      description: 'Ultra-simplified elder view: 1-tap SOS, Speak Voice Request, Share GPS Location, My Medicines & Prescriptions, Ask for Help.',
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
      bgGlow: 'rgba(236, 72, 153, 0.18)',
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
      bgGlow: 'rgba(245, 158, 11, 0.18)',
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
      meta: 'Data Engineering Evaluation',
      icon: Radio,
      accent: '#06b6d4',
      bgGlow: 'rgba(6, 182, 212, 0.18)',
      description: 'Faculty demo panel: Run inter-DAG pipeline, simulate 40-alarm dedup storm, test poison-pill DLQ quarantine.',
      badge: 'DE Admin'
    }
  ];

  // Ping backend to check health
  useEffect(() => {
    let active = true;
    const checkHealth = async () => {
      try {
        const res = await fetch(`${apiBase}/`, { signal: AbortSignal.timeout(4000) });
        if (active) setServerOnline(res.ok);
      } catch (e) {
        if (active) setServerOnline(false);
      }
    };
    checkHealth();
    return () => { active = false; };
  }, [apiBase]);

  const handleSelectDemo = async (demo) => {
    setLoadingRole(demo.role);
    setErrorMessage('');
    setShowCreateDisabledNotice(false);

    if (demo.role === 'ops') {
      onSelectRole('ops', 0, 'System Orchestrator', { role: 'ops', id: 0, name: 'System Orchestrator' });
      return;
    }

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
      console.warn("API login error:", err);
      // Fallback so user can still test in offline mode if network is momentarily disconnected
      onSelectRole(demo.role, demo.role === 'parent' ? 1 : 2, demo.name, {
        id: demo.role === 'parent' ? 1 : 2,
        username: demo.username,
        full_name: demo.name,
        role: demo.role,
        invitation_code: demo.role === 'parent' ? 'JOE-7401' : 'SAM-2890',
        city: demo.role === 'parent' ? 'Bengaluru' : 'Pune'
      });
    } finally {
      setLoadingRole(null);
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
        <div style={{ textAlign: 'center', marginBottom: '18px', paddingTop: '6px' }}>
          <div style={{
            width: '56px',
            height: '56px',
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

        {/* Informational Banner: Demo Accounts Active */}
        <div style={{
          background: 'rgba(20, 184, 166, 0.12)',
          border: '1px solid rgba(20, 184, 166, 0.3)',
          borderRadius: '12px',
          padding: '10px 14px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px'
        }}>
          <Sparkles size={18} color="#5eead4" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#5eead4' }}>
              Live Evaluation Mode
            </div>
            <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.3, marginTop: '2px' }}>
              Select any pre-configured demo account below to instantly open its dedicated role interface.
            </div>
          </div>
        </div>

        {/* Notice when user taps create account */}
        {showCreateDisabledNotice && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '14px',
            color: '#fef08a',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Info size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
            <span>
              <strong>Initialization Phase:</strong> Public self-registration is closed. Please select one of the 4 active live demo accounts below.
            </span>
          </div>
        )}

        {/* Global Error Banner */}
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

        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5eead4' }}>
            Choose Role Account
          </span>
          <button
            onClick={() => setShowCreateDisabledNotice(!showCreateDisabledNotice)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Lock size={11} />
            <span>Create Account</span>
          </button>
        </div>

        {/* 1-Tap Demo Account Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {demoAccounts.map((d) => {
            const Icon = d.icon;
            const isThisLoading = loadingRole === d.role;
            return (
              <div
                key={d.name}
                onClick={() => !loadingRole && handleSelectDemo(d)}
                className="persona-picker-card"
                style={{
                  borderLeft: `4px solid ${d.accent}`,
                  background: 'rgba(19, 78, 74, 0.35)',
                  border: '1px solid rgba(20, 184, 166, 0.25)',
                  borderLeftWidth: '4px',
                  borderLeftColor: d.accent,
                  padding: '12px 14px',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: isThisLoading ? 'wait' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
                }}
              >
                <div 
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: d.bgGlow,
                    color: d.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Icon size={22} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontWeight: '800', fontSize: '15px', color: '#fff' }}>
                      {d.name}
                    </span>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: '800',
                      padding: '2px 7px',
                      borderRadius: '99px',
                      background: d.bgGlow,
                      color: d.accent,
                      border: `1px solid ${d.accent}40`
                    }}>
                      {d.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#99f6e4', marginBottom: '3px', fontWeight: '500' }}>
                    {d.meta}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.3 }}>
                    {d.description}
                  </div>
                </div>
                <ArrowRight size={16} color="#5eead4" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer / Server Settings */}
      <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid rgba(20, 184, 166, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#99f6e4' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: serverOnline === false ? '#ef4444' : '#10b981',
              display: 'inline-block'
            }}></span>
            <span>API: {apiBase.replace(/^https?:\/\//, '')}</span>
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#5eead4',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Settings size={13} />
            <span>Configure Backend</span>
          </button>
        </div>

        {showConfig && (
          <form onSubmit={handleSaveConfig} style={{ marginTop: '10px', background: 'rgba(4, 31, 30, 0.95)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(20, 184, 166, 0.3)' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#99f6e4', marginBottom: '6px' }}>
              Live Backend API URL (e.g. https://parentcare360-api.onrender.com or http://localhost:8000):
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://parentcare360-api.onrender.com"
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
                  fontWeight: '700',
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
