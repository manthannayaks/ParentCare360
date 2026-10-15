import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Mic, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  FileText, 
  PhoneCall, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  Volume2, 
  User, 
  LogOut,
  Navigation,
  Battery,
  Users,
  Copy,
  Plus,
  HelpCircle,
  Car,
  Clock,
  Square,
  Play,
  RotateCcw,
  Check,
  X,
  Lock,
  Pill
} from 'lucide-react';
import MobileBottomNav from './MobileBottomNav';

export default function ParentExperience({
  parent,
  currentUser,
  apiBase = 'http://localhost:8000',
  onTriggerSOS,
  onSendVoiceRequest,
  onHeartbeat,
  onShareLocation,
  appointments = [],
  caregiverVisits = [],
  documents = [],
  onLogout
}) {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'voice' | 'location' | 'care' | 'family' | 'profile'
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [heartbeatSent, setHeartbeatSent] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Connection & Permission Management State
  const [connectionsData, setConnectionsData] = useState({ connected: [], incoming: [], outgoing: [] });
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [permissionsState, setPermissionsState] = useState({
    view_prescriptions: 1,
    view_appointments: 1,
    view_documents: 1,
    receive_voice: 1,
    receive_location: 1,
    receive_help: 1,
    manage_caregiver: 1
  });

  // Help Request Modal State
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpCategory, setHelpCategory] = useState('Need a Ride');
  const [helpDescription, setHelpDescription] = useState('I have reached Bangalore airport. Please help me get home.');
  const [helpSubmitting, setHelpSubmitting] = useState(false);
  const [helpSuccess, setHelpSuccess] = useState(false);

  // Prescriptions State
  const [prescriptions, setPrescriptions] = useState([]);
  const [showAddRxModal, setShowAddRxModal] = useState(false);
  const [newRxName, setNewRxName] = useState('');
  const [newRxDosage, setNewRxDosage] = useState('');
  const [newRxFrequency, setNewRxFrequency] = useState('Once daily');
  const [newRxDoctor, setNewRxDoctor] = useState('Dr. A. K. Sharma');
  const [newRxInstructions, setNewRxInstructions] = useState('');

  // Voice State (Real Audio + Speech-to-Text)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceText, setVoiceText] = useState('');
  const [audioBlobUrl, setAudioBlobUrl] = useState(null);
  const [audioBase64, setAudioBase64] = useState(null);
  const [language, setLanguage] = useState('en-IN'); // 'en-IN' | 'hi-IN'
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceSubmitting, setVoiceSubmitting] = useState(false);
  const [voiceSuccess, setVoiceSuccess] = useState(null);
  const [selectedVoiceRecipientId, setSelectedVoiceRecipientId] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Location State
  const [currentCoords, setCurrentCoords] = useState(null);
  const [locationAddress, setLocationAddress] = useState('Kempegowda International Airport, Terminal 1, Bengaluru');
  const [locationNote, setLocationNote] = useState('I have reached Bengaluru airport. Please help me get home.');
  const [locationStatus, setLocationStatus] = useState('ready'); // 'ready' | 'getting' | 'shared' | 'error'
  const [batteryLevel, setBatteryLevel] = useState(82);
  const [selectedLocRecipientId, setSelectedLocRecipientId] = useState(null);

  const parentUserId = currentUser?.id || parent?.id || 1;
  const parentName = currentUser?.full_name || parent?.full_name || 'Joe';
  const invitationCode = currentUser?.invitation_code || 'JOE-7401';

  // Fetch Family Connections & Prescriptions
  const fetchConnections = async () => {
    try {
      const res = await fetch(`${apiBase}/api/connections/${parentUserId}`);
      if (res.ok) {
        const data = await res.json();
        setConnectionsData(data);
        if (data.connected.length > 0 && !selectedVoiceRecipientId) {
          setSelectedVoiceRecipientId(data.connected[0].connected_user_id);
          setSelectedLocRecipientId(data.connected[0].connected_user_id);
        }
      }
    } catch (err) {
      console.warn("Could not fetch connections:", err);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const res = await fetch(`${apiBase}/api/prescriptions?parent_user_id=${parentUserId}`);
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data);
      }
    } catch (err) {
      console.warn("Could not fetch prescriptions:", err);
    }
  };

  useEffect(() => {
    fetchConnections();
    fetchPrescriptions();
    const interval = setInterval(() => {
      fetchConnections();
    }, 8000);
    return () => clearInterval(interval);
  }, [parentUserId, apiBase]);

  // Setup Web Speech API & Battery
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setVoiceText(prev => (prev ? prev + ' ' : '') + transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition warning:', event.error);
      };

      recognitionRef.current = recognition;
    }

    if (navigator.getBattery) {
      navigator.getBattery().then((battery) => {
        setBatteryLevel(Math.round(battery.level * 100));
      }).catch(() => {});
    }
  }, [language]);

  // Handle Respond to Incoming Connection Request (Accept / Reject)
  const handleRespondConnection = async (connectionId, action) => {
    try {
      const res = await fetch(`${apiBase}/api/connections/${connectionId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection_id: connectionId,
          user_id: parentUserId,
          action: action
        })
      });
      if (res.ok) {
        await fetchConnections();
      }
    } catch (err) {
      console.error("Failed to respond to connection request:", err);
    }
  };

  // Open Permission Modal
  const handleOpenPermissions = (conn) => {
    setSelectedConnection(conn);
    setPermissionsState({
      view_prescriptions: conn.view_prescriptions ?? 1,
      view_appointments: conn.view_appointments ?? 1,
      view_documents: conn.view_documents ?? 1,
      receive_voice: conn.receive_voice ?? 1,
      receive_location: conn.receive_location ?? 1,
      receive_help: conn.receive_help ?? 1,
      manage_caregiver: conn.manage_caregiver ?? 1
    });
    setShowPermissionsModal(true);
  };

  // Save Permissions
  const handleSavePermissions = async () => {
    if (!selectedConnection) return;
    try {
      await fetch(`${apiBase}/api/connections/${selectedConnection.connection_id}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection_id: selectedConnection.connection_id,
          parent_user_id: parentUserId,
          ...permissionsState
        })
      });
      setShowPermissionsModal(false);
      fetchConnections();
    } catch (err) {
      console.error("Failed to update permissions:", err);
    }
  };

  // Revoke Connection
  const handleRevokeConnection = async (connId) => {
    if (window.confirm("Are you sure you want to disconnect this family member? They will lose access to your shared health and location information.")) {
      try {
        await fetch(`${apiBase}/api/connections/${connId}`, { method: 'DELETE' });
        setShowPermissionsModal(false);
        fetchConnections();
      } catch (err) {
        console.error("Failed to revoke connection:", err);
      }
    }
  };

  // Real Audio Recording Flow (MediaRecorder + Web Speech)
  const startRecordingAudio = async () => {
    setVoiceText('');
    setAudioBlobUrl(null);
    setAudioBase64(null);
    setVoiceSuccess(null);
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const blobUrl = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(blobUrl);

        // Convert to base64 data URL for persistence
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudioBase64(reader.result);
        };

        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);

      // Start elapsed timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);

      // Start Speech Recognition if supported
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = language;
          recognitionRef.current.start();
        } catch (e) {}
      }
    } catch (err) {
      console.warn("Microphone access denied or error:", err);
      // Fallback: allow text dictation preset
      setIsRecording(true);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    }
  };

  const stopRecordingAudio = () => {
    setIsRecording(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  const cancelRecordingAudio = () => {
    setIsRecording(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setVoiceText('');
    setAudioBlobUrl(null);
    setAudioBase64(null);
    setRecordingSeconds(0);
  };

  // Send Voice Message to Backend
  const handleSendVoiceMessage = async () => {
    const recipientId = selectedVoiceRecipientId || (connectionsData.connected[0]?.connected_user_id);
    if (!recipientId) {
      alert("Please select a connected family member recipient.");
      return;
    }

    setVoiceSubmitting(true);
    try {
      const payload = {
        sender_user_id: parentUserId,
        recipient_user_id: recipientId,
        audio_data: audioBase64 || null,
        speech_text: voiceText.trim() || null,
        duration_seconds: recordingSeconds || 5,
        language: language
      };

      const res = await fetch(`${apiBase}/api/voice/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setVoiceSuccess(data);
      setAudioBlobUrl(null);
      setAudioBase64(null);
      setVoiceText('');
      setRecordingSeconds(0);
    } catch (err) {
      console.error("Failed to send voice message:", err);
    } finally {
      setVoiceSubmitting(false);
    }
  };

  // Location Fetch & Share
  const handleFetchCurrentLocation = () => {
    setLocationStatus('getting');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy)
          });
          setLocationStatus('ready');
        },
        (err) => {
          console.warn('Geolocation fallback:', err.message);
          setCurrentCoords({ lat: 12.9716, lng: 77.5946, accuracy: 12 });
          setLocationStatus('ready');
        },
        { timeout: 6000 }
      );
    } else {
      setCurrentCoords({ lat: 12.9716, lng: 77.5946, accuracy: 12 });
      setLocationStatus('ready');
    }
  };

  const handleShareCurrentLocation = async () => {
    const recipientId = selectedLocRecipientId || (connectionsData.connected[0]?.connected_user_id);
    if (!recipientId) {
      alert("Please connect with a family member (e.g. Sam) to share your location.");
      return;
    }

    setLocationStatus('getting');
    try {
      const payload = {
        sender_user_id: parentUserId,
        recipient_user_id: recipientId,
        latitude: currentCoords ? currentCoords.lat : 12.9716,
        longitude: currentCoords ? currentCoords.lng : 77.5946,
        address: locationAddress,
        accuracy: currentCoords ? currentCoords.accuracy : 10.0,
        battery_level: batteryLevel,
        note: locationNote
      };

      const res = await fetch(`${apiBase}/api/location/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setLocationStatus('shared');
      } else {
        setLocationStatus('error');
      }
    } catch (err) {
      console.error(err);
      setLocationStatus('error');
    }
  };

  // Submit Help Request
  const handleSubmitHelpRequest = async (e) => {
    e.preventDefault();
    if (!helpDescription.trim()) return;

    setHelpSubmitting(true);
    try {
      const recipientId = connectionsData.connected[0]?.connected_user_id || null;
      const payload = {
        parent_user_id: parentUserId,
        category: helpCategory,
        description: helpDescription.trim(),
        assigned_family_user_id: recipientId
      };

      const res = await fetch(`${apiBase}/api/help-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setHelpSuccess(true);
        setTimeout(() => {
          setShowHelpModal(false);
          setHelpSuccess(false);
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHelpSubmitting(false);
    }
  };

  // Add Prescription
  const handleAddPrescriptionSubmit = async (e) => {
    e.preventDefault();
    if (!newRxName.trim()) return;

    try {
      const res = await fetch(`${apiBase}/api/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_user_id: parentUserId,
          medicine_name: newRxName.trim(),
          dosage: newRxDosage.trim(),
          frequency: newRxFrequency,
          doctor_name: newRxDoctor.trim(),
          instructions: newRxInstructions.trim(),
          start_date: new Date().toISOString().split('T')[0],
          source: 'Self-Recorded'
        })
      });
      if (res.ok) {
        setShowAddRxModal(false);
        setNewRxName('');
        setNewRxDosage('');
        setNewRxInstructions('');
        fetchPrescriptions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Daily Checkin (Heartbeat)
  const handleDailyCheckin = async () => {
    if (onHeartbeat) await onHeartbeat(parentUserId);
    setHeartbeatSent(true);
    setTimeout(() => setHeartbeatSent(false), 4000);
  };

  // Copy Invitation Code
  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(invitationCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    }
  };

  const tabs = [
    { id: 'home', label: 'Home', icon: Heart },
    { id: 'voice', label: 'Speak', icon: Mic },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'care', label: 'My Health', icon: Calendar },
    { id: 'family', label: 'Family', icon: Users }
  ];

  return (
    <div className="mobile-screen-container">
      {/* Top Header */}
      <header className="mobile-app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981, #0d9488)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)'
          }}>
            <Heart size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>
              Hello, {parentName}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              "Your care and family, all in one place."
            </div>
          </div>
        </div>

        {/* Invitation Code Pill */}
        <button
          onClick={handleCopyCode}
          style={{
            background: 'rgba(20, 184, 166, 0.15)',
            border: '1px solid rgba(20, 184, 166, 0.35)',
            color: '#5eead4',
            padding: '4px 10px',
            borderRadius: '99px',
            fontSize: '11px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer'
          }}
          title="Click to copy your unique family invitation code"
        >
          <Copy size={12} />
          <span>{copiedCode ? 'Copied!' : invitationCode}</span>
        </button>
      </header>

      {/* Main Content Scroll Area */}
      <div className="mobile-content-area">
        {activeTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* INCOMING CONNECTION REQUESTS BANNER (FEATURE 2) */}
            {connectionsData.incoming.length > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(59, 130, 246, 0.2))',
                border: '2px solid #6366f1',
                borderRadius: '16px',
                padding: '14px 16px',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.25)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Users size={18} color="#818cf8" />
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Family Connection Request
                  </span>
                </div>
                {connectionsData.incoming.map((req) => (
                  <div key={req.connection_id} style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '2px' }}>
                      {req.requester_name} wants to connect with you
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
                      Role: {req.relationship_type || 'Child / Family Member'} • {req.requester_city}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleRespondConnection(req.connection_id, 'accept')}
                        style={{
                          flex: 1,
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '10px',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Check size={16} />
                        <span>Accept & Connect</span>
                      </button>
                      <button
                        onClick={() => handleRespondConnection(req.connection_id, 'reject')}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '10px',
                          padding: '10px 14px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Daily Well-being Checkin Banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(13, 148, 136, 0.15))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '16px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#34d399', marginBottom: '2px' }}>
                  Daily Health Check-in
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {connectionsData.connected.length > 0 
                    ? `Let ${connectionsData.connected[0].connected_name} know you're safe`
                    : 'Check in for your daily safety log'}
                </div>
              </div>
              <button
                onClick={handleDailyCheckin}
                disabled={heartbeatSent}
                style={{
                  background: heartbeatSent ? '#10b981' : 'linear-gradient(135deg, #059669, #10b981)',
                  color: '#fff',
                  border: 'none',
                  padding: '9px 14px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle2 size={15} />
                <span>{heartbeatSent ? 'Synced!' : 'I am fine'}</span>
              </button>
            </div>

            {/* 6 LARGE ACTION CARDS FOR ELDERS (SECTIONS 5 & 8) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* 1. Share My Location */}
              <div 
                className="elder-card-action"
                onClick={() => setActiveTab('location')}
                style={{ borderLeft: '4px solid #f59e0b' }}
              >
                <div className="elder-action-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                  <MapPin size={26} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="elder-action-title">1. Share My Location</div>
                  <div className="elder-action-desc">Send where you are so family can arrange cab pickup</div>
                </div>
              </div>

              {/* 2. Send a Voice Message */}
              <div 
                className="elder-card-action"
                onClick={() => setActiveTab('voice')}
                style={{ borderLeft: '4px solid #06b6d4' }}
              >
                <div className="elder-action-icon" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#38bdf8' }}>
                  <Mic size={26} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="elder-action-title">2. Send a Voice Message</div>
                  <div className="elder-action-desc">Speak in Hindi or English — voice + text delivered</div>
                </div>
              </div>

              {/* 3. Ask for Help Modal */}
              <div 
                className="elder-card-action"
                onClick={() => setShowHelpModal(true)}
                style={{ borderLeft: '4px solid #ec4899' }}
              >
                <div className="elder-action-icon" style={{ background: 'rgba(236, 72, 153, 0.2)', color: '#f472b6' }}>
                  <HelpCircle size={26} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="elder-action-title">3. Ask for Help</div>
                  <div className="elder-action-desc">Need a ride, medicine refill, doctor, or caregiver</div>
                </div>
              </div>

              {/* 4. My Medicines & Prescriptions */}
              <div 
                className="elder-card-action"
                onClick={() => setActiveTab('care')}
                style={{ borderLeft: '4px solid #10b981' }}
              >
                <div className="elder-action-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                  <Pill size={26} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="elder-action-title">4. My Medicines & Prescriptions</div>
                  <div className="elder-action-desc">
                    {prescriptions.length > 0 ? `${prescriptions.length} recorded medications` : 'Add or review daily medications'}
                  </div>
                </div>
              </div>

              {/* 5. Doctor Appointments */}
              <div 
                className="elder-card-action"
                onClick={() => setActiveTab('care')}
                style={{ borderLeft: '4px solid #6366f1' }}
              >
                <div className="elder-action-icon" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
                  <Calendar size={26} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="elder-action-title">5. Doctor Appointments</div>
                  <div className="elder-action-desc">
                    {appointments.length > 0 ? `Next: ${appointments[0].doctor_name}` : 'Check upcoming clinic visits'}
                  </div>
                </div>
              </div>

              {/* 6. Connected Family & Permissions */}
              <div 
                className="elder-card-action"
                onClick={() => setActiveTab('family')}
                style={{ borderLeft: '4px solid #8b5cf6' }}
              >
                <div className="elder-action-icon" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}>
                  <Users size={26} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="elder-action-title">6. Connected Family & Permissions</div>
                  <div className="elder-action-desc">
                    {connectionsData.connected.length > 0
                      ? `${connectionsData.connected.length} connected family member(s) • Manage access`
                      : 'Share your invitation code with children'}
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency SOS Trigger */}
            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <button
                onClick={() => setShowSosModal(true)}
                className="btn-sos"
                style={{
                  width: '110px',
                  height: '110px',
                  margin: '0 auto',
                  border: '4px solid #fecaca'
                }}
              >
                <AlertTriangle size={36} />
                <span style={{ fontSize: '15px', fontWeight: '900', marginTop: '2px' }}>SOS</span>
                <span style={{ fontSize: '9px', opacity: 0.9 }}>TAP FOR HELP</span>
              </button>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                Instant emergency alert to family & caregiver
              </div>
            </div>

          </div>
        )}

        {/* VOICE MESSAGE SCREEN (FEATURE 4: REAL AUDIO + SPEECH-TO-TEXT) */}
        {activeTab === 'voice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '2px' }}>
                Send a Voice Message
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                Records your original audio and produces an instant transcript for family
              </p>
            </div>

            {/* Language & Recipient Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setLanguage('en-IN')}
                  className={`filter-pill ${language === 'en-IN' ? 'active' : ''}`}
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('hi-IN')}
                  className={`filter-pill ${language === 'hi-IN' ? 'active' : ''}`}
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                  हिंदी (Hindi)
                </button>
              </div>

              {/* Recipient Selector */}
              {connectionsData.connected.length > 0 && (
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  To: <strong style={{ color: '#5eead4' }}>{connectionsData.connected[0].connected_name}</strong>
                </div>
              )}
            </div>

            {/* Big Mic Audio Recorder Box */}
            <div className="voice-recorder-box">
              <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: isRecording ? '#f43f5e' : '#38bdf8' }}>
                {isRecording ? `Recording Audio... ${recordingSeconds}s` : (audioBlobUrl ? 'Audio Recorded' : 'Ready to Record')}
              </div>

              {/* Pulse Mic Button */}
              {!isRecording ? (
                <button
                  onClick={startRecordingAudio}
                  className="mic-pulse-btn"
                  style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)' }}
                >
                  <Mic size={40} />
                </button>
              ) : (
                <button
                  onClick={stopRecordingAudio}
                  className="mic-pulse-btn recording"
                  style={{ background: 'linear-gradient(135deg, #e11d48, #f43f5e)' }}
                >
                  <Square size={36} fill="#fff" />
                </button>
              )}

              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                {isRecording ? 'Tap the red square to stop recording' : 'Tap the microphone to start speaking'}
              </div>

              {/* Audio Playback Preview */}
              {audioBlobUrl && (
                <div style={{ width: '100%', marginTop: '14px', background: 'rgba(15, 23, 42, 0.7)', padding: '12px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#5eead4', fontWeight: '700', marginBottom: '6px' }}>
                    Preview Your Voice Recording:
                  </div>
                  <audio controls src={audioBlobUrl} style={{ width: '100%', height: '36px' }} />
                </div>
              )}

              {/* Speech-to-Text Transcript Display */}
              <div style={{ width: '100%', marginTop: '12px', textAlign: 'left' }}>
                <label className="input-label" style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Transcript (Auto-recognized):
                </label>
                <textarea
                  value={voiceText}
                  onChange={(e) => setVoiceText(e.target.value)}
                  placeholder="Your words will be transcribed here. You can also edit or type..."
                  className="input-field"
                  rows={3}
                />
              </div>

              {/* Send or Cancel Buttons */}
              {(audioBlobUrl || voiceText.trim()) && (
                <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '12px' }}>
                  <button
                    onClick={handleSendVoiceMessage}
                    disabled={voiceSubmitting}
                    className="btn-primary"
                    style={{ flex: 1, padding: '12px' }}
                  >
                    <Send size={16} />
                    <span>{voiceSubmitting ? 'Sending...' : 'Send to Family'}</span>
                  </button>
                  <button
                    onClick={cancelRecordingAudio}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      borderRadius: '12px',
                      padding: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              )}

              {/* Success Feedback */}
              {voiceSuccess && (
                <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', color: '#34d399', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} />
                  <span>Voice message & transcript delivered to family!</span>
                </div>
              )}
            </div>

            {/* Quick Presets for Convenient Testing */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                Or Tap Common Request Dictation:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  'I have reached Bangalore airport. Please help me get home.',
                  'Need refill for blood pressure medicine from Apollo Pharmacy.',
                  'Bathroom tap is leaking, please arrange a plumber.'
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setVoiceText(preset)}
                    style={{
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.15)',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      color: '#e2e8f0',
                      fontSize: '12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Volume2 size={14} color="#38bdf8" />
                    <span>"{preset}"</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LOCATION SHARING SCREEN (FEATURE 5) */}
        {activeTab === 'location' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '2px' }}>
                Share My Location
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                Allows your son to view your arrival point and coordinate a pickup ride
              </p>
            </div>

            <div className="card-glass" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span className="badge badge-warning">Location Sharing</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#94a3b8' }}>
                  <Battery size={14} color="#10b981" />
                  <span>Battery {batteryLevel}%</span>
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label className="input-label">Current Address / Landmark:</label>
                <input
                  type="text"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label className="input-label">Message for Family:</label>
                <input
                  type="text"
                  value={locationNote}
                  onChange={(e) => setLocationNote(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Coordinates display & Refresh */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '14px' }}>
                <span>GPS: {currentCoords ? `${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)}` : '12.9716, 77.5946 (BLR Airport)'}</span>
                <button 
                  onClick={handleFetchCurrentLocation}
                  style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600' }}
                >
                  <Navigation size={12} />
                  Refresh GPS
                </button>
              </div>

              <button
                onClick={handleShareCurrentLocation}
                disabled={locationStatus === 'getting'}
                className="btn-primary"
                style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}
              >
                <MapPin size={18} />
                <span>{locationStatus === 'getting' ? 'Broadcasting...' : 'Share Location with Family'}</span>
              </button>

              {locationStatus === 'shared' && (
                <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', color: '#34d399', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} />
                  <span>Location shared with your connected family!</span>
                </div>
              )}
            </div>

            {/* Travel Landmark Presets */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                Quick Travel Landmarks:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { name: 'BLR Airport Terminal 1', addr: 'Kempegowda International Airport, Terminal 1, Bengaluru', note: 'I have reached Bangalore airport. Please help me get home.' },
                  { name: 'City Railway Station', addr: 'Krantivira Sangolli Rayanna Bengaluru Station, Platform 1', note: 'Arrived by train. At the main entrance.' },
                  { name: 'Home Residence', addr: parent?.address || 'Flat 302, Palm Meadows, Whitefield, Bengaluru', note: 'Safely arrived at home.' }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setLocationAddress(item.addr);
                      setLocationNote(item.note);
                    }}
                    style={{
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.15)',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      color: '#e2e8f0',
                      fontSize: '12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>📍 {item.name}</span>
                    <span style={{ fontSize: '11px', color: '#38bdf8' }}>Select</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MY CARE SCREEN (FEATURE 3: MEDICINES, PRESCRIPTIONS & APPOINTMENTS) */}
        {activeTab === 'care' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>
                My Medicines & Care
              </h2>
              <button
                onClick={() => setShowAddRxModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={14} />
                <span>Add Rx</span>
              </button>
            </div>

            {/* Prescriptions List */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#34d399', marginBottom: '8px' }}>
                Active Prescriptions
              </div>
              {prescriptions.length === 0 ? (
                <div className="card-glass" style={{ textAlign: 'center', color: '#94a3b8', padding: '16px' }}>
                  No prescriptions recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {prescriptions.map((rx) => (
                    <div key={rx.id} className="card-glass" style={{ borderLeft: '4px solid #10b981', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontWeight: '800', fontSize: '14px', color: '#fff' }}>{rx.medicine_name}</span>
                          <span style={{ fontSize: '12px', color: '#5eead4', marginLeft: '6px' }}>({rx.dosage})</span>
                        </div>
                        <span className="badge badge-success">{rx.source || 'Doctor Rx'}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                        🕒 {rx.frequency} • Prescribed by: {rx.doctor_name || 'Physician'}
                      </div>
                      {rx.instructions && (
                        <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 8px', borderRadius: '6px' }}>
                          {rx.instructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Doctor Appointments */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#818cf8', marginBottom: '8px' }}>
                Upcoming Doctor Consultations
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

        {/* MY FAMILY TAB (FEATURE 2: CONNECTION & PERMISSION MANAGEMENT) */}
        {activeTab === 'family' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '2px' }}>
                My Family & Connections
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                Manage who can coordinate your care and access your health & location records
              </p>
            </div>

            {/* My Invitation Code Box */}
            <div className="card-glass" style={{ background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.15), rgba(15, 118, 110, 0.1))', border: '1px solid rgba(20, 184, 166, 0.3)' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#5eead4', marginBottom: '4px' }}>
                Your Family Invitation Code
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '0.05em', color: '#fff' }}>
                  {invitationCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  style={{
                    background: '#0d9488',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Copy size={13} />
                  <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                Give this code to your child (e.g. Sam) so they can send you a connection request.
              </div>
            </div>

            {/* Connected Family Members List */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '8px' }}>
                Connected Family Members ({connectionsData.connected.length})
              </div>

              {connectionsData.connected.length === 0 ? (
                <div className="card-glass" style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                  No family members connected yet. When Sam sends a connection request, you can accept it here.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {connectionsData.connected.map((conn) => (
                    <div key={conn.connection_id} className="card-glass" style={{ borderLeft: '4px solid #8b5cf6', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>
                            {conn.connected_name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#a78bfa' }}>
                            {conn.relationship_type || 'Family Member'} • {conn.connected_city}
                          </div>
                        </div>
                        <span className="badge badge-success">Connected</span>
                      </div>

                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                        Phone: {conn.connected_phone || 'N/A'}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <button
                          onClick={() => handleOpenPermissions(conn)}
                          style={{
                            flex: 1,
                            background: 'rgba(139, 92, 246, 0.2)',
                            border: '1px solid rgba(139, 92, 246, 0.4)',
                            color: '#c4b5fd',
                            borderRadius: '8px',
                            padding: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <ShieldCheck size={14} />
                          <span>Review Permissions</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Logout / Switch Role Button */}
            <button
              onClick={onLogout}
              style={{
                marginTop: '10px',
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
              <span>Switch Account / Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. ASK FOR HELP MODAL */}
      {showHelpModal && (
        <div className="modal-overlay">
          <div className="modal-sheet">
            <div className="sheet-handle"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>Ask Family for Help</h3>
              <button onClick={() => setShowHelpModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitHelpRequest} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label className="input-label">What do you need help with?</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {['Need a Ride', 'Need a Doctor', 'Need Medicines', 'Household Assistance', 'Need a Caregiver', 'Other'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setHelpCategory(cat)}
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        border: helpCategory === cat ? '2px solid #ec4899' : '1px solid rgba(148, 163, 184, 0.2)',
                        background: helpCategory === cat ? 'rgba(236, 72, 153, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                        color: helpCategory === cat ? '#fff' : '#cbd5e1',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="input-label">Description / Note:</label>
                <textarea
                  value={helpDescription}
                  onChange={(e) => setHelpDescription(e.target.value)}
                  rows={3}
                  className="input-field"
                  placeholder="e.g. I have reached Bangalore airport. Please help me get home."
                />
              </div>

              {helpSuccess ? (
                <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '10px', color: '#34d399', fontSize: '12px', textAlign: 'center' }}>
                  ✓ Request dispatched to family!
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={helpSubmitting}
                  className="btn-primary"
                  style={{ padding: '12px', background: 'linear-gradient(135deg, #db2777, #ec4899)' }}
                >
                  <Send size={16} />
                  <span>{helpSubmitting ? 'Sending Request...' : 'Send Help Request'}</span>
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* 2. ADD PRESCRIPTION MODAL */}
      {showAddRxModal && (
        <div className="modal-overlay">
          <div className="modal-sheet">
            <div className="sheet-handle"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>Add Prescription Record</h3>
              <button onClick={() => setShowAddRxModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPrescriptionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label className="input-label">Medicine Name *</label>
                <input
                  type="text"
                  required
                  value={newRxName}
                  onChange={(e) => setNewRxName(e.target.value)}
                  placeholder="e.g. Amlodipine"
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label className="input-label">Dosage</label>
                  <input
                    type="text"
                    value={newRxDosage}
                    onChange={(e) => setNewRxDosage(e.target.value)}
                    placeholder="e.g. 5 mg"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">Frequency</label>
                  <select
                    value={newRxFrequency}
                    onChange={(e) => setNewRxFrequency(e.target.value)}
                    className="input-field"
                  >
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="As needed">As needed (SOS)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="input-label">Doctor / Clinic</label>
                <input
                  type="text"
                  value={newRxDoctor}
                  onChange={(e) => setNewRxDoctor(e.target.value)}
                  placeholder="Dr. A. K. Sharma"
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">Instructions</label>
                <input
                  type="text"
                  value={newRxInstructions}
                  onChange={(e) => setNewRxInstructions(e.target.value)}
                  placeholder="Take after breakfast with water"
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ marginTop: '6px', padding: '12px' }}
              >
                Save Prescription
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. PERMISSIONS REVIEW MODAL (FEATURE 2) */}
      {showPermissionsModal && selectedConnection && (
        <div className="modal-overlay">
          <div className="modal-sheet">
            <div className="sheet-handle"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>
                  Permissions for {selectedConnection.connected_name}
                </h3>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Granular consent control over your private records
                </span>
              </div>
              <button onClick={() => setShowPermissionsModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              {[
                { key: 'view_prescriptions', label: 'View Prescriptions & Medications', desc: 'Allows viewing active medicines and dosage' },
                { key: 'receive_location', label: 'Receive Location Shares', desc: 'Allows receiving your GPS check-ins for pickup' },
                { key: 'receive_voice', label: 'Receive Voice Messages & Transcripts', desc: 'Allows audio message delivery' },
                { key: 'receive_help', label: 'Receive Help & Ride Requests', desc: 'Allows receiving your assistance needs' },
                { key: 'view_appointments', label: 'View Doctor Appointments', desc: 'Allows coordinating upcoming visits' },
                { key: 'view_documents', label: 'View Health Documents', desc: 'Allows access to lab reports' },
                { key: 'manage_caregiver', label: 'Manage Caregiver Visits', desc: 'Allows booking home nurse services' }
              ].map((p) => {
                const isGranted = permissionsState[p.key] === 1;
                return (
                  <div
                    key={p.key}
                    onClick={() => setPermissionsState(prev => ({ ...prev, [p.key]: isGranted ? 0 : 1 }))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px',
                      borderRadius: '10px',
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: isGranted ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.3)',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{p.label}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>{p.desc}</div>
                    </div>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '99px',
                      fontSize: '11px',
                      fontWeight: '800',
                      background: isGranted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: isGranted ? '#34d399' : '#f87171'
                    }}>
                      {isGranted ? 'Allowed' : 'Blocked'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button
                onClick={handleSavePermissions}
                className="btn-primary"
                style={{ flex: 1, padding: '12px' }}
              >
                Save Permissions
              </button>
              <button
                onClick={() => handleRevokeConnection(selectedConnection.connection_id)}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  borderRadius: '12px',
                  padding: '12px',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SOS CONFIRMATION MODAL */}
      {showSosModal && (
        <div className="modal-overlay">
          <div className="modal-sheet" style={{ borderTop: '4px solid #ef4444' }}>
            <div className="sheet-handle"></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px auto'
              }}>
                <AlertTriangle size={30} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
                Confirm Emergency SOS?
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>
                This immediately notifies your family and assigns urgent medical support.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={async () => {
                  if (onTriggerSOS) await onTriggerSOS(parentUserId);
                  setSosSent(true);
                  setShowSosModal(false);
                  setTimeout(() => setSosSent(false), 5000);
                }}
                style={{
                  background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  fontWeight: '800',
                  fontSize: '15px',
                  cursor: 'pointer'
                }}
              >
                YES, SEND EMERGENCY ALERT
              </button>
              <button
                onClick={() => setShowSosModal(false)}
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '12px',
                  padding: '12px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel (False Alarm)
              </button>
            </div>
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
