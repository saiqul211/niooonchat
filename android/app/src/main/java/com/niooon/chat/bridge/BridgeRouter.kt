package com.niooon.chat.bridge

import android.app.Activity
import android.widget.Toast
import androidx.core.view.WindowInsetsControllerCompat
import com.niooon.chat.features.calling.CallManager
import com.niooon.chat.features.calling.CallType
import com.niooon.chat.features.downloads.DownloadHelper
import com.niooon.chat.features.haptics.HapticHelper
import com.niooon.chat.features.network.NetworkMonitor
import com.niooon.chat.features.sharing.ShareHelper
import com.niooon.chat.web.WebEnvironment

class BridgeRouter(
    private val activity: Activity,
    private val hapticHelper: HapticHelper,
    private val shareHelper: ShareHelper,
    private val downloadHelper: DownloadHelper,
    private val networkMonitor: NetworkMonitor,
    private val onAppReadyListener: () -> Unit
) {

    fun handleStartAudioCall(targetUserId: String, targetUserName: String, targetUsername: String, targetUserAvatar: String?): String {
        activity.runOnUiThread {
            CallManager.startOutgoingCall(
                context = activity,
                targetUserId = targetUserId,
                targetUserName = targetUserName,
                targetUsername = targetUsername,
                targetUserAvatar = targetUserAvatar,
                callType = CallType.AUDIO
            )
        }
        return BridgeResponse(success = true, capability = BridgeCapabilities.CAPABILITY_CALLING).toJson()
    }

    fun handleStartVideoCall(targetUserId: String, targetUserName: String, targetUsername: String, targetUserAvatar: String?): String {
        activity.runOnUiThread {
            CallManager.startOutgoingCall(
                context = activity,
                targetUserId = targetUserId,
                targetUserName = targetUserName,
                targetUsername = targetUsername,
                targetUserAvatar = targetUserAvatar,
                callType = CallType.VIDEO
            )
        }
        return BridgeResponse(success = true, capability = BridgeCapabilities.CAPABILITY_CALLING).toJson()
    }

    fun handleIncomingCall(callId: String, callerId: String, callerName: String, callerUsername: String, callerAvatar: String?, callType: String): String {
        activity.runOnUiThread {
            CallManager.handleIncomingCall(
                context = activity,
                callId = callId,
                callerId = callerId,
                callerName = callerName,
                callerUsername = callerUsername,
                callerAvatar = callerAvatar,
                callType = if (callType.equals("video", ignoreCase = true)) CallType.VIDEO else CallType.AUDIO
            )
        }
        return BridgeResponse(success = true, capability = BridgeCapabilities.CAPABILITY_CALLING).toJson()
    }

    fun handleAcceptCall(callId: String): String {
        activity.runOnUiThread {
            CallManager.acceptCall()
        }
        return BridgeResponse(success = true, capability = BridgeCapabilities.CAPABILITY_CALLING).toJson()
    }

    fun handleRejectCall(callId: String): String {
        activity.runOnUiThread {
            CallManager.rejectCall()
        }
        return BridgeResponse(success = true, capability = BridgeCapabilities.CAPABILITY_CALLING).toJson()
    }

    fun handleEndCall(callId: String): String {
        activity.runOnUiThread {
            CallManager.endCall()
        }
        return BridgeResponse(success = true, capability = BridgeCapabilities.CAPABILITY_CALLING).toJson()
    }

    fun handleHaptic(type: String): String {
        hapticHelper.hapticFeedback(type)
        return BridgeResponse(success = true, capability = BridgeCapabilities.CAPABILITY_HAPTICS).toJson()
    }

    fun handleVibrate(durationMs: Long): String {
        hapticHelper.vibrate(durationMs)
        return BridgeResponse(success = true, capability = BridgeCapabilities.CAPABILITY_HAPTICS).toJson()
    }

    fun handleShare(title: String, text: String): String {
        val result = shareHelper.shareText(title, text)
        return BridgeResponse(
            success = result,
            data = if (result) "shared" else null,
            error = if (!result) "Share intent failed" else null,
            capability = BridgeCapabilities.CAPABILITY_SHARE
        ).toJson()
    }

    fun handleDownload(url: String, userAgent: String?, contentDisposition: String?, mimeType: String?): String {
        val result = downloadHelper.downloadFile(url, userAgent, contentDisposition, mimeType)
        return BridgeResponse(
            success = result,
            data = if (result) "download_queued" else null,
            error = if (!result) "Download failed" else null,
            capability = BridgeCapabilities.CAPABILITY_DOWNLOADS
        ).toJson()
    }

    fun handleGetRuntimeInfo(): String {
        return WebEnvironment.getRuntimeInfoJson(activity)
    }

    fun handleIsNetworkAvailable(): Boolean {
        return networkMonitor.isConnected()
    }

    fun handleShowToast(message: String): String {
        activity.runOnUiThread {
            Toast.makeText(activity, message, Toast.LENGTH_SHORT).show()
        }
        return BridgeResponse(success = true, capability = BridgeCapabilities.CAPABILITY_TOAST).toJson()
    }

    fun handleAppReady(): String {
        activity.runOnUiThread {
            onAppReadyListener()
        }
        return BridgeResponse(success = true, capability = BridgeCapabilities.CAPABILITY_APP_LIFECYCLE).toJson()
    }

    fun handleSetStatusBarColor(colorHex: String, darkIcons: Boolean): String {
        activity.runOnUiThread {
            try {
                val color = android.graphics.Color.parseColor(colorHex)
                activity.window.statusBarColor = color
                val controller = WindowInsetsControllerCompat(activity.window, activity.window.decorView)
                controller.isAppearanceLightStatusBars = darkIcons
            } catch (e: Exception) {
                // Ignore parse errors
            }
        }
        return BridgeResponse(success = true, capability = BridgeCapabilities.CAPABILITY_STATUS_BAR).toJson()
    }
}
