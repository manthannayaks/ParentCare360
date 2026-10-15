import React, { useState } from 'react';
import { UserCheck, Clock, MapPin, CheckSquare, Shield, FileText } from 'lucide-react';

export default function CaregiverMode({ caregivers, onCheckinVisit }) {
  const [selectedCaregiverId, setSelectedCaregiverId] = useState(1);
  const [selectedVisitId, setSelectedVisitId] = useState(1);
  const [notes, setNotes] = useState('Vitals measured: BP 122/80 mmHg, Pulse 74 bpm. Morning medication administered. Elder in good spirits.');
  const [statusMsg, setStatusMsg] = useState('');

  const currentCaregiver = caregivers.find(c => c.id === selectedCaregiverId) || caregivers[0] || {
    id: 1, full_name: "Priya Verma", role: "Registered Nurse", city: "Jodhpur"
  };

  const handleComplete = (e) => {
    e.preventDefault();
    setStatusMsg('Submitting check-in...');
    onCheckinVisit({
      visit_id: selectedVisitId,
      caregiver_id: currentCaregiver.id,
      completion_datetime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      visit_notes: notes
    }).then(() => {
      setStatusMsg('✓ Visit completed & recorded atomically!');
      setTimeout(() => setStatusMsg(''), 4000);
    }).catch(() => setStatusMsg('Error completing visit'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px' }}>
      
      {/* Header & RBAC Persona Indicator */}
      <div className="card-glass" style={{ borderLeft: '4px solid var(--emerald)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-success">RBAC Enforced</span>
              <span className="badge badge-info">ABAC Shift Restricted</span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginTop: '6px' }}>Caregiver Field Portal</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Logged in as: <strong>{currentCaregiver.full_name}</strong> ({currentCaregiver.role}) • {currentCaregiver.city}
            </p>
          </div>

          {/* Switch Caregiver Persona for testing */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {caregivers.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCaregiverId(c.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: c.id === currentCaregiver.id ? 'var(--emerald)' : 'rgba(15, 23, 42, 0.6)',
                  color: c.id === currentCaregiver.id ? '#0f172a' : 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {c.full_name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PRIVACY BOUNDARY NOTICE */}
      <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '12px', padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Shield size={22} color="var(--sky)" />
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text-main)' }}>Privacy Boundary Active:</strong> You are granted access only to elders assigned to your active roster. Private family finances and non-essential diagnosis records are masked.
        </div>
      </div>

      {/* TODAY'S ASSIGNED SHIFT ROSTER */}
      <div className="card-glass">
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="var(--emerald)" />
          Assigned Visit for Today (Ravi Kumar)
        </h3>

        <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '17px', fontWeight: '800' }}>Ravi Kumar (Age 72)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <MapPin size={14} color="var(--rose)" />
                124, Shastri Nagar, Jodhpur
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                Emergency Phone: <strong>+91 98765 43210 (Amit - Son)</strong>
              </div>
            </div>
            <span className="badge badge-warning">Shift Active</span>
          </div>

          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
            <h4 style={{ fontSize: '13px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>Operational Care Checklist</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked />
                Measure blood pressure & pulse rate
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked />
                Supervise morning hypertension medication
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked />
                Assess joint mobility & hydration level
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* CHECK-IN & VISIT LOG SUBMISSION */}
      <div className="card-glass">
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="var(--indigo)" />
          Complete Visit & Submit Clinical Notes
        </h3>

        <form onSubmit={handleComplete} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
              Clinical Observation Notes:
            </label>
            <textarea
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '10px',
                color: 'var(--text-main)',
                fontSize: '13px',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #059669, #10b981)', padding: '12px' }}>
            <UserCheck size={18} />
            Submit Visit Check-in & Update Timeline
          </button>

          {statusMsg && (
            <div style={{ fontSize: '13px', fontWeight: '700', color: statusMsg.includes('✓') ? '#34d399' : '#f87171', textAlign: 'center' }}>
              {statusMsg}
            </div>
          )}
        </form>
      </div>

    </div>
  );
}
