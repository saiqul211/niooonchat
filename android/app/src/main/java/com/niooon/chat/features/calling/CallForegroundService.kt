package com.niooon.chat.features.calling

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.niooon.chat.R

class CallForegroundService : Service() {

    companion object {
        private const val TAG = "CallForegroundService"
        const val CHANNEL_ID = "niooon_active_call_channel"
        const val NOTIFICATION_ID = 9005

        const val ACTION_START_CALL = "com.niooon.chat.ACTION_START_CALL"
        const val ACTION_STOP_CALL = "com.niooon.chat.ACTION_STOP_CALL"
        const val ACTION_UPDATE_DURATION = "com.niooon.chat.ACTION_UPDATE_DURATION"

        const val EXTRA_CALL_ID = "EXTRA_CALL_ID"
        const val EXTRA_CALLER_NAME = "EXTRA_CALLER_NAME"
        const val EXTRA_CALL_TYPE = "EXTRA_CALL_TYPE"
        const val EXTRA_DURATION = "EXTRA_DURATION"

        fun startService(context: Context, session: CallSession) {
            val intent = Intent(context, CallForegroundService::class.java).apply {
                action = ACTION_START_CALL
                putExtra(EXTRA_CALL_ID, session.callId)
                putExtra(EXTRA_CALLER_NAME, session.targetUserName)
                putExtra(EXTRA_CALL_TYPE, session.callType.name)
            }
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start CallForegroundService: ${e.message}")
            }
        }

        fun updateDuration(context: Context, durationStr: String) {
            val intent = Intent(context, CallForegroundService::class.java).apply {
                action = ACTION_UPDATE_DURATION
                putExtra(EXTRA_DURATION, durationStr)
            }
            try {
                context.startService(intent)
            } catch (e: Exception) {
                // Ignore if service not running
            }
        }

        fun stopService(context: Context) {
            val intent = Intent(context, CallForegroundService::class.java).apply {
                action = ACTION_STOP_CALL
            }
            try {
                context.startService(intent)
            } catch (e: Exception) {
                // Ignore
            }
        }
    }

    private var wakeLock: PowerManager.WakeLock? = null
    private var callerName: String = "Niooon Call"
    private var callType: String = "AUDIO"
    private var duration: String = "00:00"

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        acquireWakeLock()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent == null) return START_NOT_STICKY

        when (intent.action) {
            ACTION_START_CALL -> {
                callerName = intent.getStringExtra(EXTRA_CALLER_NAME) ?: callerName
                callType = intent.getStringExtra(EXTRA_CALL_TYPE) ?: callType
                startCallForeground()
            }
            ACTION_UPDATE_DURATION -> {
                duration = intent.getStringExtra(EXTRA_DURATION) ?: duration
                updateNotification()
            }
            ACTION_STOP_CALL -> {
                stopForegroundCall()
            }
        }

        return START_STICKY
    }

    private fun startCallForeground() {
        val notification = buildCallNotification(duration)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                var serviceType = ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    serviceType = serviceType or ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
                    if (callType == CallType.VIDEO.name) {
                        serviceType = serviceType or ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
                    }
                }
                startForeground(NOTIFICATION_ID, notification, serviceType)
            } catch (e: Exception) {
                Log.w(TAG, "startForeground with types failed: ${e.message}, falling back to basic")
                startForeground(NOTIFICATION_ID, notification)
            }
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun updateNotification() {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        manager?.notify(NOTIFICATION_ID, buildCallNotification(duration))
    }

    private fun stopForegroundCall() {
        releaseWakeLock()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
        stopSelf()
    }

    private fun buildCallNotification(durationStr: String): Notification {
        val callIntent = Intent(this, CallActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
        }
        val callPendingIntent = PendingIntent.getActivity(
            this,
            201,
            callIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val endCallIntent = Intent(this, CallActivity::class.java).apply {
            action = CallNotificationHelper.ACTION_END_CALL
            putExtra("AUTO_END", true)
        }
        val endCallPendingIntent = PendingIntent.getActivity(
            this,
            202,
            endCallIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val callTypeLabel = if (callType == CallType.VIDEO.name) "Video Call" else "Voice Call"

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(callerName)
            .setContentText("$callTypeLabel in progress • $durationStr")
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setContentIntent(callPendingIntent)
            .addAction(R.drawable.ic_call_end, "End Call", endCallPendingIntent)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Active Voice & Video Calls"
            val descriptionText = "Foreground persistent service for active calls"
            val channel = NotificationChannel(CHANNEL_ID, name, NotificationManager.IMPORTANCE_LOW).apply {
                description = descriptionText
                setShowBadge(false)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            manager?.createNotificationChannel(channel)
        }
    }

    private fun acquireWakeLock() {
        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as? PowerManager
            wakeLock = powerManager?.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "niooonchat:call_lock")?.apply {
                acquire(3 * 60 * 60 * 1000L) // 3 hours max safeguard
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to acquire wake lock: ${e.message}")
        }
    }

    private fun releaseWakeLock() {
        try {
            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
            }
        } catch (e: Exception) {
            // Ignore
        }
    }

    override fun onDestroy() {
        releaseWakeLock()
        super.onDestroy()
    }
}
