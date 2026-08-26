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
}
