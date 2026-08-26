# Niooon Chat Native Android Architecture

## 1. High-Level System Architecture
Niooon Chat is engineered as a unified dual-platform product:
- **Web Application (`src/`)**: React, Tailwind CSS, TypeScript, Supabase Realtime, and strict dark mode UX.
- **Android Application (`android/`)**: Native Kotlin application shell built with AndroidX, Material3/MaterialComponents, WebKit, and high-performance WebView loading the hosted web client with deep system capability integration.

```
                    PROJECT ROOT
                         │
              ┌──────────┴──────────┐
              │                     │
              ↓                     ↓
          WEB APP                ANDROID APP
      (React + Tailwind)     (Pure Kotlin + AndroidX)
              │                     │
              │             Native Bridge & WebView
              │                     │
              └────────────┬────────┘
                           ↓
                    Hosted Web URL
                           │
                           ↓
                    Web Experience
```

## 2. Directory Structure (`android/app/src/main/java/com/niooon/chat/`)
- `bridge/`:
  - `NativeBridge.kt`: JavaScript Interface (`window.AndroidBridge`) exposing versioned endpoints.
  - `BridgeRouter.kt`: Handles capability dispatching, validation, error wrapping, and responses.
  - `BridgeResponse.kt`: Unified JSON payload contract.
  - `BridgeCapabilities.kt`: Capability registry and discovery.
- `web/`:
  - `WebViewManager.kt`: Configures WebSettings, WebChromeClient (file choosers, WebRTC media), and WebViewClient.
  - `WebEnvironment.kt`: Exposes platform metadata and API level.
  - `WebUrlManager.kt`: Centralized endpoint router (live URL, fallbacks, deep links).
- `features/`:
  - `haptics/HapticHelper.kt`: Vibrator and VibratorManager feedback.
  - `sharing/ShareHelper.kt`: Android Intent chooser.
  - `downloads/DownloadHelper.kt`: Android `DownloadManager` background downloader.
  - `network/NetworkMonitor.kt`: `ConnectivityManager` real-time listener.
- `MainActivity.kt`: Lifecycle coordination and hardware back navigation.
