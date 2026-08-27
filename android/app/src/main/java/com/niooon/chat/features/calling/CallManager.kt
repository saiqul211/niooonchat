package com.niooon.chat.features.calling

import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.util.Log

object CallManager {

    var currentSession: CallSession? = null
        private set

    private var audioHelper: CallAudioHelper? = null
    private var notificationHelper: CallNotificationHelper? = null

    private val mainHandler = Handler(Looper.getMainLooper())
    private var timerRunnable: Runnable? = null

    var onStateChangedListener: ((CallSession) -> Unit)? = null
    var webEventDispatcher: ((eventName: String, payloadJson: String) -> Unit)? = null

    var isMicMuted: Boolean = false
        private set
    var isSpeakerphoneOn: Boolean = false
        private set
    var isVideoMuted: Boolean = false
        private set
    var isFrontCamera: Boolean = true
        private set

    fun init(context: Context) {
        if (audioHelper == null) {
            audioHelper = CallAudioHelper(context.applicationContext)
        }
        if (notificationHelper == null) {
            notificationHelper = CallNotificationHelper(context.applicationContext)
        }
    }

    fun startOutgoingCall(
        context: Context,
        targetUserId: String,
        targetUserName: String,
        targetUsername: String,
        targetUserAvatar: String? = null,
        callType: CallType = CallType.AUDIO
    ): CallSession {
        init(context)
        val callId = "call_${System.currentTimeMillis()}_${targetUserId.take(6)}"
        val session = CallSession(
            callId = callId,
            targetUserId = targetUserId,
            targetUserName = targetUserName,
            targetUsername = targetUsername,
            targetUserAvatar = targetUserAvatar,
            callType = callType,
            isIncoming = false,
            status = CallStatus.OUTGOING
        )
        currentSession = session
        isMicMuted = false
        isVideoMuted = false
        isFrontCamera = true

        // Default speakerphone true for video call, earpiece for audio call
        isSpeakerphoneOn = callType == CallType.VIDEO
        audioHelper?.setCallAudioMode(isSpeakerphoneOn)
        audioHelper?.startOutgoingRingbackTone()
        if (callType == CallType.AUDIO) {
            audioHelper?.enableProximitySensor(true)
        }

        notifyStateChange(session)

        // Launch Native CallActivity
        val intent = Intent(context, CallActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("CALL_ID", callId)
            putExtra("TARGET_USER_ID", targetUserId)
            putExtra("TARGET_USER_NAME", targetUserName)
            putExtra("TARGET_USERNAME", targetUsername)
            putExtra("TARGET_USER_AVATAR", targetUserAvatar)
            putExtra("CALL_TYPE", callType.name)
            putExtra("IS_INCOMING", false)
        }
        context.startActivity(intent)

        // Initialize ZEGOCLOUD session
        ZegoNativeHelper.startNativeZegoSession(context, targetUserId, callId, callType)

        return session
    }

    fun handleIncomingCall(
        context: Context,
        callId: String,
        callerId: String,
        callerName: String,
        callerUsername: String,
        callerAvatar: String? = null,
        callType: CallType = CallType.AUDIO
    ): CallSession {
        init(context)
        val session = CallSession(
            callId = callId,
            targetUserId = callerId,
            targetUserName = callerName,
            targetUsername = callerUsername,
            targetUserAvatar = callerAvatar,
            callType = callType,
            isIncoming = true,
            status = CallStatus.RINGING
        )
        currentSession = session
        isMicMuted = false
        isVideoMuted = false
        isFrontCamera = true
        isSpeakerphoneOn = callType == CallType.VIDEO

        audioHelper?.startIncomingRingtoneAndVibration()
        notificationHelper?.showIncomingCallNotification(session)

        notifyStateChange(session)

        // Open CallActivity (Incoming Screen)
        val intent = Intent(context, CallActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("CALL_ID", callId)
            putExtra("TARGET_USER_ID", callerId)
            putExtra("TARGET_USER_NAME", callerName)
            putExtra("TARGET_USERNAME", callerUsername)
            putExtra("TARGET_USER_AVATAR", callerAvatar)
            putExtra("CALL_TYPE", callType.name)
            putExtra("IS_INCOMING", true)
        }
        context.startActivity(intent)

        return session
    }

