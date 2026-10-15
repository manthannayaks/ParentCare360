import React, { useState } from 'react';
import { AlertCircle, Mic, CheckCircle, Clock, Volume2, ShieldAlert, Heart, Calendar } from 'lucide-react';

export default function ElderMode({ parent, onTriggerSOS, onSendVoiceRequest, onHeartbeat }) {
  const [voiceText, setVoiceText] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('');
  const [sosSent, setSosSent] = useState(false);

  const presets = [
    { label: "🚰 Bathroom Tap Leaking", text: "Bathroom ka tap kharab hai aur paani gir raha hai" },
    { label: "💊 Medicine Refill", text: "BP aur diabetes ki dawa khatam ho gayi hai" },
    { label: "⚡ Electricity Bill", text: "Bijli ka bill payment me madad chahiye" },
  ];

  const handleSOS = () => {
    setSosSent(true);
    onTriggerSOS(parent ? parent.id : 1);
    setTimeout(() => setSosSent(false), 5000);
  };

  const submitVoice = (textToSubmit) => {
    const text = textToSubmit || voiceText;
    if (!text.trim()) return;
    setVoiceStatus('Processing voice NLP...');
    onSendVoiceRequest(parent ? parent.id : 1, text)
      .then(() => {
        setVoiceStatus('✓ Request recorded & sent to family!');
        setVoiceText('');
        setTimeout(() => setVoiceStatus(''), 4000);
      })
      .catch(() => setVoiceStatus('Error processing request'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px' }}>
      {/* Elder Welcome & Status Header */}
      <div className="card-glass" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))', textAlign: 'center', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '28px' }}>👴</span>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>{parent ? parent.full_name : 'Namaste, Ravi Ji'}</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>{parent?.city || 'Jodhpur'} • Age {parent?.age || 72}</p>
        
        <div style={{ marginTop: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '6px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: '600' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }}></span>
          System Active & Monitoring Safely
        </div>

        <button 
          onClick={() => onHeartbeat(parent?.id || 1)}
          style={{ display: 'block', margin: '14px auto 0', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
        >
          ❤️ Send Active Sensor Ping
        </button>
      </div>

      {/* 1-TAP EMERGENCY SOS BUTTON */}
      <div className="card-glass" style={{ textAlign: 'center', padding: '30px 20px', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
        <button
          onClick={handleSOS}
          className="btn-sos"
          style={{ width: '160px', height: '160px', margin: '0 auto', fontSize: '22px' }}
        >
          <ShieldAlert size={42} style={{ marginBottom: '6px' }} />
          <span>EMERGENCY</span>
          <span style={{ fontSize: '12px', fontWeight: '500', opacity: 0.9 }}>1-Tap SOS</span>
        </button>

        <p style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>
          Press anytime if you need immediate family or medical assistance.
        </p>

        {sosSent && (
          <div style={{ marginTop: '14px', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '10px', borderRadius: '8px', fontWeight: '700', fontSize: '14px' }}>
            🚨 SOS SENT! Family members & caregiver notified with location.
          </div>
        )}
      </div>

      {/* BILINGUAL VOICE ASSISTANT */}
      <div className="card-glass" style={{ borderColor: 'rgba(99, 102, 241, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '8px', borderRadius: '10px', color: '#818cf8' }}>
            <Mic size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '700' }}>Voice Request Assistant</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Bol kar ya type karke ticket banayein (Hindi/English)</p>
          </div>
        </div>

        {/* Quick Voice Simulation Chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => submitVoice(p.text)}
              style={{
                background: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                padding: '10px 14px',
                borderRadius: '10px',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>{p.label}</span>
              <Volume2 size={16} color="var(--indigo)" />
            </button>
          ))}
        </div>

        {/* Custom Input */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={voiceText}
            onChange={(e) => setVoiceText(e.target.value)}
            placeholder="Type or speak in Hindi/English..."
            style={{
              flex: 1,
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: 'var(--text-main)',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button onClick={() => submitVoice()} className="btn-primary" style={{ padding: '10px 16px' }}>
            Send
          </button>
        </div>

        {voiceStatus && (
          <div style={{ marginTop: '10px', fontSize: '13px', fontWeight: '600', color: voiceStatus.includes('✓') ? '#34d399' : '#818cf8' }}>
            {voiceStatus}
          </div>
        )}
      </div>

      {/* TODAY'S SCHEDULE FOR ELDER */}
      <div className="card-glass">
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="var(--sky)" />
          Aaj Ka Schedule (Today's Care)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '10px', borderLeft: '4px solid var(--sky)' }}>
            <div style={{ fontWeight: '700', fontSize: '14px' }}>👨‍⚕️ Doctor Follow-up Appointment</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>AIIMS Jodhpur • 10:30 AM</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '10px', borderLeft: '4px solid var(--emerald)' }}>
            <div style={{ fontWeight: '700', fontSize: '14px' }}>👩‍⚕️ Nurse Visit: Priya Verma</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Vitals & Blood Pressure Check • 09:00 AM</div>
          </div>
        </div>
      </div>
    </div>
  );
}
