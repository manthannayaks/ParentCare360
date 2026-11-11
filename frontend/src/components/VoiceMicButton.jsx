import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, AlertCircle, CheckCircle2, Volume2, ShieldAlert } from 'lucide-react';

/**
 * VoiceMicButton: Hardened Bilingual Voice Input with Visual Feedback & Fallback Routing
 * - Explicit OS-level microphone permission checks
 * - Concentric pulsing ring animation during recording
 * - 'Analyzing...' state during backend NLP processing
 * - Graceful degradation: Preserves raw audio and routes to Caregiver if NLP extraction fails
 */
export default function VoiceMicButton({
  parentId,
  apiBase = 'http://localhost:8000',
  onSuccess,
  language = 'hi-IN'
}) {
  const [recordState, setRecordState] = useState('idle'); // 'idle' | 'permission_denied' | 'listening' | 'analyzing' | 'success' | 'fallback'
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const transcriptRef = useRef('');

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const requestMicAndStartRecording = async () => {
    setErrorMessage('');
    transcriptRef.current = '';
    audioChunksRef.current = [];
    setElapsedSeconds(0);

    // 1. Permission Hardening: Pre-flight check and getUserMedia
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone recording not supported on this browser/environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // 2. Initialize MediaRecorder for Raw Audio Capture (Graceful Degradation Guarantee)
      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? { mimeType: 'audio/webm;codecs=opus' }
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? { mimeType: 'audio/mp4' }
        : {};

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop audio tracks to release microphone hardware indicator
        stream.getTracks().forEach((track) => track.stop());

        // Process audio blob
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm'
        });
        await handleAudioProcessing(audioBlob, transcriptRef.current);
      };

      // 3. Optional Web Speech API for Real-Time Client Transcript
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onresult = (event) => {
          let current = '';
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript + ' ';
          }
          transcriptRef.current = current.trim();
        };

        recognition.onerror = () => {
          // Non-blocking: We still have raw audio fallback!
        };

        try {
          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (_) {}
      }

      // 4. Start recording and pulsing animation
      mediaRecorder.start(250);
      setRecordState('listening');

      timerRef.current = setInterval(() => {
        setElapsedSeconds((sec) => sec + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone permission or hardware error:', err);
      setRecordState('permission_denied');
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please enable microphone access in your app settings.'
          : 'Unable to access audio input: ' + (err.message || 'Check microphone connection.')
      );
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setRecordState('analyzing');
      mediaRecorderRef.current.stop();
    }
  };

  const handleAudioProcessing = async (audioBlob, transcribedText) => {
    try {
      // Convert raw audio blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      reader.onloadend = async () => {
        const base64Audio = reader.result;

        // Post to backend NLP endpoint with full audio payload
        const response = await fetch(`${apiBase}/api/requests/voice-transcribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parent_id: parentId,
            speech_text: transcribedText,
            audio_data: base64Audio,
            language: language
          })
        });

        const result = await response.json();

        if (response.ok) {
          if (result.is_fallback) {
            setRecordState('fallback');
          } else {
            setRecordState('success');
          }
          if (onSuccess) onSuccess(result);
          setTimeout(() => setRecordState('idle'), 4000);
        } else {
          throw new Error(result.detail || 'Voice processing failed');
        }
      };
    } catch (err) {
      console.error('Failed to upload voice note:', err);
      setRecordState('idle');
      setErrorMessage('Could not send voice memo. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* 1. PULSING MICROPHONE BUTTON */}
      <div className="relative flex items-center justify-center">
        {recordState === 'listening' && (
          <>
            {/* Concentric Animated Pulse Waves */}
            <span className="absolute inline-flex h-32 w-32 animate-ping rounded-full bg-red-500/30" />
            <span className="absolute inline-flex h-24 w-24 animate-pulse rounded-full bg-amber-500/40" />
          </>
        )}

        <button
          onClick={recordState === 'listening' ? stopRecording : requestMicAndStartRecording}
          disabled={recordState === 'analyzing'}
          aria-label={recordState === 'listening' ? 'Stop Listening' : 'Hold to Speak in Hindi or English'}
          className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full shadow-2xl transition-all duration-300 ${
            recordState === 'listening'
              ? 'bg-red-600 text-white ring-4 ring-red-400 scale-105'
              : recordState === 'analyzing'
              ? 'bg-amber-600 text-white cursor-wait'
              : 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white hover:scale-105 active:scale-95 ring-4 ring-emerald-400/50'
          }`}
        >
          {recordState === 'listening' ? (
            <Square size={32} className="animate-pulse" />
          ) : recordState === 'analyzing' ? (
            <Loader2 size={36} className="animate-spin text-white" />
          ) : (
            <Mic size={38} className="text-white" />
          )}
        </button>
      </div>

      {/* 2. LIVE STATUS & FEEDBACK TEXT */}
      <div className="mt-4 text-center">
        {recordState === 'listening' && (
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2 text-red-400 font-bold text-lg animate-pulse">
              <span className="h-3 w-3 rounded-full bg-red-500 animate-ping" />
              <span>Listening in Hindi / English...</span>
            </div>
            <div className="font-mono text-xl text-slate-200">
              00:{elapsedSeconds < 10 ? `0${elapsedSeconds}` : elapsedSeconds}
            </div>
            <p className="text-xs text-slate-400">Tap the red square when finished speaking</p>
          </div>
        )}

        {recordState === 'analyzing' && (
          <div className="flex items-center justify-center gap-2 text-amber-300 font-semibold text-base animate-pulse">
            <Loader2 size={18} className="animate-spin" />
            <span>Analyzing intent & clinical keywords...</span>
          </div>
        )}

        {recordState === 'success' && (
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-base">
            <CheckCircle2 size={20} />
            <span>Voice Request Categorized & Dispatched!</span>
          </div>
        )}

        {recordState === 'fallback' && (
          <div className="rounded-xl bg-amber-950/80 border border-amber-600/50 p-3 text-left max-w-sm mt-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <ShieldAlert size={18} />
              <span>Preserved as Audio Voice Note</span>
            </div>
            <p className="text-xs text-amber-200/90 mt-1">
              Speech intent was unclear. Raw audio was safely preserved and routed directly to the Caregiver's dashboard for review.
            </p>
          </div>
        )}

        {recordState === 'permission_denied' && (
          <div className="rounded-xl bg-red-950/80 border border-red-500/50 p-3 text-left max-w-sm mt-2">
            <div className="flex items-center gap-2 text-red-300 font-bold text-sm">
              <AlertCircle size={18} />
              <span>Microphone Access Required</span>
            </div>
            <p className="text-xs text-red-200/90 mt-1">{errorMessage}</p>
          </div>
        )}

        {recordState === 'idle' && !errorMessage && (
          <p className="text-sm font-medium text-slate-300">
            Tap to speak in Hindi or English (Medicine, Doctor, Food, SOS)
          </p>
        )}
      </div>
    </div>
  );
}

