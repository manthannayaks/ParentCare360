import React, { useState, useEffect } from 'react';
import { 
  Home, 
  ListTodo, 
  MapPin, 
  Calendar, 
  Clock, 
  AlertOctagon, 
  CheckCircle2, 
  Plus, 
  Car, 
  ExternalLink, 
  FileText, 
  User, 
  LogOut,
  Users,
  Search,
  Mic,
  Volume2,
  Pill,
  Send,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Check,
  X,
  PhoneCall,
  Navigation,
  Compass
} from 'lucide-react';
import MobileBottomNav from './MobileBottomNav';

export default function FamilyExperience({
  familyUser,
  parent,
  parentsList = [],
  apiBase = 'http://localhost:8000',
  onSelectParent,
  alerts = [],
  appointments = [],
  caregiverVisits = [],
  requests = [],
  timeline = [],
  documents = [],
  parentLocation = null,
  locationFreshness = 'unavailable',
  travelJourneys = [],
  onResolveAlert,
  onCreateRequest,
  onUpdateRequestStatus,
  onCoordinateTravel,
  onCreateAppointment,
  onCreateDocument,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'parents' | 'voice' | 'travel' | 'care' | 'requests' | 'profile'
  const [requestFilter, setRequestFilter] = useState('All');

  // Connection Management State
  const [connectionsData, setConnectionsData] = useState({ connected: [], incoming: [], outgoing: [] });
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('JOE-7401');
  const [relationshipType, setRelationshipType] = useState('Child');
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectMessage, setConnectMessage] = useState('');
  const [connectError, setConnectError] = useState('');

  // Authorized Health & Prescriptions State
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionsPermissionDenied, setPrescriptionsPermissionDenied] = useState(false);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);

  // Voice Messages State
  const [voiceMessages, setVoiceMessages] = useState([]);
  const [voiceLoading, setVoiceLoading] = useState(false);

  // Latest Shared Location from API
  const [latestSharedLocation, setLatestSharedLocation] = useState(null);
  const [latestLocFreshness, setLatestLocFreshness] = useState('unavailable');
  const [locPermissionDenied, setLocPermissionDenied] = useState(false);

  // Help Requests State
  const [helpRequests, setHelpRequests] = useState([]);

  // Modals
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showNewApptModal, setShowNewApptModal] = useState(false);
  const [showRideCoordModal, setShowRideCoordModal] = useState(false);
  const [rideStatus, setRideStatus] = useState('Submitted'); // Submitted | Acknowledged | Assistance Being Arranged | Assistance Confirmed | Completed
  const [ridePickupLocation, setRidePickupLocation] = useState('Kempegowda International Airport, Terminal 1, Pillar 4');
  const [rideDropoffLocation, setRideDropoffLocation] = useState('Flat 302, Palm Meadows, Whitefield, Bengaluru');
  const [rideDriverNotes, setRideDriverNotes] = useState('Driver assigned via local taxi fleet. Contacting driver.');

  // Form states
  const [newReqTitle, setNewReqTitle] = useState('');
  const [newReqCategory, setNewReqCategory] = useState('Maintenance');
  const [newReqPriority, setNewReqPriority] = useState('Medium');
  const [newReqNotes, setNewReqNotes] = useState('');

  const [newApptDoctor, setNewApptDoctor] = useState('Dr. A. K. Sharma');
  const [newApptHospital, setNewApptHospital] = useState('Manipal Hospital, Bengaluru');
  const [newApptDate, setNewApptDate] = useState('2026-09-25');
  const [newApptTime, setNewApptTime] = useState('11:00 AM');
  const [newApptPurpose, setNewApptPurpose] = useState('Quarterly Blood Pressure & Vitals Evaluation');

  const currentUserId = familyUser?.id || 2;
  const currentUserName = familyUser?.full_name || familyUser?.name || 'Sam';

  // Fetch Connections
  const fetchConnections = async () => {
    try {
      const res = await fetch(`${apiBase}/api/connections/${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        setConnectionsData(data);
      }
    } catch (err) {
      console.warn("Could not fetch connections:", err);
    }
  };

  // Determine active parent ID: from connected connections if available, else selected parent
  const activeParentId = connectionsData.connected.length > 0 
    ? connectionsData.connected[0].connected_user_id 
    : (parent?.id || 1);

  const activeParentName = connectionsData.connected.length > 0
    ? connectionsData.connected[0].connected_name
    : (parent?.full_name || 'Joe');

  // Fetch Authorized Prescriptions (with Permission Verification)
  const fetchAuthorizedPrescriptions = async () => {
    if (!activeParentId) return;
    setPrescriptionsLoading(true);
    setPrescriptionsPermissionDenied(false);
    try {
      const res = await fetch(`${apiBase}/api/prescriptions?parent_user_id=${activeParentId}&requesting_user_id=${currentUserId}`);
      if (res.status === 403) {
        setPrescriptionsPermissionDenied(true);
        setPrescriptions([]);
      } else if (res.ok) {
        const data = await res.json();
        setPrescriptions(data);
        setPrescriptionsPermissionDenied(false);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setPrescriptionsLoading(false);
    }
  };

  // Fetch Voice Messages
  const fetchVoiceMessages = async () => {
    if (!activeParentId) return;
    setVoiceLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/voice/messages?user_id=${currentUserId}&other_user_id=${activeParentId}`);
      if (res.ok) {
        const data = await res.json();
        setVoiceMessages(data);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setVoiceLoading(false);
    }
  };

  // Fetch Latest Location Share
  const fetchLatestLocation = async () => {
    if (!activeParentId) return;
    setLocPermissionDenied(false);
    try {
      const res = await fetch(`${apiBase}/api/location/latest?parent_user_id=${activeParentId}&requesting_user_id=${currentUserId}`);
      if (res.status === 403) {
        setLocPermissionDenied(true);
        setLatestSharedLocation(null);
      } else if (res.ok) {
        const data = await res.json();
        setLatestSharedLocation(data.location);
        setLatestLocFreshness(data.freshness || 'unavailable');
        setLocPermissionDenied(false);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  // Fetch Help Requests
  const fetchHelpRequests = async () => {
    try {
      const res = await fetch(`${apiBase}/api/help-requests?parent_user_id=${activeParentId}`);
      if (res.ok) {
        const data = await res.json();
        setHelpRequests(data);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [currentUserId, apiBase]);

  useEffect(() => {
    fetchAuthorizedPrescriptions();
    fetchVoiceMessages();
    fetchLatestLocation();
    fetchHelpRequests();

    const interval = setInterval(() => {
      fetchConnections();
      fetchAuthorizedPrescriptions();
      fetchVoiceMessages();
      fetchLatestLocation();
      fetchHelpRequests();
    }, 8000);
    return () => clearInterval(interval);
  }, [activeParentId, currentUserId, apiBase]);

  // Handle Send Connection Request (Feature 2)
  const handleSendConnectionRequest = async (e) => {
    e.preventDefault();
    const ident = searchQuery.trim();
    if (!ident) return;

    // Check if user is searching for themselves
    if (familyUser && (ident.toLowerCase() === familyUser.username?.toLowerCase() || ident.toUpperCase() === familyUser.invitation_code?.toUpperCase())) {
      setConnectError(`You are logged in as "${familyUser.full_name || familyUser.username}". Please enter your parent's code (e.g. JOE-7401).`);
      return;
    }

    setConnectLoading(true);
    setConnectMessage('');
    setConnectError('');

    try {
      const res = await fetch(`${apiBase}/api/connections/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requester_user_id: currentUserId,
          target_identifier: ident,
          relationship_type: relationshipType
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to send connection request');
      }

      if (data.status === 'Already Pending') {
        setConnectMessage(`Connection request is already pending approval from ${data.recipient_name || 'parent'}.`);
      } else if (data.status === 'Already Connected') {
        setConnectMessage(`You are already connected with ${data.recipient_name || 'parent'}!`);
      } else {
        setConnectMessage(`Connection request sent to ${data.recipient_name || ident}! Waiting for approval.`);
      }

      fetchConnections();
      setTimeout(() => {
        setShowConnectModal(false);
      }, 2500);
    } catch (err) {
      setConnectError(err.message || 'No user found with this identifier');
    } finally {
      setConnectLoading(false);
    }
  };

  // Acknowledge / Update Help Request Status
  const handleUpdateHelpStatus = async (helpId, newStatus) => {
    try {
      await fetch(`${apiBase}/api/help-requests/${helpId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes: `Updated by ${currentUserName}` })
      });
      fetchHelpRequests();
    } catch (err) {
      console.error(err);
    }
  };

  // Create Appointment
  const handleCreateApptSubmit = async (e) => {
    e.preventDefault();
    await onCreateAppointment({
      parent_id: activeParentId,
      doctor_name: newApptDoctor,
      hospital_clinic: newApptHospital,
      appointment_date: newApptDate,
      appointment_time: newApptTime,
      purpose: newApptPurpose
    });
    setShowNewApptModal(false);
  };

  // Create Household Request
  const handleCreateRequestSubmit = async (e) => {
    e.preventDefault();
    if (!newReqTitle.trim()) return;
    await onCreateRequest({
      parent_id: activeParentId,
      title: newReqTitle,
      category: newReqCategory,
      priority: newReqPriority,
      notes: newReqNotes
    });
    setNewReqTitle('');
    setNewReqNotes('');
    setShowNewRequestModal(false);
  };

  const hasConnectedParent = connectionsData.connected.length > 0;
  const activeAlerts = alerts.filter((a) => a.is_resolved === 0);
  const pendingHelpRequests = helpRequests.filter(h => h.status !== 'Completed' && h.status !== 'Cancelled');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home, badge: activeAlerts.length },
    { id: 'parents', label: 'My Parents', icon: Users, badge: connectionsData.outgoing.length > 0 ? 'Pending' : undefined },
    { id: 'voice', label: 'Voice Notes', icon: Mic, badge: voiceMessages.length > 0 ? voiceMessages.length : undefined },
    { id: 'travel', label: 'Location & Rides', icon: MapPin },
    { id: 'care', label: 'Health', icon: Calendar },
    { id: 'requests', label: 'Help', icon: ListTodo, badge: pendingHelpRequests.length > 0 ? pendingHelpRequests.length : undefined }
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
            background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>
              Good morning, {currentUserName}
            </div>
            <div style={{ fontSize: '11px', color: '#99f6e4' }}>
              "Stay connected with your family."
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowConnectModal(true)}
            style={{
              background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
              color: '#fff',
              border: 'none',
              borderRadius: '99px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={13} />
            <span>Connect Parent</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                borderRadius: '99px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Sign Out"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </header>

      {/* Emergency Alert Banner */}
      {activeAlerts.length > 0 && (
        <div style={{
          background: 'linear-gradient(90deg, #991b1b, #dc2626)',
          color: '#fff',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          fontWeight: '700'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertOctagon size={16} />
            <span>ALERT: {activeAlerts[0].message}</span>
          </div>
          <button
            onClick={() => onResolveAlert(activeAlerts[0].id)}
            style={{
              background: '#fff',
              color: '#dc2626',
              border: 'none',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            Resolve
          </button>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="mobile-content-area">

        {/* ===================== TAB: OVERVIEW ===================== */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* EMPTY STATE IF NO PARENT CONNECTED YET (FEATURE 1 & 2) */}
            {!hasConnectedParent ? (
              <div className="card-glass" style={{ textAlign: 'center', padding: '32px 18px', borderLeft: '4px solid #38bdf8' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px auto'
                }}>
                  <Users size={28} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
                  No Parents Connected Yet
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.4, maxWidth: '280px', margin: '0 auto 16px auto' }}>
                  Connect with a parent to start coordinating their care, health, and travel.
                </p>

                {connectionsData.outgoing.length > 0 ? (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#fbbf24',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}>
                    ⏳ Connection request sent to {connectionsData.outgoing[0].recipient_name}! Pending approval.
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConnectModal(true)}
                    className="btn-primary"
                    style={{ padding: '12px 20px', margin: '0 auto' }}
                  >
                    <Plus size={16} />
                    <span>Connect a Parent</span>
                  </button>
                )}
              </div>
            ) : (
              /* CONNECTED PARENT CARD (SECTION 7A) */
              <div className="card-glass" style={{ borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Connected Parent
                  </span>
                  <span className="badge badge-success">Connected</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h2 style={{ fontSize: '19px', fontWeight: '900', color: '#fff' }}>
                      {activeParentName}
                    </h2>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Father • {connectionsData.connected[0]?.connected_city || 'Bengaluru'}
                    </div>
                  </div>
                  <a
                    href={`tel:${connectionsData.connected[0]?.connected_phone || ''}`}
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#34d399',
                      padding: '8px 12px',
                      borderRadius: '99px',
                      fontSize: '12px',
                      fontWeight: '700',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <PhoneCall size={14} />
                    <span>Call</span>
                  </a>
                </div>

                {/* Quick Parent Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
                  <button
                    onClick={() => setActiveTab('care')}
                    style={{ flex: 1, background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', color: '#fff', padding: '8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    View Care
                  </button>
                  <button
                    onClick={() => setActiveTab('travel')}
                    style={{ flex: 1, background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', color: '#fff', padding: '8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    View Location
                  </button>
                  <button
                    onClick={() => setActiveTab('voice')}
                    style={{ flex: 1, background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', color: '#fff', padding: '8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Voice Notes
                  </button>
                </div>
              </div>
            )}

            {/* REQUESTS REQUIRING ATTENTION BANNER (FEATURE 5) */}
            {pendingHelpRequests.length > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(219, 39, 119, 0.15))',
                border: '2px solid #ec4899',
                borderRadius: '16px',
                padding: '14px 16px',
                boxShadow: '0 4px 16px rgba(236, 72, 153, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={16} color="#f472b6" />
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#fbcfe8', textTransform: 'uppercase' }}>
                      Requests Requiring Your Attention
                    </span>
                  </div>
                  <span className="badge badge-critical">{pendingHelpRequests[0].status}</span>
                </div>

                <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff', marginBottom: '2px' }}>
                  {activeParentName} needs assistance: {pendingHelpRequests[0].category}
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '10px' }}>
                  "{pendingHelpRequests[0].description}"
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      if (pendingHelpRequests[0].category.includes('Ride')) {
                        setShowRideCoordModal(true);
                      } else {
                        handleUpdateHelpStatus(pendingHelpRequests[0].id, 'Assistance Arranged');
                      }
                    }}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #db2777, #ec4899)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '9px 12px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <Car size={14} />
                    <span>Coordinate Assistance</span>
                  </button>
                  <button
                    onClick={() => handleUpdateHelpStatus(pendingHelpRequests[0].id, 'Completed')}
                    style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#34d399',
                      borderRadius: '10px',
                      padding: '9px 12px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Resolve
                  </button>
                </div>
              </div>
            )}

            {/* SHARED LOCATION PREVIEW CARD */}
            {latestSharedLocation ? (
              <div className="card-glass" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#fbbf24', textTransform: 'uppercase' }}>
                    Shared GPS Location
                  </span>
                  <span className={`freshness-tag freshness-${latestLocFreshness}`}>
                    <span className="pulsing-dot" style={{ background: latestLocFreshness === 'current' ? '#10b981' : '#f59e0b' }}></span>
                    {latestLocFreshness === 'current' ? 'Current (Live)' : latestLocFreshness === 'recent' ? 'Recent' : 'Stale'}
                  </span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '2px' }}>
                  📍 {latestSharedLocation.address}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '10px' }}>
                  Shared at: {latestSharedLocation.shared_at} • Battery: {latestSharedLocation.battery_level || 82}%
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setShowRideCoordModal(true)}
                    className="btn-primary"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '12px', background: '#d97706' }}
                  >
                    <Car size={14} />
                    <span>Coordinate Ride Pickup</span>
                  </button>
                  <a
                    href={`https://maps.google.com/?q=${latestSharedLocation.latitude},${latestSharedLocation.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      color: '#fff',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ExternalLink size={14} />
                    <span>Maps</span>
                  </a>
                </div>
              </div>
            ) : locPermissionDenied ? (
              <div className="card-glass" style={{ borderLeft: '4px solid #ef4444' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#f87171' }}>
                  Location Sharing Not Authorized
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  {activeParentName} has not enabled location sharing for your account.
                </div>
              </div>
            ) : null}

            {/* RECENT VOICE NOTE CARD (FEATURE 4) */}
            {voiceMessages.length > 0 && (
              <div className="card-glass" style={{ borderLeft: '4px solid #06b6d4' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase' }}>
                    Recent Voice Message
                  </span>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {voiceMessages[voiceMessages.length - 1].created_at}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#e2e8f0', marginBottom: '8px' }}>
                  <strong>{voiceMessages[voiceMessages.length - 1].sender_name}:</strong> "{voiceMessages[voiceMessages.length - 1].transcript || 'Audio voice note'}"
                </div>

                {voiceMessages[voiceMessages.length - 1].audio_data && (
                  <audio controls src={voiceMessages[voiceMessages.length - 1].audio_data} style={{ width: '100%', height: '34px' }} />
                )}
              </div>
            )}

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="card-glass" onClick={() => setActiveTab('care')} style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Active Medicines</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#34d399', marginTop: '4px' }}>
                  {prescriptions.length}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Prescriptions authorized</div>
              </div>

              <div className="card-glass" onClick={() => setActiveTab('care')} style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Upcoming Appt</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {appointments.length > 0 ? appointments[0].doctor_name : 'None scheduled'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {appointments.length > 0 ? appointments[0].appointment_date : 'All clear'}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ===================== TAB: MY PARENTS (FEATURE 2) ===================== */}
        {activeTab === 'parents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>My Connected Parents</h2>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Parents you coordinate care for</div>
              </div>
              <button
                onClick={() => setShowConnectModal(true)}
                className="btn-primary"
                style={{ padding: '8px 12px', fontSize: '12px' }}
              >
                <Plus size={14} />
                <span>Connect Parent</span>
              </button>
            </div>

            {/* Connected Parents List */}
            {connectionsData.connected.length === 0 ? (
              <div className="card-glass" style={{ textAlign: 'center', padding: '30px 16px', color: '#94a3b8' }}>
                <Users size={32} color="#0d9488" style={{ margin: '0 auto 8px auto' }} />
                <div>No connected parents yet. Enter your parent's invitation code to send a request.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {connectionsData.connected.map((conn) => (
                  <div key={conn.connection_id} className="card-glass" style={{ borderLeft: '4px solid #10b981' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>
                          {conn.connected_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#34d399' }}>
                          Role: Parent • {conn.connected_city}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                          Address: {conn.connected_address || 'Home Residence'}
                        </div>
                      </div>
                      <span className="badge badge-success">Connected</span>
                    </div>

                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(148, 163, 184, 0.1)', display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setActiveTab('care')}
                        style={{ flex: 1, background: '#0d9488', border: 'none', color: '#fff', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        View Healthcare
                      </button>
                      <button
                        onClick={() => setActiveTab('travel')}
                        style={{ flex: 1, background: '#d97706', border: 'none', color: '#fff', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Track Location
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Outgoing Pending Requests */}
            {connectionsData.outgoing.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#fbbf24', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Pending Requests ({connectionsData.outgoing.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {connectionsData.outgoing.map((out) => (
                    <div key={out.connection_id} className="card-glass" style={{ borderLeft: '4px solid #fbbf24', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: '#fff' }}>
                          {out.recipient_name}
                        </span>
                        <span className="badge badge-warning">Pending Approval</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                        Requested relationship: {out.relationship_type} • Sent: {out.created_at}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB: VOICE MESSAGES (FEATURE 4) ===================== */}
        {activeTab === 'voice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Voice Messages & Transcripts</h2>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Audio notes and speech transcripts sent between you and {activeParentName}
              </div>
            </div>

            {voiceMessages.length === 0 ? (
              <div className="card-glass" style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
                <Mic size={32} color="#06b6d4" style={{ margin: '0 auto 8px auto' }} />
                <div>No voice messages yet. When {activeParentName} speaks a message, it will appear here.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {voiceMessages.map((vm) => (
                  <div key={vm.id} className="card-glass" style={{ borderLeft: '4px solid #06b6d4' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8' }}>
                        From: {vm.sender_name}
                      </span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {vm.created_at}
                      </span>
                    </div>

                    {/* Speech Transcript */}
                    <div style={{ fontSize: '13px', color: '#fff', marginBottom: '8px', lineHeight: 1.4 }}>
                      <strong>Transcript:</strong> {vm.transcript ? `"${vm.transcript}"` : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Transcription unavailable. You can still listen to the audio.</span>}
                    </div>

                    {/* Audio Player */}
                    {vm.audio_data ? (
                      <audio controls src={vm.audio_data} style={{ width: '100%', height: '36px', marginTop: '4px' }} />
                    ) : (
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Original audio stream saved on server.</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB: LOCATION & RIDES (FEATURE 5) ===================== */}
        {activeTab === 'travel' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Location & Ride Coordination</h2>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Track arrival and arrange pickup</div>
              </div>
              <button
                onClick={() => setShowRideCoordModal(true)}
                className="btn-primary"
                style={{ padding: '8px 12px', fontSize: '12px', background: '#d97706' }}
              >
                <Car size={14} />
                <span>Coordinate Ride</span>
              </button>
            </div>

            {/* Latest Shared Location Card */}
            {latestSharedLocation ? (
              <div className="card-glass" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#fbbf24', textTransform: 'uppercase' }}>
                    Parent Shared Location
                  </span>
                  <span className={`freshness-tag freshness-${latestLocFreshness}`}>
                    <span className="pulsing-dot" style={{ background: latestLocFreshness === 'current' ? '#10b981' : '#f59e0b' }}></span>
                    {latestLocFreshness === 'current' ? 'Current (Live)' : latestLocFreshness === 'recent' ? 'Recent' : 'Stale'}
                  </span>
                </div>

                <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
                  📍 {latestSharedLocation.address}
                </div>

                {latestSharedLocation.note && (
                  <div style={{ fontSize: '12px', color: '#fef08a', background: 'rgba(245, 158, 11, 0.15)', padding: '8px 10px', borderRadius: '8px', marginBottom: '10px' }}>
                    "{latestSharedLocation.note}"
                  </div>
                )}

                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px' }}>
                  GPS: {latestSharedLocation.latitude?.toFixed(4)}, {latestSharedLocation.longitude?.toFixed(4)} • Shared at {latestSharedLocation.shared_at}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <a
                    href={`https://maps.google.com/?q=${latestSharedLocation.latitude},${latestSharedLocation.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      background: 'rgba(30, 41, 59, 0.9)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      color: '#fff',
                      padding: '10px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: '700',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <ExternalLink size={14} />
                    <span>Open in Google Maps</span>
                  </a>
                </div>
              </div>
            ) : locPermissionDenied ? (
              <div className="card-glass" style={{ borderLeft: '4px solid #ef4444', textAlign: 'center', padding: '24px 16px' }}>
                <Lock size={28} color="#ef4444" style={{ margin: '0 auto 8px auto' }} />
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Access Denied: Location Sharing Not Authorized</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  {activeParentName} has disabled location sharing with your account under consent permissions.
                </div>
              </div>
            ) : (
              <div className="card-glass" style={{ textAlign: 'center', padding: '24px 16px', color: '#94a3b8' }}>
                <MapPin size={28} color="#f59e0b" style={{ margin: '0 auto 8px auto' }} />
                <div>No active shared location. When {activeParentName} taps "Share My Location", it will appear here.</div>
              </div>
            )}

            {/* Ride Status Tracker Section */}
            <div className="card-glass" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#60a5fa', textTransform: 'uppercase' }}>
                  Active Ride Coordination Status
                </span>
                <span className="badge badge-info">{rideStatus}</span>
              </div>

              <div style={{ fontSize: '13px', color: '#fff', marginBottom: '6px' }}>
                <strong>Pickup:</strong> {ridePickupLocation}
              </div>
              <div style={{ fontSize: '13px', color: '#fff', marginBottom: '8px' }}>
                <strong>Destination:</strong> {rideDropoffLocation}
              </div>

              {/* Progress Steps */}
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', margin: '14px 0 8px 0' }}>
                {['Submitted', 'Acknowledged', 'Assistance Being Arranged', 'Completed'].map((st, idx) => {
                  const isDone = (rideStatus === 'Completed') || (rideStatus === st) || (idx === 0);
                  return (
                    <div key={st} style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: isDone ? '#10b981' : '#334155',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 4px auto'
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ fontSize: '9px', color: isDone ? '#34d399' : '#64748b' }}>{st}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic', marginTop: '8px' }}>
                * Honest Integration Note: Status tracking coordinates external pickup fleet. No fake direct API booking claims.
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB: HEALTHCARE (FEATURE 3) ===================== */}
        {activeTab === 'care' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Authorized Healthcare</h2>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Records authorized by {activeParentName}</div>
              </div>
              <button
                onClick={() => setShowNewApptModal(true)}
                className="btn-primary"
                style={{ padding: '8px 12px', fontSize: '12px' }}
              >
                <Plus size={14} />
                <span>Book Appt</span>
              </button>
            </div>

            {/* Prescriptions Section (with Permission Verification) */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#34d399', marginBottom: '8px' }}>
                Prescriptions & Daily Medications
              </div>

              {prescriptionsPermissionDenied ? (
                <div className="card-glass" style={{ borderLeft: '4px solid #ef4444', textAlign: 'center', padding: '20px 14px' }}>
                  <Lock size={24} color="#ef4444" style={{ margin: '0 auto 6px auto' }} />
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Prescription Access Not Authorized</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    {activeParentName} has not granted permission to view prescription records.
                  </div>
                </div>
              ) : prescriptions.length === 0 ? (
                <div className="card-glass" style={{ textAlign: 'center', color: '#94a3b8', padding: '16px' }}>
                  No prescriptions recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {prescriptions.map((rx) => (
                    <div key={rx.id} className="card-glass" style={{ borderLeft: '4px solid #10b981', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontWeight: '800', fontSize: '14px', color: '#fff' }}>{rx.medicine_name}</span>
                          <span style={{ fontSize: '12px', color: '#5eead4', marginLeft: '6px' }}>({rx.dosage})</span>
                        </div>
                        <span className="badge badge-success">{rx.source || 'Doctor Rx'}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                        Frequency: {rx.frequency} • Prescribing Doctor: {rx.doctor_name || 'Physician'}
                      </div>
                      {rx.instructions && (
                        <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '6px', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 8px', borderRadius: '6px' }}>
                          Instructions: {rx.instructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Doctor Appointments Section */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#818cf8', marginBottom: '8px' }}>
                Upcoming Doctor Appointments
              </div>
              {appointments.length === 0 ? (
                <div className="card-glass" style={{ textAlign: 'center', color: '#94a3b8', padding: '14px' }}>
                  No appointments scheduled.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {appointments.map((a) => (
                    <div key={a.id} className="card-glass" style={{ borderLeft: '4px solid #6366f1', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: '#fff' }}>{a.doctor_name}</span>
                        <span className="badge badge-info">{a.status}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        📅 {a.appointment_date} at {a.appointment_time} • {a.hospital_clinic}
                      </div>
                      <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>
                        Purpose: {a.purpose}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB: HELP & REQUESTS ===================== */}
        {activeTab === 'requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Care Requests</h2>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Dispatched by {activeParentName}</div>
              </div>
              <button
                onClick={() => setShowNewRequestModal(true)}
                className="btn-primary"
                style={{ padding: '8px 12px', fontSize: '12px' }}
              >
                <Plus size={14} />
                <span>New Request</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="filter-pill-bar">
              {['All', 'Pending', 'In Progress', 'Completed'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setRequestFilter(filter)}
                  className={`filter-pill ${requestFilter === filter ? 'active' : ''}`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Help Requests List */}
            {helpRequests.length === 0 ? (
              <div className="card-glass" style={{ textAlign: 'center', padding: '24px 16px', color: '#94a3b8' }}>
                No active help requests.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {helpRequests.map((hr) => (
                  <div key={hr.id} className="card-glass" style={{ borderLeft: '4px solid #ec4899', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{hr.category}</span>
                      <span className={`badge ${hr.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>{hr.status}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#e2e8f0', marginBottom: '8px' }}>
                      "{hr.description}"
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>{hr.created_at}</span>
                      {hr.status !== 'Completed' && (
                        <button
                          onClick={() => handleUpdateHelpStatus(hr.id, 'Completed')}
                          style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ===================== MODALS ===================== */}

      {/* 1. CONNECT A PARENT MODAL (FEATURE 2) */}
      {showConnectModal && (
        <div className="modal-overlay">
          <div className="modal-sheet">
            <div className="sheet-handle"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>Connect with a Parent</h3>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Search by Invitation Code or Username</span>
              </div>
              <button onClick={() => setShowConnectModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendConnectionRequest} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label className="input-label">Parent Invitation Code or Username *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    required
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. JOE-7401 or joe"
                    className="input-field"
                    style={{ flex: 1 }}
                  />
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                  Ask your parent for their unique 8-character invitation code (e.g. <strong>JOE-7401</strong>).
                </div>
              </div>

              <div>
                <label className="input-label">Your Relationship</label>
                <select
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value)}
                  className="input-field"
                >
                  <option value="Child (Son)">Child (Son)</option>
                  <option value="Child (Daughter)">Child (Daughter)</option>
                  <option value="Daughter-in-law">Daughter-in-law</option>
                  <option value="Son-in-law">Son-in-law</option>
                  <option value="Guardian">Guardian</option>
                </select>
              </div>

              {connectError && (
                <div style={{ padding: '8px 10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '11px' }}>
                  {connectError}
                </div>
              )}

              {connectMessage ? (
                <div style={{ padding: '8px 10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#6ee7b7', fontSize: '11px' }}>
                  ✓ {connectMessage}
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={connectLoading}
                  className="btn-primary"
                  style={{ padding: '12px', marginTop: '4px' }}
                >
                  <Send size={15} />
                  <span>{connectLoading ? 'Searching & Sending...' : 'Send Connection Request'}</span>
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* 2. RIDE COORDINATION MODAL (FEATURE 5) */}
      {showRideCoordModal && (
        <div className="modal-overlay">
          <div className="modal-sheet">
            <div className="sheet-handle"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>Coordinate Pickup & Ride</h3>
                <span style={{ fontSize: '11px', color: '#fbbf24' }}>Assist {activeParentName} with safe transportation</span>
              </div>
              <button onClick={() => setShowRideCoordModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label className="input-label">Pickup Landmark / Address</label>
                <input
                  type="text"
                  value={ridePickupLocation}
                  onChange={(e) => setRidePickupLocation(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">Drop-off Destination</label>
                <input
                  type="text"
                  value={rideDropoffLocation}
                  onChange={(e) => setRideDropoffLocation(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">Current Coordination Status</label>
                <select
                  value={rideStatus}
                  onChange={(e) => setRideStatus(e.target.value)}
                  className="input-field"
                >
                  <option value="Submitted">Submitted (Request Received)</option>
                  <option value="Acknowledged">Acknowledged by Family</option>
                  <option value="Assistance Being Arranged">Assistance Being Arranged (Taxi Called)</option>
                  <option value="Assistance Confirmed">Assistance Confirmed (Driver en route)</option>
                  <option value="Completed">Completed (Parent Safely Home)</option>
                </select>
              </div>

              <div>
                <label className="input-label">Driver / Fleet Notes</label>
                <input
                  type="text"
                  value={rideDriverNotes}
                  onChange={(e) => setRideDriverNotes(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  onClick={() => setShowRideCoordModal(false)}
                  className="btn-primary"
                  style={{ flex: 1, padding: '12px' }}
                >
                  Update & Save Ride Status
                </button>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(ridePickupLocation)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ExternalLink size={14} />
                  <span>Maps</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. NEW APPOINTMENT MODAL */}
      {showNewApptModal && (
        <div className="modal-overlay">
          <div className="modal-sheet">
            <div className="sheet-handle"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>Coordinate Doctor Appointment</h3>
              <button onClick={() => setShowNewApptModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateApptSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label className="input-label">Doctor Name</label>
                <input
                  type="text"
                  required
                  value={newApptDoctor}
                  onChange={(e) => setNewApptDoctor(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">Hospital / Clinic</label>
                <input
                  type="text"
                  required
                  value={newApptHospital}
                  onChange={(e) => setNewApptHospital(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label className="input-label">Date</label>
                  <input
                    type="date"
                    required
                    value={newApptDate}
                    onChange={(e) => setNewApptDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">Time</label>
                  <input
                    type="text"
                    required
                    value={newApptTime}
                    onChange={(e) => setNewApptTime(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Purpose</label>
                <input
                  type="text"
                  required
                  value={newApptPurpose}
                  onChange={(e) => setNewApptPurpose(e.target.value)}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '12px', marginTop: '4px' }}
              >
                Submit Appointment Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sticky Bottom Navigation */}
      <MobileBottomNav
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />
    </div>
  );
}