    fun acceptCall(context: Context? = null) {
        val session = currentSession ?: return
        audioHelper?.stopRingtones()
        notificationHelper?.cancelAllCallNotifications()

        session.status = CallStatus.CONNECTED
        audioHelper?.setCallAudioMode(isSpeakerphoneOn)
        if (session.callType == CallType.AUDIO) {
            audioHelper?.enableProximitySensor(true)
        }

        if (context != null) {
            ZegoNativeHelper.startNativeZegoSession(context, session.targetUserId, session.callId, session.callType)
        }

        startTimer()
        notifyStateChange(session)
    }

    fun rejectCall(reason: String = "declined") {
        val session = currentSession ?: return
        session.status = CallStatus.REJECTED
        cleanupCall()
        notifyStateChange(session)
        currentSession = null
    }

    fun endCall() {
        val session = currentSession ?: return
        session.status = CallStatus.ENDED
        cleanupCall()
        notifyStateChange(session)
        currentSession = null
    }

    fun toggleMute(): Boolean {
        isMicMuted = !isMicMuted
        audioHelper?.setMicrophoneMute(isMicMuted)
        currentSession?.let { notifyStateChange(it) }
        return isMicMuted
    }

    fun toggleSpeakerphone(): Boolean {
        isSpeakerphoneOn = !isSpeakerphoneOn
        audioHelper?.setSpeakerphone(isSpeakerphoneOn)
        currentSession?.let { notifyStateChange(it) }
        return isSpeakerphoneOn
    }

    fun toggleVideo(): Boolean {
        isVideoMuted = !isVideoMuted
        currentSession?.let { notifyStateChange(it) }
        return isVideoMuted
    }

    fun switchCamera(): Boolean {
        isFrontCamera = !isFrontCamera
        currentSession?.let { notifyStateChange(it) }
        return isFrontCamera
    }

    private fun startTimer() {
        stopTimer()
        timerRunnable = object : Runnable {
            override fun run() {
                val session = currentSession
                if (session != null && session.status == CallStatus.CONNECTED) {
                    session.durationSeconds++
                    val durationStr = formatDuration(session.durationSeconds)
                    notificationHelper?.showOngoingCallNotification(session, durationStr)
                    notifyStateChange(session)
                    mainHandler.postDelayed(this, 1000L)
                }
            }
        }
        mainHandler.postDelayed(timerRunnable!!, 1000L)
    }

    private fun stopTimer() {
        timerRunnable?.let { mainHandler.removeCallbacks(it) }
        timerRunnable = null
    }

    fun formatDuration(seconds: Long): String {
        val mins = seconds / 60
        val secs = seconds % 60
        return String.format("%02d:%02d", mins, secs)
    }

    private fun cleanupCall() {
        stopTimer()
        audioHelper?.resetAudio()
        notificationHelper?.cancelAllCallNotifications()
    }

    private fun notifyStateChange(session: CallSession) {
        onStateChangedListener?.invoke(session)

        val json = """
            {
                "callId": "${session.callId}",
                "targetUserId": "${session.targetUserId}",
                "targetUserName": "${session.targetUserName}",
                "targetUsername": "${session.targetUsername}",
                "callType": "${session.callType.name.lowercase()}",
                "isIncoming": ${session.isIncoming},
                "status": "${session.status.name.lowercase()}",
                "durationSeconds": ${session.durationSeconds},
                "isMicMuted": $isMicMuted,
                "isSpeakerphoneOn": $isSpeakerphoneOn,
                "isVideoMuted": $isVideoMuted,
                "isFrontCamera": $isFrontCamera
            }
        """.trimIndent().replace("\n", "")

        webEventDispatcher?.invoke("native:callState", json)
    }
}
