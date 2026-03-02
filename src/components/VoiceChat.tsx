import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, PhoneCall, PhoneOff } from 'lucide-react';

interface VoiceChatProps {
  sessionId: string;
  odce: string;
  userName: string;
  userColor: string;
  awareness: any;
}

export const VoiceChat: React.FC<VoiceChatProps> = ({
  sessionId,
  odce,
  userName,
  userColor,
  awareness
}) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const updateVoiceState = useCallback((inCall: boolean, muted: boolean, speaking: boolean) => {
    if (!awareness) return;
    const currentState = awareness.getLocalState() || {};
    awareness.setLocalState({
      ...currentState,
      voice: { inCall, isMuted: muted, isSpeaking: speaking }
    });
  }, [awareness]);

  const detectSpeaking = useCallback(() => {
    if (!analyserRef.current || isMuted) {
      setIsSpeaking(false);
      return;
    }
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const speaking = average > 30;
    setIsSpeaking(speaking);
    updateVoiceState(true, isMuted, speaking);
  }, [isMuted, updateVoiceState]);

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      localStreamRef.current = stream;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      return stream;
    } catch (err) {
      setError('Microphone access denied');
      throw err;
    }
  };

  useEffect(() => {
    if (!isInCall || isMuted) return;
    const interval = setInterval(detectSpeaking, 100);
    return () => clearInterval(interval);
  }, [isInCall, isMuted, detectSpeaking]);

  const joinCall = async () => {
    try {
      setError(null);
      await startLocalStream();
      setIsInCall(true);
      updateVoiceState(true, false, false);
    } catch (err) {
      console.error('Failed to join call:', err);
    }
  };

  const leaveCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsInCall(false);
    setIsSpeaking(false);
    updateVoiceState(false, false, false);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
        updateVoiceState(true, !isMuted, false);
      }
    }
  };

  const toggleDeafen = () => setIsDeafened(!isDeafened);

  useEffect(() => {
    return () => { leaveCall(); };
  }, []);

  return (
    <div className="voice-chat">
      {error && (
        <div className="voice-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      <div className="voice-controls">
        {!isInCall ? (
          <button className="voice-join-btn" onClick={joinCall} title="Join Voice Chat">
            <PhoneCall size={14} />
            <span>Voice</span>
          </button>
        ) : (
          <>
            <div className="voice-status">
              <div 
                className={`voice-avatar ${isSpeaking ? 'speaking' : ''}`}
                style={{ borderColor: userColor }}
              >
                <span>{userName.charAt(0).toUpperCase()}</span>
              </div>
            </div>

            <div className="voice-buttons">
              <button 
                className={`voice-btn ${isMuted ? 'active' : ''}`}
                onClick={toggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
              
              <button 
                className={`voice-btn ${isDeafened ? 'active' : ''}`}
                onClick={toggleDeafen}
                title={isDeafened ? 'Undeafen' : 'Deafen'}
              >
                {isDeafened ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              
              <button className="voice-btn leave" onClick={leaveCall} title="Leave Voice">
                <PhoneOff size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
