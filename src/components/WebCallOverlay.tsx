import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone, ShieldCheck, Zap } from 'lucide-react';
import { CallManagerService, ActiveCallState } from '../lib/callManager';

export const WebCallOverlay: React.FC = () => {
  const [callState, setCallState] = useState<ActiveCallState | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const unsubscribe = CallManagerService.subscribe((state) => {
      setCallState(state ? { ...state } : null);
    });
    return unsubscribe;
  }, []);

  // Bind local media stream
  useEffect(() => {
    if (callState?.localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = callState.localStream;
    }
  }, [callState?.localStream, callState?.isVideoOff]);

  // Bind remote media stream
  useEffect(() => {
    if (callState?.remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = callState.remoteStream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = callState.remoteStream;
      }
    }
  }, [callState?.remoteStream]);

  if (!callState) return null;

  const { type, status, isIncoming, participant, durationSeconds, isMicMuted, isVideoOff, remoteStream } = callState;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getInitials = (name: string) => {
    if (!name) return 'NC';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div
      id="web-call-overlay"
      className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-6 sm:p-10 select-none animate-in fade-in duration-200"
    >
      {/* Hidden audio element for remote audio stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Top Header info */}
      <div className="w-full max-w-md flex items-center justify-between pt-4 z-20">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs font-semibold tracking-wider text-neutral-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{type === 'video' ? 'ZEGOCLOUD HD VIDEO' : 'ZEGOCLOUD HD AUDIO'}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-[11px] font-medium text-blue-400">
          <Zap className="w-3 h-3" />
          <span>RTC LIVE</span>
        </div>
      </div>

      {/* Video Stream Container (If Video Call and Connected) */}
      {type === 'video' && status === 'connected' && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Remote Video Stream or Avatar Fallback */}
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-neutral-950 flex items-center justify-center">
              <div className="text-center">
                <div className="w-28 h-28 mx-auto rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-3xl font-bold text-neutral-300 mb-4 shadow-2xl">
                  {getInitials(participant.fullName)}
                </div>
                <p className="text-neutral-400 text-sm font-medium">{participant.fullName}</p>
                <p className="text-xs text-neutral-500 mt-1">Connecting video feed...</p>
              </div>
            </div>
          )}

          {/* Local Video PIP */}
          {!isVideoOff && (
            <div className="absolute top-20 right-6 w-32 h-44 sm:w-40 sm:h-56 rounded-2xl overflow-hidden bg-neutral-900 border-2 border-neutral-800 shadow-2xl z-20 pointer-events-auto">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            </div>
          )}
        </div>
      )}

      {/* Center Caller Profile & Status (Audio or Connecting/Ringing) */}
      {(type === 'audio' || status !== 'connected') && (
        <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center">
          {/* Avatar with animated glowing rings */}
          <div className="relative mb-6">
            {(status === 'ringing' || status === 'outgoing') && (
              <div className="absolute -inset-4 rounded-full bg-blue-500/20 animate-ping duration-1000" />
            )}
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-neutral-900 border-2 border-neutral-700 flex items-center justify-center text-3xl sm:text-4xl font-bold text-white shadow-2xl relative overflow-hidden">
              {participant.avatarUrl ? (
                <img
                  src={participant.avatarUrl}
                  alt={participant.fullName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{getInitials(participant.fullName)}</span>
              )}
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">
            {participant.fullName}
          </h2>
          <p className="text-neutral-400 text-sm font-medium mb-4">@{participant.username}</p>

          {/* Status indicator */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-800 text-sm font-medium">
            {status === 'outgoing' && <span className="text-blue-400">Calling via ZEGOCLOUD...</span>}
            {status === 'ringing' && <span className="text-amber-400">Incoming call...</span>}
            {status === 'connecting' && <span className="text-emerald-400">Connecting RTC...</span>}
            {status === 'connected' && (
              <span className="text-emerald-400 font-mono tracking-wider font-semibold">
                {formatDuration(durationSeconds)}
              </span>
            )}
            {status === 'ended' && <span className="text-rose-400">Call Ended</span>}
            {status === 'rejected' && <span className="text-rose-400">Call Declined</span>}
          </div>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div className="relative z-20 w-full max-w-md pb-6 flex flex-col items-center gap-6">
        {/* If Incoming and not answered yet */}
        {isIncoming && status === 'ringing' ? (
          <div className="flex items-center justify-center gap-16 w-full">
            {/* Reject Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                id="btn-reject-call"
                onClick={() => CallManagerService.rejectCall()}
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 transition flex items-center justify-center text-white shadow-lg shadow-rose-950/40 cursor-pointer"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              <span className="text-xs font-semibold text-rose-400">Decline</span>
            </div>

            {/* Accept Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                id="btn-accept-call"
                onClick={() => CallManagerService.acceptCall()}
                className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition flex items-center justify-center text-white shadow-lg shadow-emerald-950/40 cursor-pointer animate-pulse"
              >
                <Phone className="w-7 h-7" />
              </button>
              <span className="text-xs font-semibold text-emerald-400">Accept</span>
            </div>
          </div>
        ) : (
          /* Active Call Controls */
          <div className="flex items-center justify-center gap-4 w-full">
            {/* Mute Mic */}
            <button
              id="btn-call-mute"
              onClick={() => CallManagerService.toggleMute()}
              className={`w-14 h-14 rounded-full border transition flex items-center justify-center active:scale-95 cursor-pointer ${
                isMicMuted
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
              }`}
              title={isMicMuted ? 'Unmute' : 'Mute'}
            >
              {isMicMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* Toggle Video */}
            {type === 'video' && (
              <button
                id="btn-call-video"
                onClick={() => CallManagerService.toggleVideo()}
                className={`w-14 h-14 rounded-full border transition flex items-center justify-center active:scale-95 cursor-pointer ${
                  isVideoOff
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                }`}
                title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
              >
                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </button>
            )}

            {/* End Call Button */}
            <button
              id="btn-end-call"
              onClick={() => CallManagerService.endCall()}
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 transition flex items-center justify-center text-white shadow-lg shadow-rose-950/50 cursor-pointer ml-2"
              title="End Call"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

