import { supabase } from './supabase';
import { NativeBridgeClient } from './bridge/bridge';
import { isAndroidApp } from './bridge/runtime';
import { triggerHaptic } from './native';

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
  private ringtoneOscillator: any = null;
  private ringtoneGain: any = null;
  private isRinging: boolean = false;
  private subscription: any = null;
  private peerConnection: RTCPeerConnection | null = null;
  private currentUserId: string | null = null;
  private currentUserProfile: CallParticipant | null = null;

  init(userId: string, userProfile: CallParticipant) {
    this.currentUserId = userId;
    this.currentUserProfile = userProfile;

    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    // Subscribe to calling signaling channel
    this.subscription = supabase
      .channel(`calling_signaling_${userId}`)
      .on('broadcast', { event: 'call_signal' }, (payload: any) => {
        this.handleIncomingSignal(payload.payload);
      })
      .subscribe();
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

  // --- CALL INITIATION ---
  async startCall(target: CallParticipant, type: CallType = 'audio') {
    const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Android Native Execution
    if (isAndroidApp()) {
      if (type === 'audio') {
        NativeBridgeClient.startAudioCall(target.id, target.fullName, target.username, target.avatarUrl);
      } else {
        NativeBridgeClient.startVideoCall(target.id, target.fullName, target.username, target.avatarUrl);
      }

      // Signal target via Supabase
      this.sendSignal(target.id, {
        type: 'invite',
        callId,
        callType: type,
        caller: this.currentUserProfile,
      });
      return;
    }

    // 2. Web Browser Calling Execution
    let localStream: MediaStream | undefined;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
    } catch (e) {
      console.warn('Could not access media devices:', e);
    }

    this.currentCall = {
      callId,
      type,
      status: 'outgoing',
      isIncoming: false,
      participant: target,
      durationSeconds: 0,
      isMicMuted: false,
      isVideoOff: false,
      isSpeakerOn: true,
      localStream,
    };

    this.notify();
    this.startWebRingtone(false);

    // Send invitation signal to recipient
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

    this.stopWebRingtone();
    triggerHaptic('medium');

    if (isAndroidApp()) {
      NativeBridgeClient.acceptCall(this.currentCall.callId);
      this.sendSignal(this.currentCall.participant.id, {
        type: 'accept',
        callId: this.currentCall.callId,
      });
      return;
    }

    let localStream = this.currentCall.localStream;
    if (!localStream) {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: this.currentCall.type === 'video',
        });
      } catch (e) {
        console.warn('Failed to get media devices on accept:', e);
      }
    }

    this.currentCall.status = 'connected';
    this.currentCall.localStream = localStream;
    this.startTimer();
    this.notify();

    await this.sendSignal(this.currentCall.participant.id, {
      type: 'accept',
      callId: this.currentCall.callId,
    });
  }

  // --- REJECT CALL ---
  async rejectCall() {
    if (!this.currentCall) return;

    this.stopWebRingtone();
    triggerHaptic('light');

    if (isAndroidApp()) {
      NativeBridgeClient.rejectCall(this.currentCall.callId);
    }

    await this.sendSignal(this.currentCall.participant.id, {
      type: 'reject',
      callId: this.currentCall.callId,
    });

    this.endCallInternal('rejected');
  }

  // --- END CALL ---
  async endCall() {
    if (!this.currentCall) return;

    this.stopWebRingtone();
    triggerHaptic('light');

    if (isAndroidApp()) {
      NativeBridgeClient.endCall(this.currentCall.callId);
    }

    await this.sendSignal(this.currentCall.participant.id, {
      type: 'end',
      callId: this.currentCall.callId,
    });

    this.endCallInternal('ended');
  }

  private endCallInternal(status: CallStatus = 'ended') {
    this.stopWebRingtone();
    this.stopTimer();

    if (this.currentCall?.localStream) {
      this.currentCall.localStream.getTracks().forEach(t => t.stop());
    }

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

    if (this.currentCall.localStream) {
      this.currentCall.localStream.getAudioTracks().forEach(track => {
        track.enabled = !newState;
      });
    }

    this.notify();
    return newState;
  }

  toggleVideo(): boolean {
    if (!this.currentCall) return false;
    const newState = !this.currentCall.isVideoOff;
    this.currentCall.isVideoOff = newState;

    if (this.currentCall.localStream) {
      this.currentCall.localStream.getVideoTracks().forEach(track => {
        track.enabled = !newState;
      });
    }

    this.notify();
    return newState;
  }

  // --- SIGNALING HANDLER ---
  private handleIncomingSignal(signal: any) {
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

        // If Android App: Bridge to Native UI
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
          isSpeakerOn: true,
        };

        this.notify();
        this.startWebRingtone(true);
        triggerHaptic('heavy');
        break;
      }

      case 'accept': {
        if (this.currentCall && this.currentCall.callId === signal.callId) {
          this.stopWebRingtone();
          this.currentCall.status = 'connected';
          this.startTimer();
          this.notify();
        }
        break;
      }

      case 'reject': {
        if (this.currentCall && this.currentCall.callId === signal.callId) {
          this.endCallInternal('rejected');
        }
        break;
      }

      case 'end': {
        if (this.currentCall && this.currentCall.callId === signal.callId) {
          this.endCallInternal('ended');
        }
        break;
      }
    }
  }

  private async sendSignal(targetUserId: string, data: any) {
    try {
      const channel = supabase.channel(`calling_signaling_${targetUserId}`);
      await channel.subscribe();
      await channel.send({
        type: 'broadcast',
        event: 'call_signal',
        payload: data,
      });
      setTimeout(() => channel.unsubscribe(), 5000);
    } catch (e) {
      console.warn('Signaling send failed:', e);
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
