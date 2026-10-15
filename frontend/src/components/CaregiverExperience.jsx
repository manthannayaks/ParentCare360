import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  User, 
  CheckCircle2, 
  ClipboardCheck, 
  LogOut
} from 'lucide-react';
import MobileBottomNav from './MobileBottomNav';

export default function CaregiverExperience({
  caregiver,
  caregiversList = [],
  onSelectCaregiver,
  visits = [],
  onCheckinVisit,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState('visits'); // 'visits' | 'checkin' | 'profile'
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showCheckinModal, setShowCheckinModal] = useState(false);

  // Checkin Form State
  const [bpValue, setBpValue] = useState('124/80');
  const [sugarValue, setSugarValue] = useState('112 mg/dL');
  const [pulseValue] = useState('74 bpm');
  const [visitNotes, setVisitNotes] = useState('Morning vitals normal. Assisted with prescribed morning medications and light knee mobility exercises.');
  const [tasks, setTasks] = useState({
    vitals: true,
    medication: true,
    mobility: true,
    hydration: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionSuccess, setCompletionSuccess] = useState(false);

  const handleOpenCheckin = (visit) => {
    setSelectedVisit(visit);
    setShowCheckinModal(true);
  };

  const handleSubmitCheckin = async (e) => {
    e.preventDefault();
    if (!selectedVisit) return;
    setIsSubmitting(true);
    try {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const combinedNotes = `Vitals: BP ${bpValue}, Sugar ${sugarValue}, Pulse ${pulseValue}. Notes: ${visitNotes}`;
      await onCheckinVisit({
        visit_id: selectedVisit.id,
        caregiver_id: caregiver ? caregiver.id : 1,
        completion_datetime: nowStr,
        visit_notes: combinedNotes
      });
      setCompletionSuccess(true);
      setTimeout(() => {
        setCompletionSuccess(false);
        setShowCheckinModal(false);
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'visits', label: 'Visits Roster', icon: Calendar },
    { id: 'checkin', label: 'Check-in', icon: ClipboardCheck },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <div className="mobile-screen-container">
      {/* Top Header */}
      <header className="mobile-app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>
              {caregiver?.full_name || 'Priya Verma'}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {caregiver?.role || 'Registered Nurse'} • {caregiver?.city || 'Jodhpur'}
            </div>
          </div>
        </div>

        {/* Caregiver Switcher */}
        <select
          value={caregiver?.id || 1}
          onChange={(e) => onSelectCaregiver(Number(e.target.value))}
          style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#f472b6',
            fontSize: '11px',
            fontWeight: '700',
            padding: '6px 8px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {caregiversList.map((c) => (
            <option key={c.id} value={c.id}>
              🧑‍⚕️ {c.full_name} ({c.city})
            </option>
          ))}
        </select>
      </header>

      {/* Main Content Area */}
      <div className="mobile-content-area">
        {/* VISITS TAB */}
        {activeTab === 'visits' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Assigned Care Visits</h2>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Field roster for {caregiver?.full_name}</div>
            </div>

            {/* Visits List */}
            {visits.length === 0 ? (
              <div className="card-glass" style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
                <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px auto' }} />
                <div>No visits scheduled in your roster</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {visits.map((v) => (
                  <div key={v.id} className="card-glass" style={{ borderLeft: `4px solid ${v.status === 'Completed' ? '#10b981' : '#ec4899'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>
                          👴 {v.parent_name || 'Ravi Kumar'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <MapPin size={13} />
                          <span>{v.parent_address || '124, Shastri Nagar, Jodhpur'}</span>
                        </div>
                      </div>
                      <span className={`badge ${v.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                        {v.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '8px' }}>
                      🕒 <strong>Scheduled:</strong> {v.scheduled_datetime}
                    </div>

                    {v.visit_notes && (
                      <div style={{ fontSize: '12px', color: '#94a3b8', background: 'rgba(15, 23, 42, 0.4)', padding: '6px 10px', borderRadius: '6px', marginBottom: '10px' }}>
                        {v.visit_notes}
                      </div>
                    )}

                    {v.status !== 'Completed' ? (
                      <button
                        onClick={() => handleOpenCheckin(v)}
                        className="btn-primary"
                        style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #db2777, #ec4899)', fontSize: '13px' }}
                      >
                        <ClipboardCheck size={16} />
                        <span>Start Visit & Check-in Vitals</span>
                      </button>
                    ) : (
                      <div style={{ fontSize: '11px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
                        <CheckCircle2 size={14} />
                        <span>Completed at {v.actual_completion_datetime || 'Earlier today'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHECK-IN TAB */}
        {activeTab === 'checkin' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Caregiver Check-in Workflow</h2>
            <div className="card-glass">
              <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '12px' }}>
                Select an assigned patient from your roster above, record their vital statistics (Blood Pressure, Glucose, Pulse), and submit clinical observations.
              </div>
              <button
                onClick={() => {
                  if (visits.length > 0) {
                    handleOpenCheckin(visits[0]);
                  } else {
                    alert('No visits in roster');
                  }
                }}
                className="btn-primary"
                style={{ width: '100%', padding: '12px', background: '#db2777' }}
              >
                Open Quick Check-in Sheet
              </button>
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="card-glass" style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
                color: '#fff',
                fontSize: '26px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}>
                {caregiver ? caregiver.full_name[0] : 'C'}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>
                {caregiver ? caregiver.full_name : 'Priya Verma'}
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                {caregiver ? caregiver.role : 'Registered Nurse'} • {caregiver ? caregiver.city : 'Jodhpur'}
              </p>
            </div>

            <button
              onClick={onLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                borderRadius: '12px',
                padding: '12px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <LogOut size={16} />
              <span>Switch Role / Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* CHECK-IN BOTTOM SHEET MODAL */}
      {showCheckinModal && (
        <div className="modal-overlay">
          <div className="modal-sheet">
            <div className="sheet-handle"></div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>
              Visit Check-in: {selectedVisit?.parent_name || 'Ravi Kumar'}
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              Scheduled: {selectedVisit?.scheduled_datetime}
            </p>

            <form onSubmit={handleSubmitCheckin} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              {/* Care Task Checklist */}
              <div>
                <label className="input-label">Care Tasks Completed:</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { key: 'vitals', label: 'Vital signs checked (BP, SpO2, Pulse)' },
                    { key: 'medication', label: 'Morning medication administered' },
                    { key: 'mobility', label: 'Physical therapy & mobility assistance' },
                    { key: 'hydration', label: 'Meal & hydration monitoring' }
                  ].map((t) => (
                    <div
                      key={t.key}
                      onClick={() => setTasks({ ...tasks, [t.key]: !tasks[t.key] })}
                      className={`task-item ${tasks[t.key] ? '' : 'completed'}`}
                    >
                      <input
                        type="checkbox"
                        checked={tasks[t.key]}
                        readOnly
                        style={{ accentColor: '#ec4899', width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '13px', color: tasks[t.key] ? '#fff' : '#94a3b8' }}>
                        {t.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vitals Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">Blood Pressure:</label>
                  <input
                    type="text"
                    value={bpValue}
                    onChange={(e) => setBpValue(e.target.value)}
                    placeholder="120/80"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">Blood Sugar (mg/dL):</label>
                  <input
                    type="text"
                    value={sugarValue}
                    onChange={(e) => setSugarValue(e.target.value)}
                    placeholder="110 mg/dL"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Clinical Observations */}
              <div>
                <label className="input-label">Visit Notes & Observations:</label>
                <textarea
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="Record patient mood, mobility notes, or issues to flag for family..."
                  className="input-field"
                  rows={3}
                />
              </div>

              {completionSuccess && (
                <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderRadius: '8px', fontSize: '12px', fontWeight: '700', textAlign: 'center' }}>
                  ✓ Visit completed and logged to family timeline!
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #db2777, #ec4899)' }}
                >
                  {isSubmitting ? 'Submitting...' : 'Complete Visit & Submit'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCheckinModal(false)}
                  style={{ background: 'rgba(30, 41, 59, 0.8)', border: 'none', color: '#cbd5e1', borderRadius: '10px', padding: '12px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Sticky Tab Navigation */}
      <MobileBottomNav
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />
    </div>
  );
}
