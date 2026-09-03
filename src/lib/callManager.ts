import { supabase } from './supabase';
import { NativeBridgeClient } from './bridge/bridge';
import { isAndroidApp } from './bridge/runtime';
import { triggerHaptic } from './native';
import { ZegoService } from './zegoService';

export type CallType = 'audio' | 'video';
export type CallStatus = 'idle' | 'outgoing' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'rejected';

export interface CallParticipant {
  id: string;
  fullName: string;
  username: string;
  avatarUrl?: string;
}

export interface ActiveCallState {
  callId: string;
  type: CallType;
  status: CallStatus;
  isIncoming: boolean;
  participant: CallParticipant;
  durationSeconds: number;
  isMicMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
}

type CallStateListener = (state: ActiveCallState | null) => void;

class WebCallService {
  private currentCall: ActiveCallState | null = null;
  private listeners: Set<CallStateListener> = new Set();
  private timerInterval: any = null;
  private audioContext: AudioContext | null = null;
  private isRinging: boolean = false;
  private subscription: any = null;
  private currentUserId: string | null = null;
  private currentUserProfile: CallParticipant | null = null;

  constructor() {
    this.setupNativeBridgeListeners();
  }

  private setupNativeBridgeListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('native:callAction', (event: any) => {
      const detail = event?.detail;
      const action = typeof detail === 'string' ? JSON.parse(detail).action : detail?.action;
      console.log('[BRIDGE_EVENT] native:callAction:', action);
      if (action === 'accept') {
        this.acceptCall();
      } else if (action === 'reject') {
        this.rejectCall();
      } else if (action === 'end') {
        this.endCall();
      } else if (action === 'toggleMute') {
        this.toggleMute();
      } else if (action === 'toggleSpeaker') {
        this.toggleSpeaker();
      }
    });

    window.addEventListener('native:acceptCall', () => {
      console.log('[BRIDGE_EVENT] native:acceptCall received');
      this.acceptCall();
    });

    window.addEventListener('native:rejectCall', () => {
      console.log('[BRIDGE_EVENT] native:rejectCall received');
      this.rejectCall();
    });

