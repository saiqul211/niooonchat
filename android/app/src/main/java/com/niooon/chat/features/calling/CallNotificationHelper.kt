package com.niooon.chat.features.calling

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import com.niooon.chat.R

class CallNotificationHelper(private val context: Context) {

    companion object {
        const val CHANNEL_ID = "niooon_voice_calls"
        const val NOTIFICATION_ID_INCOMING = 9001
        const val NOTIFICATION_ID_ONGOING = 9002

        const val ACTION_ACCEPT_CALL = "com.niooon.chat.ACTION_ACCEPT_CALL"
        const val ACTION_DECLINE_CALL = "com.niooon.chat.ACTION_DECLINE_CALL"
        const val ACTION_END_CALL = "com.niooon.chat.ACTION_END_CALL"
    }

    private val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    init {
        createNotificationChannel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Voice & Video Calls"
            val descriptionText = "Incoming and active call notifications"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 1000, 1000)
                setSound(
                    RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE),
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                        .build()
                )
            }
            notificationManager.createNotificationChannel(channel)
        }
    }

    fun showIncomingCallNotification(session: CallSession) {
        val fullScreenIntent = Intent(context, CallActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("CALL_ID", session.callId)
            putExtra("TARGET_USER_ID", session.targetUserId)
            putExtra("TARGET_USER_NAME", session.targetUserName)
            putExtra("TARGET_USERNAME", session.targetUsername)
            putExtra("TARGET_USER_AVATAR", session.targetUserAvatar)
            putExtra("CALL_TYPE", session.callType.name)
            putExtra("IS_INCOMING", true)
        }

        val fullScreenPendingIntent = PendingIntent.getActivity(
            context,
            session.callId.hashCode(),
            fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Accept Intent
        val acceptIntent = Intent(context, CallActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            action = ACTION_ACCEPT_CALL
            putExtra("CALL_ID", session.callId)
            putExtra("TARGET_USER_ID", session.targetUserId)
            putExtra("TARGET_USER_NAME", session.targetUserName)
            putExtra("TARGET_USERNAME", session.targetUsername)
            putExtra("CALL_TYPE", session.callType.name)
            putExtra("IS_INCOMING", true)
            putExtra("AUTO_ACCEPT", true)
        }
        val acceptPendingIntent = PendingIntent.getActivity(
            context,
            session.callId.hashCode() + 1,
            acceptIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Decline Intent
        val declineIntent = Intent(context, CallActivity::class.java).apply {
            action = ACTION_DECLINE_CALL
            putExtra("CALL_ID", session.callId)
            putExtra("AUTO_DECLINE", true)
        }
        val declinePendingIntent = PendingIntent.getActivity(
            context,
            session.callId.hashCode() + 2,
            declineIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val callTypeLabel = if (session.callType == CallType.VIDEO) "Incoming Video Call" else "Incoming Voice Call"

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(session.targetUserName)
            .setContentText(callTypeLabel)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setContentIntent(fullScreenPendingIntent)
            .setAutoCancel(true)
            .setOngoing(true)
            .addAction(R.drawable.ic_call_end, "Decline", declinePendingIntent)
            .addAction(R.drawable.ic_call_accept, "Accept", acceptPendingIntent)
            .build()

        notificationManager.notify(NOTIFICATION_ID_INCOMING, notification)
    }

    fun showOngoingCallNotification(session: CallSession, durationStr: String) {
        val openIntent = Intent(context, CallActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val openPendingIntent = PendingIntent.getActivity(
            context,
            session.callId.hashCode() + 3,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val endIntent = Intent(context, CallActivity::class.java).apply {
            action = ACTION_END_CALL
            putExtra("AUTO_END", true)
        }
        val endPendingIntent = PendingIntent.getActivity(
            context,
            session.callId.hashCode() + 4,
            endIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(session.targetUserName)
            .setContentText("Call in progress • $durationStr")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setContentIntent(openPendingIntent)
            .setOngoing(true)
            .addAction(R.drawable.ic_call_end, "End Call", endPendingIntent)
            .build()

        notificationManager.notify(NOTIFICATION_ID_ONGOING, notification)
    }

    fun cancelAllCallNotifications() {
        try {
            notificationManager.cancel(NOTIFICATION_ID_INCOMING)
            notificationManager.cancel(NOTIFICATION_ID_ONGOING)
        } catch (e: Exception) {
            // Ignore
        }
    }
}
