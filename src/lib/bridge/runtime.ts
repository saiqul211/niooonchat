import { NativeCapability, RuntimeInfo } from './types';

/**
 * Environment & Platform Detection
 */
export const isAndroidApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.AndroidBridge ||
    (typeof navigator !== 'undefined' && /NiooonChatApp|Android.*wv/i.test(navigator.userAgent))
  );
};

export const getRuntimeInfo = (): RuntimeInfo => {
  if (typeof window === 'undefined') {
    return {
      platform: 'web',
      runtime: 'web-browser',
      appVersion: '1.0.0',
      bridgeVersion: 1,
      capabilities: [],
    };
  }

  // 1. Try reading from Native AndroidBridge
  if (window.AndroidBridge?.getRuntimeInfo) {
    try {
      const raw = window.AndroidBridge.getRuntimeInfo();
      const parsed = JSON.parse(raw);
      return {
        platform: parsed.platform || 'android',
        runtime: parsed.runtime || 'native-webview',
        appVersion: parsed.appVersion || '1.0.0',
        bridgeVersion: parsed.bridgeVersion || 1,
        androidApiLevel: parsed.androidApiLevel,
        capabilities: parsed.capabilities || [],
      };
    } catch (e) {
      console.warn('Failed parsing native runtime info:', e);
    }
  }

  // 2. Default Browser Runtime
  const browserCapabilities: NativeCapability[] = [];
  if (typeof navigator !== 'undefined') {
    if ('vibrate' in navigator) browserCapabilities.push('haptics');
    if ('share' in navigator) browserCapabilities.push('share');
    if ('onLine' in navigator) browserCapabilities.push('network');
  }

  return {
    platform: 'web',
    runtime: 'web-browser',
    appVersion: '1.0.0',
    bridgeVersion: 1,
    capabilities: browserCapabilities,
  };
};

export const hasCapability = (capability: NativeCapability): boolean => {
  if (typeof window === 'undefined') return false;

  // Query Native Android Bridge if present
  if (window.AndroidBridge?.hasCapability) {
    try {
      return window.AndroidBridge.hasCapability(capability);
    } catch (e) {
      // Fallback
    }
  }

  const runtime = getRuntimeInfo();
  return runtime.capabilities.includes(capability);
};
