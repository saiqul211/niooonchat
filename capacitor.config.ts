import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.niooon.chat',
  appName: 'Niooon Chat',
  webDir: 'dist',
  server: {
    url: 'https://niooonchat.vercel.app',
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: [
      'niooonchat.vercel.app',
      '*.vercel.app',
      '*.supabase.co',
      '*.supabase.in',
      '*',
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#000000',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
    App: {
      // Hardware back button behavior handled in React app stack
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
