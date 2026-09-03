package com.niooon.chat.bridge

import android.webkit.JavascriptInterface

/**
 * Exposed JavaScript Interface Object available as `window.AndroidBridge` in the WebView
 */
class NativeBridge(private val router: BridgeRouter) {

    @JavascriptInterface
    fun getRuntimeInfo(): String {
        return router.handleGetRuntimeInfo()
    }

    @JavascriptInterface
    fun hasCapability(capability: String): Boolean {
        return BridgeCapabilities.hasCapability(capability)
    }

    @JavascriptInterface
    fun vibrate(durationMs: Long) {
        router.handleVibrate(durationMs)
    }

    @JavascriptInterface
    fun hapticFeedback(type: String) {
        router.handleHaptic(type)
    }

    @JavascriptInterface
    fun isNetworkAvailable(): Boolean {
        return router.handleIsNetworkAvailable()
    }

    @JavascriptInterface
    fun showToast(message: String) {
        router.handleShowToast(message)
    }

    @JavascriptInterface
    fun onAppReady() {
        router.handleAppReady()
    }

    @JavascriptInterface
    fun shareText(title: String, text: String): String {
        return router.handleShare(title, text)
    }

    @JavascriptInterface
    fun setStatusBarColor(colorHex: String, darkIcons: Boolean): String {
        return router.handleSetStatusBarColor(colorHex, darkIcons)
    }

    @JavascriptInterface
    fun startDownload(url: String, mimeType: String?): String {
        return router.handleDownload(url, null, null, mimeType)
    }

    @JavascriptInterface
    fun startAudioCall(targetUserId: String, targetUserName: String, targetUsername: String, targetUserAvatar: String?): String {
        return router.handleStartAudioCall(targetUserId, targetUserName, targetUsername, targetUserAvatar, null)
    }

    @JavascriptInterface
    fun startAudioCall(targetUserId: String, targetUserName: String, targetUsername: String, targetUserAvatar: String?, callId: String?): String {
        return router.handleStartAudioCall(targetUserId, targetUserName, targetUsername, targetUserAvatar, callId)
    }

    @JavascriptInterface
    fun startVideoCall(targetUserId: String, targetUserName: String, targetUsername: String, targetUserAvatar: String?): String {
        return router.handleStartVideoCall(targetUserId, targetUserName, targetUsername, targetUserAvatar, null)
    }

    @JavascriptInterface
    fun startVideoCall(targetUserId: String, targetUserName: String, targetUsername: String, targetUserAvatar: String?, callId: String?): String {
        return router.handleStartVideoCall(targetUserId, targetUserName, targetUsername, targetUserAvatar, callId)
    }

    @JavascriptInterface
    fun toggleSpeakerphone(enabled: Boolean): Boolean {
        return router.handleToggleSpeakerphone(enabled)
    }

    @JavascriptInterface
    fun toggleMute(muted: Boolean): Boolean {
        return router.handleToggleMute(muted)
    }

    @JavascriptInterface
    fun handleIncomingCall(callId: String, callerId: String, callerName: String, callerUsername: String, callerAvatar: String?, callType: String): String {
        return router.handleIncomingCall(callId, callerId, callerName, callerUsername, callerAvatar, callType)
    }

    @JavascriptInterface
    fun acceptCall(callId: String): String {
        return router.handleAcceptCall(callId)
    }

    @JavascriptInterface
    fun rejectCall(callId: String): String {
        return router.handleRejectCall(callId)
    }

    @JavascriptInterface
    fun endCall(callId: String): String {
        return router.handleEndCall(callId)
    }
}
