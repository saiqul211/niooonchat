# Android WebView Configuration & Security

## 1. WebView Engine Configuration
- **JavaScript**: Enabled (`setJavaScriptEnabled(true)`).
- **DOM Storage**: Enabled (`setDomStorageEnabled(true)`).
- **Database Storage**: Enabled (`setDatabaseEnabled(true)`).
- **Hardware Acceleration**: Enabled via `android:hardwareAccelerated="true"`.
- **Viewport**: Wide viewport and overview mode enabled for responsive scaling.
- **Mixed Content**: Configured safely for HTTPS resources.
- **Custom User-Agent**: `NiooonChatApp/1.0.0 (Native Android Kotlin)`.

## 2. Chrome & Media Handling
- **WebRTC Audio/Video Calls**: Granted via `WebChromeClient.onPermissionRequest`.
- **File Chooser & Camera Capture**: Integrated via `WebChromeClient.onShowFileChooser` using `FileProvider` (`content://com.niooon.chat.fileprovider/`).
- **Progress Indicator**: Real-time progress synchronized with top progress bar and full loading splash.

## 3. Security & Domain Controls
- Navigation is strictly controlled.
- External schemas (`tel:`, `mailto:`, `sms:`, `intent:`, `whatsapp:`) are handed over to Android intent resolution safely without exposing the WebView.
