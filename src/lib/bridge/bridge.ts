import { hasCapability, isAndroidApp } from './runtime';

/**
 * Dual-Platform Client API with Automatic Web Browser Fallbacks
 */
export const NativeBridgeClient = {
  /**
   * Signal to native host that the React/Web application has finished rendering
   */
  notifyAppReady: () => {
    if (typeof window !== 'undefined' && window.AndroidBridge?.onAppReady) {
      try {
        window.AndroidBridge.onAppReady();
      } catch (e) {
        // Safe catch
      }
    }
  },

  /**
   * Update Status Bar Color
   */
  setStatusBarColor: (colorHex: string = '#000000', darkIcons: boolean = false) => {
    if (typeof window === 'undefined') return;

    if (window.AndroidBridge?.setStatusBarColor) {
      try {
        window.AndroidBridge.setStatusBarColor(colorHex, darkIcons);
      } catch (e) {
        // Fallback
      }
    }

    // Web Meta theme-color update
    try {
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', colorHex);
    } catch (e) {
      // Safe catch
    }
  },

  /**
   * Haptic vibration feedback
   */
  triggerHaptic: (type: 'light' | 'medium' | 'heavy' | 'selection' = 'light') => {
    if (typeof window === 'undefined') return;

    // 1. Android Bridge
    if (window.AndroidBridge?.hapticFeedback) {
      try {
        window.AndroidBridge.hapticFeedback(type);
        return;
      } catch (e) {
        // Fallback
      }
    }

    // 2. Web Vibration API fallback
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        const ms = type === 'heavy' ? 40 : type === 'medium' ? 25 : type === 'selection' ? 10 : 15;
        navigator.vibrate(ms);
      }
    } catch (e) {
      // Ignored
    }
  },

  /**
   * Share text or links
   */
  shareText: async (title: string, text: string): Promise<boolean> => {
    if (typeof window === 'undefined') return false;

    // 1. Android Native Share Sheet
    if (window.AndroidBridge?.shareText) {
      try {
        window.AndroidBridge.shareText(title, text);
        return true;
      } catch (e) {
        // Fallback
      }
    }

    // 2. Web Share API
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text });
        return true;
      } catch (e) {
        // User cancelled or unsupported
      }
    }

    // 3. Clipboard fallback
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      // Fallback
    }

    return false;
  },

  /**
   * Check Network Connectivity
   */
  isNetworkAvailable: (): boolean => {
    if (typeof window !== 'undefined' && window.AndroidBridge?.isNetworkAvailable) {
      try {
        return window.AndroidBridge.isNetworkAvailable();
      } catch (e) {
        // Fallback
      }
    }
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  /**
   * Show native Android toast or standard web notification
   */
  showToast: (message: string) => {
    if (typeof window === 'undefined') return;

    if (window.AndroidBridge?.showToast) {
      try {
        window.AndroidBridge.showToast(message);
        return;
      } catch (e) {
        // Fallback
      }
    }
  },

  /**
   * Register Hardware Back Navigation Listener
   */
  registerBackHandler: (handleBack: () => boolean): (() => void) => {
    if (typeof window === 'undefined') return () => {};

    window.__onAndroidBackPress = handleBack;

    const onPopState = () => {
      handleBack();
    };
    window.addEventListener('popstate', onPopState);

    return () => {
      if (window.__onAndroidBackPress === handleBack) {
        window.__onAndroidBackPress = undefined;
      }
      window.removeEventListener('popstate', onPopState);
    };
  },
};
