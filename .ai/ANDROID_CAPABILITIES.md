# Android Native Capabilities Registry

## Capability Matrix

| Capability Name | Android Native Implementation | Web Browser Fallback |
|---|---|---|
| `haptics` | `Vibrator` / `VibrationEffect` | `navigator.vibrate` |
| `share` | `Intent.ACTION_SEND` (Chooser) | `navigator.share` / Clipboard write |
| `downloads` | Android `DownloadManager` | Browser direct download (`<a>` tag) |
| `filePicker` | `WebChromeClient.onShowFileChooser` | `<input type="file">` |
| `camera` | Camera capture via `FileProvider` | Browser `getUserMedia` / file capture |
| `network` | `NetworkCapabilities.NET_CAPABILITY_INTERNET` | `navigator.onLine` |
| `statusBar` | `WindowInsetsControllerCompat` | Meta `theme-color` |
| `notifications` | AndroidX Notification Channels | Web `Notification.requestPermission()` |
| `toast` | Android `Toast.makeText` | UI toast components |
| `appLifecycle` | Activity `onResume` / `onPause` | `visibilitychange` event |
| `calling` | `CallActivity` + `CallManager` + `AudioManager` | `WebCallOverlay` + `MediaStream` + Web Audio Ringers |