    window.addEventListener('native:endCall', () => {
      console.log('[BRIDGE_EVENT] native:endCall received');
      this.endCall();
    });
  }

  init(userId: string, userProfile: CallParticipant) {
    this.currentUserId = userId;
    this.currentUserProfile = userProfile;

    if (this.subscription) {
      try {
        supabase.removeChannel(this.subscription);
      } catch (e) {}
      this.subscription = null;
    }

    // Subscribe to calling signaling channel
    this.subscription = supabase
      .channel(`calling_signaling_${userId}`)
      .on('broadcast', { event: 'call_signal' }, (payload: any) => {
        console.log('[CALL_SIGNAL_RECEIVED]', payload);
        this.handleIncomingSignal(payload.payload);
      })
      .subscribe((status) => {
        console.log(`[CALL_SIGNAL_CHANNEL] Status for ${userId}:`, status);
      });
  }

  subscribe(listener: CallStateListener): () => void {
    this.listeners.add(listener);
    listener(this.currentCall);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.currentCall));
  }

  getCurrentState(): ActiveCallState | null {
    return this.currentCall;
  }

  // --- AUDIO SYNTHESIS FOR RINGTONES ---
  private startWebRingtone(isIncoming: boolean) {
    try {
      this.stopWebRingtone();
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.audioContext = new AudioCtx();
      this.isRinging = true;

      const playRingLoop = () => {
        if (!this.isRinging || !this.audioContext) return;

        const now = this.audioContext.currentTime;
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        if (isIncoming) {
          // Standard European/US Phone Ring (440Hz + 480Hz)
          osc1.frequency.setValueAtTime(440, now);
          osc2.frequency.setValueAtTime(480, now);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.setValueAtTime(0.2, now + 1.5);
          gain.gain.setValueAtTime(0.001, now + 1.6);
        } else {
          // Ringback Tone (440Hz + 480Hz pulses)
          osc1.frequency.setValueAtTime(440, now);
          osc2.frequency.setValueAtTime(480, now);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.setValueAtTime(0.12, now + 1.0);
          gain.gain.setValueAtTime(0.001, now + 1.1);
        }

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioContext.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + (isIncoming ? 1.6 : 1.1));
        osc2.stop(now + (isIncoming ? 1.6 : 1.1));

        setTimeout(playRingLoop, isIncoming ? 3500 : 3000);
      };

      playRingLoop();
    } catch (e) {
      console.warn('Audio ringtone failed:', e);
    }
  }

  private stopWebRingtone() {
    this.isRinging = false;
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }
  }

  // --- CONNECT TO ZEGOCLOUD RTC ---
  private async connectZegoRtc(roomId: string, callType: CallType) {
    if (!this.currentUserId || !this.currentUserProfile) return;

    try {
      const { localStream } = await ZegoService.joinCallRoom({
        userId: this.currentUserId,
        userName: this.currentUserProfile.fullName || this.currentUserProfile.username,
        roomId,
        callType,
        onRemoteStream: (stream) => {
          if (this.currentCall) {
            this.currentCall.remoteStream = stream || undefined;
            this.notify();
          }
        },
        onConnectionState: (state) => {
          if (this.currentCall && state === 'CONNECTED') {
            this.currentCall.status = 'connected';
            this.notify();
          }
        },
      });

      if (this.currentCall && localStream) {
        this.currentCall.localStream = localStream;
        this.notify();
      }
    } catch (e) {
      console.warn('ZEGOCLOUD RTC initialization fallback:', e);
    }
  }

  // --- CALL INITIATION ---
  async startCall(target: CallParticipant, type: CallType = 'audio') {
    const callId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    this.currentCall = {
      callId,
      type,
      status: 'outgoing',
      isIncoming: false,
      participant: target,
      durationSeconds: 0,
      isMicMuted: false,
      isVideoOff: false,
      isSpeakerOn: type === 'video',
    };

    this.notify();
    this.startWebRingtone(false);

    // Notify Android native bridge for hardware audio routing & notifications
    if (isAndroidApp()) {
      if (type === 'audio') {
        NativeBridgeClient.startAudioCall(target.id, target.fullName, target.username, target.avatarUrl, callId);
      } else {
        NativeBridgeClient.startVideoCall(target.id, target.fullName, target.username, target.avatarUrl, callId);
      }
    }

    // Send invitation signal to recipient via Supabase Realtime
    await this.sendSignal(target.id, {
      type: 'invite',
      callId,
      callType: type,
      caller: this.currentUserProfile,
    });
  }

  // --- ACCEPT CALL ---
  async acceptCall() {
    if (!this.currentCall) return;

    const callId = this.currentCall.callId;
    const callType = this.currentCall.type;
    const targetUserId = this.currentCall.participant.id;

    this.stopWebRingtone();
    triggerHaptic('medium');

    this.currentCall.status = 'connected';
    this.startTimer();
    this.notify();

    // 1. Android Native Bridge sync
    if (isAndroidApp()) {
      NativeBridgeClient.acceptCall(callId);
    }

    // 2. Broadcast accept signal to caller via Supabase
    await this.sendSignal(targetUserId, {
      type: 'accept',
      callId,
    });

    // 3. Connect to ZEGOCLOUD Realtime Engine
    await this.connectZegoRtc(callId, callType);
  }

  // --- REJECT CALL ---
  async rejectCall() {
    if (!this.currentCall) return;

    const targetUserId = this.currentCall.participant.id;
    const callId = this.currentCall.callId;

    this.stopWebRingtone();
    triggerHaptic('light');

    if (isAndroidApp()) {
      NativeBridgeClient.rejectCall(callId);
    }

    await this.sendSignal(targetUserId, {
      type: 'reject',
      callId,
    });

    this.endCallInternal('rejected');
  }

  // --- END CALL ---
  async endCall() {
    if (!this.currentCall) return;

    const targetUserId = this.currentCall.participant.id;
    const callId = this.currentCall.callId;

    this.stopWebRingtone();
    triggerHaptic('light');

    if (isAndroidApp()) {
      NativeBridgeClient.endCall(callId);
    }

    await this.sendSignal(targetUserId, {
      type: 'end',
      callId,
    });

    this.endCallInternal('ended');
  }

  private async endCallInternal(status: CallStatus = 'ended') {
    this.stopWebRingtone();
    this.stopTimer();

    // Teardown ZEGOCLOUD Room & Streams
    await ZegoService.leaveRoom();

    if (this.currentCall) {
      this.currentCall.status = status;
      this.notify();
    }

    setTimeout(() => {
      this.currentCall = null;
      this.notify();
    }, 1200);
  }

  // --- CONTROLS ---
  toggleMute(): boolean {
    if (!this.currentCall) return false;
    const newState = !this.currentCall.isMicMuted;
    this.currentCall.isMicMuted = newState;

    ZegoService.muteMicrophone(newState);
    if (isAndroidApp()) {
      NativeBridgeClient.toggleMute(newState);
    }

    this.notify();
    return newState;
  }

  toggleVideo(): boolean {
    if (!this.currentCall) return false;
    const newState = !this.currentCall.isVideoOff;
    this.currentCall.isVideoOff = newState;

    ZegoService.muteCamera(newState);

    this.notify();
    return newState;
  }

  toggleSpeaker(): boolean {
    if (!this.currentCall) return false;
    const newState = !this.currentCall.isSpeakerOn;
    this.currentCall.isSpeakerOn = newState;

    if (isAndroidApp()) {
      NativeBridgeClient.toggleSpeakerphone(newState);
    }

    this.notify();
    return newState;
  }

  // --- SIGNALING HANDLER ---
  private async handleIncomingSignal(signal: any) {
    if (!signal) return;

    switch (signal.type) {
      case 'invite': {
        // If already in call, reject busy
        if (this.currentCall && this.currentCall.status === 'connected') {
          this.sendSignal(signal.caller.id, {
            type: 'reject',
            callId: signal.callId,
            reason: 'busy',
          });
          return;
        }

        // If Android App: Bridge to Native UI & Ringtone/Vibration
        if (isAndroidApp()) {
          NativeBridgeClient.handleIncomingCall(
            signal.callId,
            signal.caller.id,
            signal.caller.fullName,
            signal.caller.username,
            signal.caller.avatarUrl,
            signal.callType
          );
        }

        // Set Web Call State
        this.currentCall = {
          callId: signal.callId,
          type: signal.callType,
          status: 'ringing',
          isIncoming: true,
          participant: signal.caller,
          durationSeconds: 0,
          isMicMuted: false,
          isVideoOff: false,
          isSpeakerOn: signal.callType === 'video',
        };

        this.notify();
        this.startWebRingtone(true);
        triggerHaptic('heavy');
        break;
      }

      case 'accept': {
        if (this.currentCall && (this.currentCall.callId === signal.callId || this.currentCall.status === 'outgoing')) {
          this.stopWebRingtone();
          this.currentCall.status = 'connected';
          this.startTimer();
          this.notify();

          if (isAndroidApp()) {
            NativeBridgeClient.acceptCall(this.currentCall.callId);
          }

          // Connect caller to ZEGOCLOUD Room
          await this.connectZegoRtc(this.currentCall.callId, this.currentCall.type);
        }
        break;
      }

      case 'reject': {
        if (this.currentCall && (this.currentCall.callId === signal.callId || this.currentCall.status === 'outgoing')) {
          if (isAndroidApp()) {
            NativeBridgeClient.rejectCall(this.currentCall.callId);
          }
          this.endCallInternal('rejected');
        }
        break;
      }

      case 'end': {
        if (this.currentCall) {
          if (isAndroidApp()) {
            NativeBridgeClient.endCall(this.currentCall.callId);
          }
          this.endCallInternal('ended');
        }
        break;
      }
    }
  }

  private async sendSignal(targetUserId: string, data: any): Promise<boolean> {
    try {
      const channelName = `calling_signaling_${targetUserId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const channel = supabase.channel(channelName);

      return await new Promise<boolean>((resolve) => {
        let finished = false;
        const cleanup = () => {
          if (!finished) {
            finished = true;
            try {
              supabase.removeChannel(channel);
            } catch (e) {}
          }
        };

        const timer = setTimeout(() => {
          cleanup();
          resolve(false);
        }, 5000);

        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            try {
              const res = await channel.send({
                type: 'broadcast',
                event: 'call_signal',
                payload: data,
              });
              clearTimeout(timer);
              setTimeout(cleanup, 1000);
              resolve(res === 'ok');
            } catch (err) {
              clearTimeout(timer);
              cleanup();
              resolve(false);
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(timer);
            cleanup();
            resolve(false);
          }
        });
      });
    } catch (e) {
      console.warn('Signaling send failed:', e);
      return false;
    }
  }

  private startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (this.currentCall && this.currentCall.status === 'connected') {
        this.currentCall.durationSeconds++;
        this.notify();
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}

export const CallManagerService = new WebCallService();
