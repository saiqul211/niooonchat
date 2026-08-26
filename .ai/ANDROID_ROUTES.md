# Android Routing & Deep Linking

## 1. Deep Link Schemes
The Android app is configured in `AndroidManifest.xml` with multiple intent filters:

1. **Custom Scheme**:
   - `niooonchat://chat/:username`
   - `niooonchat://search`
   - `niooonchat://profile`

2. **Web Domain Universal Links (AutoVerify)**:
   - `https://niooonchat.vercel.app/*`
   - `https://ais-pre-d4dy6vpbz3am3xqgrt7eqq-851050457135.asia-southeast1.run.app/*`

## 2. Route Dispatching
When an intent is received, `WebUrlManager.sanitizeTargetUrl` converts custom schemes to the matching web route and passes it directly to `WebView.loadUrl()`.
