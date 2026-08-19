import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { PushNotifications } from '@capacitor/push-notifications';
import { Network } from '@capacitor/network';

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Initializes Native Android features (Status Bar, Splash Screen, Push Notifications)
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
      await SplashScreen.hide({
        fadeOutDuration: 400,
      });
    }, 600);
  } catch (e) {
    console.warn('SplashScreen hide warning:', e);
  }

  try {
    // 3. Setup Push Notifications
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive === 'granted') {
      await PushNotifications.register();
      
      // Listener for registration token
      PushNotifications.addListener('registration', (token) => {
        console.log('FCM Registration Token:', token.value);
      });

      // Listener for push messages received
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push Received:', notification);
      });
    }
  } catch (e) {
    console.warn('PushNotification init warning:', e);
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
      if (canGoBack) {
        window.history.back();
      } else {
        CapApp.exitApp();
      }
    }
  });

  return () => {
    listenerPromise.then(handle => handle.remove());
  };
};

/**
 * Check Network Connectivity Status
 */
export const getNetworkStatus = async (): Promise<boolean> => {
  if (isNativePlatform()) {
    const status = await Network.getStatus();
    return status.connected;
  }
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};
