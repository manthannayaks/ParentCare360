import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Calendar, Heart, Shield, Activity, PhoneCall, MapPin, ChevronRight } from 'lucide-react';

export default function FamilyMode({ 
  parent, 
  parentsList,
  onSelectParent,
  alerts, 
  appointments, 
  caregiverVisits, 
  requests, 
  timeline,
  onResolveAlert,
  onUpdateApptStatus
}) {
  const activeAlerts = alerts.filter(a => a.is_resolved === 0);
  const selectedParentId = parent ? parent.id : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px' }}>
      
      {/* Parent Selector Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Family Care Sponsor Dashboard</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Remote Elder Oversight & Real-Time Alert Engine</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {parentsList.map(p => (
            <button
              key={p.id}
              onClick={() => onSelectParent(p.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                border: '1px solid var(--border-subtle)',
                background: p.id === selectedParentId ? 'linear-gradient(135deg, #4f46e5, #3b82f6)' : 'rgba(30, 41, 59, 0.7)',
                color: p.id === selectedParentId ? '#fff' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {p.full_name} ({p.city})
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeft: '4px solid var(--rose)' }}>
          <div className="metric-icon-box" style={{ background: 'var(--rose-glow)', color: 'var(--rose)' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="metric-val">{activeAlerts.length}</div>
            <div className="metric-lbl">Active Alerts</div>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid var(--sky)' }}>
          <div className="metric-icon-box" style={{ background: 'rgba(14, 165, 233, 0.15)', color: 'var(--sky)' }}>
            <Calendar size={22} />
          </div>
          <div>
            <div className="metric-val">{appointments.length}</div>
            <div className="metric-lbl">Doctor Visits</div>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid var(--emerald)' }}>
          <div className="metric-icon-box" style={{ background: 'var(--emerald-glow)', color: 'var(--emerald)' }}>
            <Activity size={22} />
          </div>
          <div>
            <div className="metric-val">{caregiverVisits.length}</div>
            <div className="metric-lbl">Caregiver Visits</div>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid var(--amber)' }}>
          <div className="metric-icon-box" style={{ background: 'var(--amber-glow)', color: 'var(--amber)' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="metric-val">{requests.filter(r => r.status === 'Pending').length}</div>
            <div className="metric-lbl">Pending Requests</div>
          </div>
        </div>
      </div>

      {/* ACTIVE ALERTS FEED WITH RESOLVE BUTTON */}
      <div className="card-glass">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="var(--rose)" />
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Active Alert & Escalation Feed</h3>
          </div>
          <span className="badge badge-critical">{activeAlerts.length} Unresolved</span>
        </div>

        {activeAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
            ✓ All clear. No active risk alerts for this parent.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeAlerts.map(alert => (
              <div 
                key={alert.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className={`badge badge-${alert.severity.toLowerCase()}`}>{alert.severity}</span>
                    <span style={{ fontWeight: '700', fontSize: '14px' }}>{alert.alert_type}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{alert.created_at}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-main)', marginTop: '4px' }}>{alert.message}</p>
                </div>

                <button
                  onClick={() => onResolveAlert(alert.id)}
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  ✓ Resolve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HEALTH VITALS & OVERVIEW */}
      <div className="card-glass">
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Heart size={18} color="var(--rose)" />
          Parent Medical & Vitals Profile
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>BLOOD PRESSURE</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--emerald)', marginTop: '2px' }}>124 / 82 mmHg</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Normal • Checked yesterday</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>BLOOD GLUCOSE</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--sky)', marginTop: '2px' }}>110 mg/dL</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fasting • Stable</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>EMERGENCY CONTACT</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>{parent?.emergency_contact || '+91 98765 43210'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Primary Family Sponsor</div>
          </div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <strong>Clinical Diagnosis Notes:</strong> {parent?.medical_notes || 'Hypertension, Mild Arthritis, regular mobility exercise required.'}
        </div>
      </div>

      {/* APPOINTMENTS & CAREGIVER VISITS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        
        {/* Appointments */}
        <div className="card-glass">
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>Medical Appointments</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {appointments.map(appt => (
              <div key={appt.id} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px' }}>{appt.doctor_name}</div>
                  <span className={`badge badge-${appt.status === 'Completed' ? 'success' : 'info'}`}>{appt.status}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {appt.hospital_clinic} • {appt.appointment_date} at {appt.appointment_time}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Purpose: {appt.purpose}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Caregiver Visits */}
        <div className="card-glass">
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>Caregiver Visits</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {caregiverVisits.map(visit => (
              <div key={visit.id} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px' }}>{visit.caregiver_name || 'Caregiver Visit'}</div>
                  <span className={`badge badge-${visit.status === 'Completed' ? 'success' : 'warning'}`}>{visit.status}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Scheduled: {visit.scheduled_datetime}
                </div>
                {visit.visit_notes && (
                  <div style={{ fontSize: '11px', color: 'var(--emerald)', marginTop: '4px' }}>
                    Notes: {visit.visit_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* CHRONOLOGICAL CARE TIMELINE */}
      <div className="card-glass">
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>Unified Chronological Care Timeline</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {timeline.slice(0, 8).map((evt, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--indigo)', marginTop: '6px' }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '700' }}>{evt.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{evt.description}</div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{evt.timestamp}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
