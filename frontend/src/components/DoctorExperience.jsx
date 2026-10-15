import React, { useState } from 'react';
import { 
  Stethoscope, 
  Calendar, 
  Users, 
  FileText, 
  CheckCircle2, 
  User, 
  Edit3, 
  LogOut
} from 'lucide-react';
import MobileBottomNav from './MobileBottomNav';

export default function DoctorExperience({
  doctor,
  doctorsList = [],
  onSelectDoctor,
  appointments = [],
  patients = [],
  documents = [],
  onUpdateDoctorNotes,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState('appts'); // 'appts' | 'patients' | 'docs' | 'profile'
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(false);

  // Doctor Notes Form State
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [apptStatus, setApptStatus] = useState('Completed');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const handleOpenConsultation = (appt) => {
    setSelectedAppt(appt);
    setClinicalNotes(appt.doctor_notes || '');
    setApptStatus(appt.status || 'Completed');
    setShowNotesModal(true);
  };

  const handleSaveNotes = async (e) => {
    e.preventDefault();
    if (!selectedAppt) return;
    setIsSubmitting(true);
    try {
      await onUpdateDoctorNotes(selectedAppt.id, clinicalNotes, apptStatus);
      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
        setShowNotesModal(false);
      }, 1400);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'appts', label: 'Consults', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'docs', label: 'Reports', icon: FileText },
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
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Stethoscope size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>
              {doctor?.full_name || 'Dr. A. K. Sharma'}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {doctor?.specialty || 'Cardiologist'} • {doctor?.hospital_clinic || 'AIIMS Jodhpur'}
            </div>
          </div>
        </div>

        {/* Doctor Switcher */}
        <select
          value={doctor?.id || 1}
          onChange={(e) => onSelectDoctor(Number(e.target.value))}
          style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#fbbf24',
            fontSize: '11px',
            fontWeight: '700',
            padding: '6px 8px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {doctorsList.map((d) => (
            <option key={d.id} value={d.id}>
              🩺 {d.full_name} ({d.specialty.split(' ')[0]})
            </option>
          ))}
        </select>
      </header>

      {/* Main Content Area */}
      <div className="mobile-content-area">
        {/* APPOINTMENTS TAB */}
        {activeTab === 'appts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Patient Consultations</h2>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Clinical schedule for {doctor?.full_name}</div>
            </div>

            {appointments.length === 0 ? (
              <div className="card-glass" style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
                <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px auto' }} />
                <div>No appointments scheduled</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {appointments.map((a) => (
                  <div key={a.id} className="card-glass" style={{ borderLeft: `4px solid ${a.status === 'Completed' ? '#10b981' : '#f59e0b'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>
                        👴 {a.parent_name || 'Ravi Kumar'} ({a.age ? `${a.age}y` : '72y'}, {a.gender || 'Male'})
                      </span>
                      <span className={`badge ${a.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                        {a.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                      📅 {a.appointment_date} at {a.appointment_time} • {a.hospital_clinic}
                    </div>

                    <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '8px' }}>
                      <strong>Chief Complaint:</strong> {a.purpose}
                    </div>

                    {a.medical_notes && (
                      <div style={{ fontSize: '11px', color: '#94a3b8', background: 'rgba(15, 23, 42, 0.4)', padding: '6px 10px', borderRadius: '6px', marginBottom: '10px' }}>
                        <strong>Patient History:</strong> {a.medical_notes}
                      </div>
                    )}

                    {a.doctor_notes && (
                      <div style={{ fontSize: '12px', color: '#fef08a', background: 'rgba(245, 158, 11, 0.1)', padding: '8px 10px', borderRadius: '8px', marginBottom: '10px' }}>
                        <strong>Consultation Advice:</strong> {a.doctor_notes}
                      </div>
                    )}

                    <button
                      onClick={() => handleOpenConsultation(a)}
                      className="btn-primary"
                      style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #d97706, #f59e0b)', fontSize: '13px' }}
                    >
                      <Edit3 size={15} />
                      <span>{a.doctor_notes ? 'Update Clinical Notes' : 'Record Consultation Notes'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PATIENTS TAB */}
        {activeTab === 'patients' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Linked Elder Patients</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {patients.map((p) => (
                <div key={p.id} className="card-glass" style={{ borderLeft: '4px solid #0d9488' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>{p.full_name}</span>
                    <span className="badge badge-info">{p.city}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                    Age {p.age} • {p.gender} • Emergency Contact: {p.emergency_contact}
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', background: 'rgba(15, 23, 42, 0.5)', padding: '8px', borderRadius: '8px' }}>
                    <strong>Known Conditions:</strong> {p.medical_notes || 'Hypertension, Mild Arthritis'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'docs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Patient Clinical Reports & Rx</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {documents.map((d) => (
                <div key={d.id} className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px' }}>
                  <FileText size={22} color="#fbbf24" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{d.title}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {d.category} • Uploaded {d.created_at} by {d.uploaded_by}
                    </div>
                    {d.notes && <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>{d.notes}</div>}
                  </div>
                </div>
              ))}
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
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff',
                fontSize: '26px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}>
                {doctor ? doctor.full_name[0] : 'D'}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>
                {doctor ? doctor.full_name : 'Dr. A. K. Sharma'}
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                {doctor ? doctor.specialty : 'Cardiologist'} • {doctor ? doctor.hospital_clinic : 'AIIMS Jodhpur'}
              </p>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                {doctor?.phone} • {doctor?.email}
              </div>
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

      {/* DOCTOR CONSULTATION NOTES MODAL */}
      {showNotesModal && (
        <div className="modal-overlay">
          <div className="modal-sheet">
            <div className="sheet-handle"></div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>
              Consultation Notes: {selectedAppt?.parent_name || 'Ravi Kumar'}
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              {selectedAppt?.appointment_date} at {selectedAppt?.appointment_time} • {selectedAppt?.purpose}
            </p>

            <form onSubmit={handleSaveNotes} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              <div>
                <label className="input-label">Clinical Observations & Prescription:</label>
                <textarea
                  required
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Record blood pressure, medication adjustments, lifestyle advice, or next review timeframe..."
                  className="input-field"
                  rows={4}
                />
              </div>

              <div>
                <label className="input-label">Appointment Status:</label>
                <select
                  value={apptStatus}
                  onChange={(e) => setApptStatus(e.target.value)}
                  className="input-field"
                >
                  <option value="Completed">Completed</option>
                  <option value="Follow-up Required">Follow-up Required in 3 Months</option>
                  <option value="Upcoming">Keep Upcoming</option>
                </select>
              </div>

              {updateSuccess && (
                <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderRadius: '8px', fontSize: '12px', fontWeight: '700', textAlign: 'center' }}>
                  ✓ Clinical notes updated and shared with family!
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}
                >
                  {isSubmitting ? 'Saving...' : 'Save & Sign Notes'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNotesModal(false)}
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
