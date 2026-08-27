package com.niooon.chat.features.calling

enum class CallType {
    AUDIO,
    VIDEO
}

enum class CallStatus {
    IDLE,
    OUTGOING,
    RINGING,
    CONNECTING,
    CONNECTED,
    ENDED,
    REJECTED,
    MISSED
}

data class CallSession(
    val callId: String,
    val targetUserId: String,
    val targetUserName: String,
    val targetUsername: String,
    val targetUserAvatar: String? = null,
    val callType: CallType = CallType.AUDIO,
    val isIncoming: Boolean = false,
    var status: CallStatus = CallStatus.IDLE,
    val startTimeMs: Long = System.currentTimeMillis(),
    var durationSeconds: Long = 0
)
