/**
 * Web ↔ Android Dual-Platform Bridge Types and Contracts (v1)
 */

export type PlatformType = 'web' | 'android' | 'ios' | 'desktop';
export type RuntimeEnvironment = 'web-browser' | 'native-webview';

export type NativeCapability =
  | 'haptics'
  | 'share'
  | 'downloads'
  | 'camera'
  | 'filePicker'
  | 'network'
  | 'statusBar'
  | 'notifications'
  | 'toast'
  | 'appLifecycle';

export interface RuntimeInfo {
  platform: PlatformType;
  runtime: RuntimeEnvironment;
  appVersion: string;
  bridgeVersion: number;
  androidApiLevel?: number;
  capabilities: NativeCapability[];
}

export interface BridgeResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  capability?: string;
  version: number;
}

export interface NativeBridgeGlobal {
  getRuntimeInfo?: () => string;
  hasCapability?: (capability: string) => boolean;
  vibrate?: (ms: number) => void;
  hapticFeedback?: (type: string) => void;
  isNetworkAvailable?: () => boolean;
  showToast?: (message: string) => void;
  onAppReady?: () => void;
  shareText?: (title: string, text: string) => string;
  setStatusBarColor?: (colorHex: string, darkIcons: boolean) => string;
  startDownload?: (url: string, mimeType?: string) => string;
}

declare global {
  interface Window {
    AndroidBridge?: NativeBridgeGlobal;
    __onAndroidBackPress?: () => boolean;
  }
}
