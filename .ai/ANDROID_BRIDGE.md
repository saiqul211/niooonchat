# Web ↔ Android Bridge API Contract (Version 1)

## 1. Overview
The bridge connects JavaScript in the WebView with native Kotlin Android APIs safely and asynchronously.

## 2. API Contract Specification

| Method | Parameters | Return Type | Description |
|---|---|---|---|
| `getRuntimeInfo()` | None | `JSON String` | Returns `{ platform, runtime, appVersion, bridgeVersion, capabilities }` |
| `hasCapability(name)` | `name: string` | `boolean` | Checks if a native feature is available |
| `hapticFeedback(type)` | `type: 'light'\|'medium'\|'heavy'\|'selection'` | `void` | Triggers native physical vibration |
| `vibrate(ms)` | `durationMs: Long` | `void` | Custom vibration duration |
| `isNetworkAvailable()` | None | `boolean` | Returns real-time connectivity status |
| `showToast(msg)` | `message: string` | `void` | Displays native Android Toast |
| `shareText(title, text)` | `title, text: string` | `JSON String` | Triggers native Android system share sheet |
| `setStatusBarColor(hex, darkIcons)`| `colorHex, darkIcons` | `JSON String` | Dynamically updates native status bar |
| `startDownload(url, mime)`| `url, mimeType` | `JSON String` | Enqueues background download in `DownloadManager` |
| `onAppReady()` | None | `void` | Signals web completion to dismiss native splash |

## 3. Two-Way Event Bus
- **Android → Web**:
  - `native:networkChanged`: `{ isConnected: boolean }`
  - `native:lifecycle`: `{ state: 'resumed' | 'paused' }`
- **Web → Android**:
  - `window.__onAndroidBackPress`: Global function evaluated on hardware back press before WebView history.
