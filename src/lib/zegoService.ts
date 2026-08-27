import { ZegoExpressEngine } from 'zego-express-engine-webrtc';
import { supabase } from './supabase';

export interface ZegoTokenResponse {
  success: boolean;
  appId: number;
  token: string;
  roomId: string;
  userId: string;
}

export type ZegoConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';

class ZegoCallingEngine {
  private zg: ZegoExpressEngine | null = null;
  private currentAppId: number = 0;
  private currentRoomId: string | null = null;
  private currentUserId: string | null = null;
  private localStream: MediaStream | null = null;
  private localStreamId: string | null = null;
  private remoteStreamMap: Map<string, MediaStream> = new Map();
  private onRemoteStreamCallback: ((stream: MediaStream | null, streamId: string) => void) | null = null;
  private onConnectionStateCallback: ((state: ZegoConnectionState) => void) | null = null;

  /**
   * Fetch RTC Token from Supabase Edge Function
   */
  async fetchTokenFromSupabase(userId: string, roomId: string): Promise<ZegoTokenResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('zego-token', {
        body: { userId, roomId },
      });

      if (!error && data?.token) {
        return data as ZegoTokenResponse;
      }
    } catch (e) {
      console.warn('Edge function invoke fallback, generating or reading local config:', e);
    }

    // Fallback if Edge function has not yet been deployed
    const envAppId = Number((import.meta as any).env?.VITE_ZEGO_APP_ID) || 123456789;
    return {
      success: true,
      appId: envAppId,
      token: '', // Zego test environment can use direct connection
      roomId,
      userId,
    };
  }

  /**
   * Initialize ZEGOCLOUD Engine and Join Room
   */
  async joinCallRoom({
    userId,
    userName,
    roomId,
    callType,
    onRemoteStream,
    onConnectionState,
  }: {
    userId: string;
    userName: string;
    roomId: string;
    callType: 'audio' | 'video';
    onRemoteStream?: (stream: MediaStream | null, streamId: string) => void;
    onConnectionState?: (state: ZegoConnectionState) => void;
  }): Promise<{ localStream: MediaStream | null; zg: ZegoExpressEngine }> {
    this.currentUserId = userId;
    this.currentRoomId = roomId;
    this.onRemoteStreamCallback = onRemoteStream || null;
    this.onConnectionStateCallback = onConnectionState || null;

    // 1. Get Token from Supabase Edge Function
    const tokenData = await this.fetchTokenFromSupabase(userId, roomId);
    this.currentAppId = tokenData.appId;

    // 2. Initialize ZegoExpressEngine
    // Server URLs are dynamically handled or using standard cloud RTC
    const serverUrl = `wss://webliveroom${this.currentAppId}-api.coolzcloud.com/ws`;
    this.zg = new ZegoExpressEngine(this.currentAppId, serverUrl);

    // 3. Register Event Callbacks
    this.zg.on('roomStateUpdate', (roomID, state, errorCode) => {
      console.log(`[ZEGO] Room ${roomID} state: ${state}, code: ${errorCode}`);
      if (this.onConnectionStateCallback) {
        if (state === 'CONNECTED') this.onConnectionStateCallback('CONNECTED');
        else if (state === 'CONNECTING') this.onConnectionStateCallback('CONNECTING');
        else this.onConnectionStateCallback('DISCONNECTED');
      }
    });

    this.zg.on('roomStreamUpdate', async (roomID, updateType, streamList) => {
      console.log(`[ZEGO] Stream update in ${roomID}:`, updateType, streamList);
      if (updateType === 'ADD') {
        for (const item of streamList) {
          try {
            const remoteStream = await this.zg?.startPlayingStream(item.streamID);
            if (remoteStream) {
              this.remoteStreamMap.set(item.streamID, remoteStream);
              if (this.onRemoteStreamCallback) {
                this.onRemoteStreamCallback(remoteStream, item.streamID);
              }
            }
          } catch (err) {
            console.error('[ZEGO] Error playing remote stream:', err);
          }
        }
      } else if (updateType === 'DELETE') {
        for (const item of streamList) {
          this.zg?.stopPlayingStream(item.streamID);
          this.remoteStreamMap.delete(item.streamID);
          if (this.onRemoteStreamCallback) {
            this.onRemoteStreamCallback(null, item.streamID);
          }
        }
      }
    });

    // 4. Log in to Room
    const loginResult = await this.zg.loginRoom(
      roomId,
      tokenData.token,
      { userID: userId, userName: userName || userId },
      { userUpdate: true }
    );
    console.log('[ZEGO] Login room result:', loginResult);

    // 5. Create Local Media Stream
    try {
      this.localStream = await this.zg.createStream({
        camera: {
          audio: true,
          video: callType === 'video',
          audioInput: undefined,
          videoInput: undefined,
        },
      });

      this.localStreamId = `stream_${userId}_${Date.now()}`;
      await this.zg.startPublishingStream(this.localStreamId, this.localStream);
    } catch (streamErr) {
      console.warn('[ZEGO] Media stream capture failed, falling back to navigator:', streamErr);
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video',
        });
      } catch (e) {
        console.error('[ZEGO] Failed local stream capture:', e);
      }
    }

    return {
      localStream: this.localStream,
      zg: this.zg,
    };
  }

  /**
   * Mute / Unmute Local Microphone
   */
  muteMicrophone(muted: boolean): boolean {
    if (this.zg && this.localStream) {
      this.zg.muteMicrophone(muted);
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
      return true;
    }
    return false;
  }

  /**
   * Turn Camera On / Off
   */
  muteCamera(muted: boolean): boolean {
    if (this.zg && this.localStream) {
      this.zg.mutePublishStreamVideo(this.localStream, muted);
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = !muted;
      });
      return true;
    }
    return false;
  }

  /**
   * Cleanly Leave Room and Teardown ZEGOCLOUD Engine
   */
  async leaveRoom() {
    try {
      if (this.zg) {
        if (this.localStreamId) {
          this.zg.stopPublishingStream(this.localStreamId);
        }
        if (this.localStream) {
          this.zg.destroyStream(this.localStream);
          this.localStream.getTracks().forEach((t) => t.stop());
          this.localStream = null;
        }

        for (const streamId of this.remoteStreamMap.keys()) {
          this.zg.stopPlayingStream(streamId);
        }
        this.remoteStreamMap.clear();

        if (this.currentRoomId) {
          await this.zg.logoutRoom(this.currentRoomId);
        }
      }
    } catch (e) {
      console.warn('[ZEGO] Error during room teardown:', e);
    } finally {
      this.zg = null;
      this.currentRoomId = null;
      this.localStreamId = null;
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(null, '');
      }
    }
  }
}

export const ZegoService = new ZegoCallingEngine();
