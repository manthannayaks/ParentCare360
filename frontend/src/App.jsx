import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Monitor, 
  RefreshCw, 
  AlertOctagon, 
  LogOut
} from 'lucide-react';

import RoleAuthScreen from './components/RoleAuthScreen';
import ParentExperience from './components/ParentExperience';
import FamilyExperience from './components/FamilyExperience';
import CaregiverExperience from './components/CaregiverExperience';
import DoctorExperience from './components/DoctorExperience';
import OpsDagMode from './components/OpsDagMode';

const getInitialApiBase = () => {
  const stored = localStorage.getItem('parentcare360_api_base');
  if (stored) return stored;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    return `http://${window.location.hostname}:8000`;
  }
  return 'http://localhost:8000';
};

export default function App() {
  const [apiBase, setApiBase] = useState(getInitialApiBase);
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('parentcare360_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [viewMode, setViewMode] = useState('phone'); // 'phone' | 'desktop'
  const [selectedParentId, setSelectedParentId] = useState(1);

  // Application Data States
  const [parents, setParents] = useState([]);
  const [currentParentDetail, setCurrentParentDetail] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [caregivers, setCaregivers] = useState([]);
  const [caregiverVisits, setCaregiverVisits] = useState([]);
  const [requests, setRequests] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [parentLocation, setParentLocation] = useState(null);
  const [locationFreshness, setLocationFreshness] = useState('unavailable');
  const [travelJourneys, setTravelJourneys] = useState([]);
  const [quarantineRecords, setQuarantineRecords] = useState([]);
  const [lastPipelineResult, setLastPipelineResult] = useState(null);
  const [doctorDashboard, setDoctorDashboard] = useState(null);
  const [doctorsList, setDoctorsList] = useState([]);

  const handleUpdateApiBase = (newUrl) => {
    const cleanUrl = newUrl.replace(/\/+$/, '');
    setApiBase(cleanUrl);
    localStorage.setItem('parentcare360_api_base', cleanUrl);
  };

  const handleSelectRole = (role, id, name, fullUserData = null) => {
    const user = fullUserData || { role, id, name };
    setCurrentUser(user);
    localStorage.setItem('parentcare360_current_user', JSON.stringify(user));
    if (role === 'elder' || role === 'parent') {
      setSelectedParentId(user.id || id);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('parentcare360_current_user');
  };

  // Fetch all system data
  const fetchData = async () => {
    try {
      const [pRes, aRes, cRes, rRes, alRes, qRes, docsRes, locRes, travRes, docsListRes] = await Promise.all([
        fetch(`${apiBase}/api/parents`).then(r => r.json()).catch(() => []),
        fetch(`${apiBase}/api/appointments?parent_id=${selectedParentId}`).then(r => r.json()).catch(() => []),
        fetch(`${apiBase}/api/caregivers`).then(r => r.json()).catch(() => []),
        fetch(`${apiBase}/api/requests?parent_id=${selectedParentId}`).then(r => r.json()).catch(() => []),
        fetch(`${apiBase}/api/alerts`).then(r => r.json()).catch(() => []),
        fetch(`${apiBase}/api/pipeline/quarantine`).then(r => r.json()).catch(() => []),
        fetch(`${apiBase}/api/parents/${selectedParentId}/documents`).then(r => r.json()).catch(() => []),
        fetch(`${apiBase}/api/parents/${selectedParentId}/location`).then(r => r.json()).catch(() => null),
        fetch(`${apiBase}/api/travel?parent_id=${selectedParentId}`).then(r => r.json()).catch(() => []),
        fetch(`${apiBase}/api/doctors`).then(r => r.json()).catch(() => [])
      ]);

      setParents(pRes || []);
      setAppointments(aRes || []);
      setCaregivers(cRes || []);
      setRequests(rRes || []);
      setAlerts(alRes || []);
      setQuarantineRecords(qRes || []);
      setDocuments(docsRes || []);
      setTravelJourneys(travRes || []);
      setDoctorsList(docsListRes || []);

      if (locRes && locRes.location) {
        setParentLocation(locRes.location);
        setLocationFreshness(locRes.freshness || 'recent');
      } else {
        setParentLocation(null);
        setLocationFreshness('unavailable');
      }

      // Fetch detail for selected parent
      const detail = await fetch(`${apiBase}/api/parents/${selectedParentId}`).then(r => r.json()).catch(() => null);
      if (detail) {
        setCurrentParentDetail(detail.parent);
        setCaregiverVisits(detail.caregiver_visits || []);
      }

      // Fetch timeline
      const tRes = await fetch(`${apiBase}/api/parents/${selectedParentId}/timeline`).then(r => r.json()).catch(() => []);
      setTimeline(tRes || []);

      // If doctor view, fetch doctor dashboard
      if (currentUser?.role === 'doctor') {
        const docDash = await fetch(`${apiBase}/api/doctors/${currentUser.id || 1}/dashboard`).then(r => r.json()).catch(() => null);
        if (docDash) {
          setDoctorDashboard(docDash);
        }
      }

    } catch (err) {
      console.warn("API Offline or connection issue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // 10s poll interval (conservative for mobile)
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [selectedParentId, apiBase, currentUser?.role]);

  // WebSocket for Real-Time Alerts & Location Updates
  useEffect(() => {
    let ws = null;
    try {
      const wsUrl = apiBase.replace(/^http/, 'ws') + '/ws/alerts';
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'NEW_ALERTS_GENERATED' || data.event === 'LOCATION_SHARED' || data.event === 'EDGE_CASE_TRIGGERED') {
            fetchData();
          }
        } catch (e) {}
      };
    } catch (e) {}
    return () => {
      if (ws) ws.close();
    };
  }, [apiBase]);

  // Action Handlers
  const handleResolveAlert = async (alertId) => {
    await fetch(`${apiBase}/api/alerts/${alertId}/resolve`, { method: 'PATCH' });
    fetchData();
  };

  const handleTriggerSOS = async (parentId) => {
    await fetch(`${apiBase}/api/pipeline/simulate-edge-case`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edge_case_type: 'inactivity', parent_id: parentId })
    });
    fetchData();
  };

  const handleSendVoiceRequest = async (parentId, text) => {
    const res = await fetch(`${apiBase}/api/requests/voice-transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parent_id: parentId, speech_text: text })
    });
    const data = await res.json();
    fetchData();
    return data;
  };

  const handleHeartbeat = async (parentId) => {
    await fetch(`${apiBase}/api/parents/${parentId}/heartbeat`, { method: 'POST' });
    fetchData();
  };

  const handleShareLocation = async (parentId, locationData) => {
    const res = await fetch(`${apiBase}/api/parents/${parentId}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(locationData)
    });
    const data = await res.json();
    fetchData();
    return data;
  };

  const handleCheckinVisit = async (payload) => {
    const res = await fetch(`${apiBase}/api/caregivers/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    fetchData();
    return res.json();
  };

  const handleCreateRequest = async (payload) => {
    const res = await fetch(`${apiBase}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    fetchData();
    return res.json();
  };

  const handleUpdateRequestStatus = async (reqId, newStatus, assignedTo = 'Amit Kumar') => {
    const res = await fetch(`${apiBase}/api/requests/${reqId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, assigned_to: assignedTo })
    });
    fetchData();
    return res.json();
  };

  const handleCoordinateTravel = async (journeyId, newStatus) => {
    const res = await fetch(`${apiBase}/api/travel/${journeyId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    fetchData();
    return res.json();
  };

  const handleCreateAppointment = async (apptData) => {
    const res = await fetch(`${apiBase}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apptData)
    });
    fetchData();
    return res.json();
  };

  const handleCreateDocument = async (docData) => {
    const res = await fetch(`${apiBase}/api/parents/${docData.parent_id}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docData)
    });
    fetchData();
    return res.json();
  };

  const handleUpdateDoctorNotes = async (apptId, doctorNotes, status) => {
    const res = await fetch(`${apiBase}/api/appointments/${apptId}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctor_notes: doctorNotes, status })
    });
    fetchData();
    return res.json();
  };

  const handleRunPipeline = async () => {
    const res = await fetch(`${apiBase}/api/pipeline/trigger`, { method: 'POST' });
    const data = await res.json();
    setLastPipelineResult(data);
    fetchData();
    return data;
  };

  const handleSimulateEdgeCase = async (edgeCaseType) => {
    const res = await fetch(`${apiBase}/api/pipeline/simulate-edge-case`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edge_case_type: edgeCaseType, parent_id: selectedParentId })
    });
    const data = await res.json();
    fetchData();
    return data;
  };

  const criticalAlerts = alerts.filter(a => a.is_resolved === 0 && (a.severity === 'Critical' || a.severity === 'Emergency'));

  // If user is not logged in, render the Role Authentication Screen
  if (!currentUser) {
    return (
      <div className="app-viewport">
        <main className="main-stage">
          <div className="mobile-frame-wrapper">
            <div className="mobile-phone-frame">
              <RoleAuthScreen
                onSelectRole={handleSelectRole}
                apiBase={apiBase}
                onUpdateApiBase={handleUpdateApiBase}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-viewport">
      {/* GLOBAL TOP NAVIGATION & CONTROL BAR */}
      <header className="top-control-bar">
        {/* Brand */}
        <div className="brand-section">
          <div className="brand-logo">P</div>
          <div>
            <div className="brand-title">ParentCare360</div>
            <div className="brand-subtitle">Remote Elder Coordination Platform</div>
          </div>
        </div>

        {/* Current Active Persona & Switcher Pills */}
        <div className="persona-pills">
          <button 
            className={`persona-btn ${currentUser.role === 'elder' ? 'active' : ''}`}
            onClick={() => handleSelectRole('elder', 1, 'Ravi Kumar')}
          >
            👴 Parent
          </button>
          <button 
            className={`persona-btn ${currentUser.role === 'family' ? 'active' : ''}`}
            onClick={() => handleSelectRole('family', 1, 'Amit Kumar')}
          >
            👨‍👩‍👧 Family
          </button>
          <button 
            className={`persona-btn ${currentUser.role === 'caregiver' ? 'active' : ''}`}
            onClick={() => handleSelectRole('caregiver', 1, 'Priya Verma')}
          >
            🧑‍⚕️ Caregiver
          </button>
          <button 
            className={`persona-btn ${currentUser.role === 'doctor' ? 'active' : ''}`}
            onClick={() => handleSelectRole('doctor', 1, 'Dr. A. K. Sharma')}
          >
            🩺 Doctor
          </button>
          <button 
            className={`persona-btn ${currentUser.role === 'ops' ? 'active' : ''}`}
            onClick={() => handleSelectRole('ops', 0, 'DAG Admin')}
          >
            ⚙️ DAG Ops
          </button>
        </div>

        {/* View Mode Toggle: Phone Mockup Frame vs Desktop Wide */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="view-toggle-btn"
            onClick={() => setViewMode(viewMode === 'phone' ? 'desktop' : 'phone')}
            title="Toggle between Mobile Phone Mockup and Full Desktop View"
          >
            {viewMode === 'phone' ? <Monitor size={15} /> : <Smartphone size={15} />}
            <span>{viewMode === 'phone' ? 'Expand' : 'Phone'}</span>
          </button>

          <button onClick={fetchData} className="view-toggle-btn" title="Refresh Live Data">
            <RefreshCw size={15} />
          </button>

          <button
            onClick={handleLogout}
            className="view-toggle-btn"
            style={{ color: '#f87171' }}
            title="Sign Out to Role Selection"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* TOP CRITICAL EMERGENCY BANNER IF ACTIVE */}
      {criticalAlerts.length > 0 && (
        <div style={{ background: 'linear-gradient(90deg, #991b1b, #dc2626)', color: '#fff', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertOctagon size={18} />
            <span>CRITICAL RISK ALERT: {criticalAlerts[0].alert_type} — {criticalAlerts[0].message}</span>
          </div>
          <button 
            onClick={() => handleResolveAlert(criticalAlerts[0].id)}
            style={{ background: '#fff', color: '#dc2626', border: 'none', padding: '4px 12px', borderRadius: '6px', fontWeight: '800', cursor: 'pointer', fontSize: '12px' }}
          >
            Acknowledge & Resolve
          </button>
        </div>
      )}

      {/* MAIN VIEWPORT STAGE */}
      <main className="main-stage">
        {viewMode === 'phone' ? (
          /* Phone Frame Mode (APK Simulation) */
          <div className="mobile-frame-wrapper">
            <div className="mobile-phone-frame">
              {/* Speaker Notch */}
              <div className="phone-speaker-notch">
                <div className="camera-dot"></div>
              </div>

              {/* Persona Content */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {(currentUser.role === 'elder' || currentUser.role === 'parent') && (
                  <ParentExperience
                    parent={currentParentDetail}
                    currentUser={currentUser}
                    apiBase={apiBase}
                    onTriggerSOS={handleTriggerSOS}
                    onSendVoiceRequest={handleSendVoiceRequest}
                    onHeartbeat={handleHeartbeat}
                    onShareLocation={handleShareLocation}
                    appointments={appointments}
                    caregiverVisits={caregiverVisits}
                    documents={documents}
                    onLogout={handleLogout}
                  />
                )}

                {(currentUser.role === 'family' || currentUser.role === 'child') && (
                  <FamilyExperience
                    familyUser={currentUser}
                    parent={currentParentDetail}
                    parentsList={parents}
                    apiBase={apiBase}
                    onSelectParent={setSelectedParentId}
                    alerts={alerts}
                    appointments={appointments}
                    caregiverVisits={caregiverVisits}
                    requests={requests}
                    timeline={timeline}
                    documents={documents}
                    parentLocation={parentLocation}
                    locationFreshness={locationFreshness}
                    travelJourneys={travelJourneys}
                    onResolveAlert={handleResolveAlert}
                    onCreateRequest={handleCreateRequest}
                    onUpdateRequestStatus={handleUpdateRequestStatus}
                    onCoordinateTravel={handleCoordinateTravel}
                    onCreateAppointment={handleCreateAppointment}
                    onCreateDocument={handleCreateDocument}
                    onLogout={handleLogout}
                  />
                )}

                {currentUser.role === 'caregiver' && (
                  <CaregiverExperience
                    caregiver={caregivers.find(c => c.id === currentUser.id) || caregivers[0]}
                    caregiversList={caregivers}
                    onSelectCaregiver={(id) => handleSelectRole('caregiver', id, caregivers.find(c => c.id === id)?.full_name || 'Caregiver')}
                    visits={caregiverVisits}
                    onCheckinVisit={handleCheckinVisit}
                    onLogout={handleLogout}
                  />
                )}

                {currentUser.role === 'doctor' && (
                  <DoctorExperience
                    doctor={doctorDashboard?.doctor || doctorsList.find(d => d.id === currentUser.id) || doctorsList[0]}
                    doctorsList={doctorsList}
                    onSelectDoctor={(id) => handleSelectRole('doctor', id, doctorsList.find(d => d.id === id)?.full_name || 'Doctor')}
                    appointments={doctorDashboard?.appointments || appointments}
                    patients={doctorDashboard?.patients || parents}
                    documents={doctorDashboard?.documents || documents}
                    onUpdateDoctorNotes={handleUpdateDoctorNotes}
                    onLogout={handleLogout}
                  />
                )}

                {currentUser.role === 'ops' && (
                  <OpsDagMode
                    onRunPipeline={handleRunPipeline}
                    onSimulateEdgeCase={handleSimulateEdgeCase}
                    quarantineRecords={quarantineRecords}
                    lastPipelineResult={lastPipelineResult}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Desktop Wide Mode */
          <div className="desktop-view-container">
            {(currentUser.role === 'elder' || currentUser.role === 'parent') && (
              <ParentExperience
                parent={currentParentDetail}
                currentUser={currentUser}
                apiBase={apiBase}
                onTriggerSOS={handleTriggerSOS}
                onSendVoiceRequest={handleSendVoiceRequest}
                onHeartbeat={handleHeartbeat}
                onShareLocation={handleShareLocation}
                appointments={appointments}
                caregiverVisits={caregiverVisits}
                documents={documents}
                onLogout={handleLogout}
              />
            )}

            {(currentUser.role === 'family' || currentUser.role === 'child') && (
              <FamilyExperience
                familyUser={currentUser}
                parent={currentParentDetail}
                parentsList={parents}
                apiBase={apiBase}
                onSelectParent={setSelectedParentId}
                alerts={alerts}
                appointments={appointments}
                caregiverVisits={caregiverVisits}
                requests={requests}
                timeline={timeline}
                documents={documents}
                parentLocation={parentLocation}
                locationFreshness={locationFreshness}
                travelJourneys={travelJourneys}
                onResolveAlert={handleResolveAlert}
                onCreateRequest={handleCreateRequest}
                onUpdateRequestStatus={handleUpdateRequestStatus}
                onCoordinateTravel={handleCoordinateTravel}
                onCreateAppointment={handleCreateAppointment}
                onCreateDocument={handleCreateDocument}
                onLogout={handleLogout}
              />
            )}

            {currentUser.role === 'caregiver' && (
              <CaregiverExperience
                caregiver={caregivers.find(c => c.id === currentUser.id) || caregivers[0]}
                caregiversList={caregivers}
                onSelectCaregiver={(id) => handleSelectRole('caregiver', id, caregivers.find(c => c.id === id)?.full_name || 'Caregiver')}
                visits={caregiverVisits}
                onCheckinVisit={handleCheckinVisit}
                onLogout={handleLogout}
              />
            )}

            {currentUser.role === 'doctor' && (
              <DoctorExperience
                doctor={doctorDashboard?.doctor || doctorsList.find(d => d.id === currentUser.id) || doctorsList[0]}
                doctorsList={doctorsList}
                onSelectDoctor={(id) => handleSelectRole('doctor', id, doctorsList.find(d => d.id === id)?.full_name || 'Doctor')}
                appointments={doctorDashboard?.appointments || appointments}
                patients={doctorDashboard?.patients || parents}
                documents={doctorDashboard?.documents || documents}
                onUpdateDoctorNotes={handleUpdateDoctorNotes}
                onLogout={handleLogout}
              />
            )}

            {currentUser.role === 'ops' && (
              <OpsDagMode
                onRunPipeline={handleRunPipeline}
                onSimulateEdgeCase={handleSimulateEdgeCase}
                quarantineRecords={quarantineRecords}
                lastPipelineResult={lastPipelineResult}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
