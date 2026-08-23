import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Network } from '@capacitor/network';

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Initializes Native Android features (Status Bar, Splash Screen, Safe Notifications)
 */
export const initNativeFeatures = async () => {
  if (!isNativePlatform()) return;

  try {
    // 1. Configure Status Bar
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#000000' });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (e) {
    console.warn('StatusBar init warning:', e);
  }

  try {
    // 2. Hide Splash Screen after web app is loaded
    setTimeout(async () => {
      try {
        await SplashScreen.hide({
          fadeOutDuration: 300,
        });
      } catch (err) {
        // Safe catch
      }
    }, 400);
  } catch (e) {
    console.warn('SplashScreen hide warning:', e);
  }

  try {
    // 3. Request standard notification permissions if supported
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  } catch (e) {
    // Safe catch
  }
};

/**
 * Trigger Haptic Vibration Feedback
 */
export const triggerHaptic = async (type: 'light' | 'medium' | 'heavy' | 'selection' = 'light') => {
  if (!isNativePlatform()) return;

  try {
    switch (type) {
      case 'medium':
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;
      case 'heavy':
        await Haptics.impact({ style: ImpactStyle.Heavy });
        break;
      case 'selection':
        await Haptics.selectionStart();
        break;
      case 'light':
      default:
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
    }
  } catch (e) {
    // Silent catch on unsupported devices
  }
};

/**
 * Native Hardware Back Button Handler
 */
export const registerBackHandler = (handleBack: () => boolean) => {
  if (!isNativePlatform()) return () => {};

  const listenerPromise = CapApp.addListener('backButton', ({ canGoBack }) => {
    const handled = handleBack();
    if (!handled) {
      if (canGoBack && window.history.length > 1) {
        window.history.back();
      } else {
        CapApp.exitApp();
      }
    }
  });

  return () => {
    listenerPromise.then(handle => handle.remove()).catch(() => {});
  };
};

/**
 * Check Network Connectivity Status
 */
export const getNetworkStatus = async (): Promise<boolean> => {
  if (isNativePlatform()) {
    try {
      const status = await Network.getStatus();
      return status.connected;
    } catch (e) {
      return typeof navigator !== 'undefined' ? navigator.onLine : true;
    }
  }
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};
