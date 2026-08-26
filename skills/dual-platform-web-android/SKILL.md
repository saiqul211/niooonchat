---
name: dual-platform-web-android
description: Professional Dual-Platform Web + Android Development Agent Skill ensuring synchronized, modular, and capability-driven development for both Web and Native Android (Kotlin) environments.
---

# Professional Dual-Platform Web + Android Development Agent Skill

## Skill Identity
You are simultaneously a **Web Application Engineer** and an **Android Application Engineer**.
Every task in this project develops a unified product delivered across two distinct platforms:
1. **Web Application (`src/`)**: Primary UI, real-time messaging, business logic, routing, and responsive presentation.
2. **Android Application (`android/`)**: Native Kotlin application shell (`MainActivity.kt`, `bridge/`, `web/`, `features/`) loading the hosted/local web app via high-performance WebView while handling native system integrations.

---

## 1. Core Architecture Matrix

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

---

## 2. Six-Dimensional Task Impact Analysis

Before any code modification, always evaluate:
1. **Web Impact?** (`src/`)
2. **Android Impact?** (`android/`)
3. **Bridge Contract Impact?** (`BridgeCapabilities`, `AndroidBridge`, `src/lib/bridge/`)
4. **Native-Only Requirement?** (Biometrics, System DownloadManager, Native Camera, System Share)
5. **Browser Fallback Required?** (Graceful fallback when running in standard browsers)
6. **Regression & Compatibility?** (Backward compatibility for existing Android APK releases)

### Three Execution Pathways:
- **Case A (Web-Only)**: Pure UI layout, web animation, web-specific styling. Android requires 0 edits.
- **Case B (Dual-Platform / Bridge)**: New native capability (e.g. file downloader, haptics, permissions, push notification routes). Updates both `src/lib/bridge/` and `android/app/src/main/java/com/niooon/chat/bridge/`.
- **Case C (Android-Only)**: Native lifecycle, Android splash, ProGuard, Gradle dependencies, AndroidManifest permissions.

---

## 3. Web ↔ Android Bridge Architecture

### Android Kotlin Package Layout (`android/app/src/main/java/com/niooon/chat/`)
- `bridge/`
  - `NativeBridge.kt`: JavaScript interface `@JavascriptInterface` entry point.
  - `BridgeRouter.kt`: Handles capability dispatch, authorization, and async responses.
  - `BridgeResponse.kt`: Unified JSON response contracts.
  - `BridgeCapabilities.kt`: Capability registry (`v1`).
- `web/`
  - `WebViewManager.kt`: WebView settings, security headers, WebChromeClient, WebViewClient.
  - `WebEnvironment.kt`: Runtime identification (`ANDROID_APP` vs `WEB_BROWSER`).
  - `WebUrlManager.kt`: Environment URLs (Dev, Staging, Production, Fallback).
- `features/`
  - `camera/`: Native camera & photo capture helpers.
  - `downloads/`: Android `DownloadManager` integration.
  - `notifications/`: AndroidX NotificationChannel & status bar toasts.
  - `sharing/`: Native Android system share intent chooser.
  - `haptics/`: Vibrator & VibratorManager engine.
  - `network/`: `ConnectivityManager` network listener.
- `MainActivity.kt`: Activity lifecycle synchronization and hardware back navigation.

### Web Bridge Client Layout (`src/lib/bridge/`)
- `types.ts`: TypeScript contracts for capabilities, runtime info, and bridge events.
- `runtime.ts`: Environment detection (`isAndroidApp()`, `getPlatformInfo()`, `hasCapability()`).
- `bridge.ts`: Client methods with automatic Web API fallbacks.
- `events.ts`: Two-way event emitter between Android and Web JavaScript.

---

## 4. Capability Registry (`v1`)
| Capability | Android Native Execution | Web Browser Fallback |
|---|---|---|
| `haptics` | `Vibrator` / `VibrationEffect` | `navigator.vibrate` |
| `share` | `Intent.ACTION_SEND` (Chooser) | `navigator.share` / Clipboard copy |
| `downloads` | Android `DownloadManager` | `<a>` download attribute |
| `filePicker` | `WebChromeClient.onShowFileChooser` | `<input type="file">` |
| `network` | `NetworkCapabilities.NET_CAPABILITY_INTERNET` | `navigator.onLine` / `online` event |
| `statusBar` | `WindowInsetsControllerCompat` | Meta `theme-color` |
| `appReady` | Dismiss native splash / loading overlay | Immediate render |
| `backHandler` | `OnBackPressedDispatcher` → Web router | Browser `popstate` / `history.back()` |

---

## 5. Master Development Checklist
- [ ] Understand user requirement.
- [ ] Perform 6D Impact Analysis.
- [ ] Implement Web side in `src/`.
- [ ] Implement Android side in `android/` if required.
- [ ] Update Bridge contracts and event handlers if required.
- [ ] Ensure browser fallbacks function seamlessly without errors.
- [ ] Maintain Strict Dark Mode (`#000000` / `bg-neutral-950`).
- [ ] Run linter and compile applet to verify build integrity.
- [ ] Update `.ai/` documentation to reflect the latest state.
