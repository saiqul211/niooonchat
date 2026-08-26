import { NativeBridgeClient } from './bridge/bridge';
import { isAndroidApp, getRuntimeInfo, hasCapability } from './bridge/runtime';
import { subscribeToNativeEvent } from './bridge/events';

export * from './bridge/types';
export * from './bridge/runtime';
export * from './bridge/events';
export * from './bridge/bridge';

/**
 * Returns true if running inside the Native Android App
 */
export const isNativePlatform = (): boolean => {
  return isAndroidApp();
};

/**
 * Initializes Native Android features (Status Bar, Native Splash Dismissal, Safe Notification Prompts)
 */
export const initNativeFeatures = async () => {
  NativeBridgeClient.notifyAppReady();
  NativeBridgeClient.setStatusBarColor('#000000', false);

  try {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  } catch (e) {
    // Safe catch
  }
};

/**
 * Trigger Haptic Vibration Feedback
 */
export const triggerHaptic = async (type: 'light' | 'medium' | 'heavy' | 'selection' = 'light') => {
  NativeBridgeClient.triggerHaptic(type);
};

/**
 * Native Hardware Back Button Handler
 */
export const registerBackHandler = (handleBack: () => boolean) => {
  return NativeBridgeClient.registerBackHandler(handleBack);
};

/**
 * Check Network Connectivity Status
 */
export const getNetworkStatus = async (): Promise<boolean> => {
  return NativeBridgeClient.isNetworkAvailable();
};
