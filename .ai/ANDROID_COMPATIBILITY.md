# Android Version & Environment Compatibility

## 1. SDK Version Constraints
- **minSdkVersion**: 24 (Android 7.0 Nougat) — covers 99%+ of active Android devices worldwide.
- **targetSdkVersion**: 35 (Android 15) — fully compliant with Google Play target API mandates.
- **compileSdkVersion**: 35 (Android 15).

## 2. Backward Compatibility Matrix
- **Android 12+ (API 31+)**: Uses `VibratorManager` for multi-profile haptics; fallback to `Vibrator` on older devices.
- **Android 13+ (API 33+)**: Declares granular media permissions (`READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `READ_MEDIA_AUDIO`) and `POST_NOTIFICATIONS`.
- **Android 10 & below**: Declares `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` safely with `maxSdkVersion` constraints.
- **Strict Dark System UI**: Managed dynamically with `WindowInsetsControllerCompat` to support all Android versions cleanly without deprecated window flags.
