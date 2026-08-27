package com.niooon.chat.features.calling

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.Ringtone
import android.media.RingtoneManager
import android.media.ToneGenerator
import android.os.Build
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log

class CallAudioHelper(private val context: Context) : SensorEventListener {

    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
    private val proximitySensor = sensorManager?.getDefaultSensor(Sensor.TYPE_PROXIMITY)
    private val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager

    private var proximityWakeLock: PowerManager.WakeLock? = null
    private var incomingRingtone: Ringtone? = null
    private var toneGenerator: ToneGenerator? = null
    private var isPlayingRingback = false

    private val vibrator: Vibrator? by lazy {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            vibratorManager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }

    init {
        try {
            if (powerManager?.isWakeLockLevelSupported(PowerManager.PROXIMITY_SCREEN_OFF_WAKE_LOCK) == true) {
                proximityWakeLock = powerManager.newWakeLock(
                    PowerManager.PROXIMITY_SCREEN_OFF_WAKE_LOCK,
                    "niooonchat:proximity_call"
                )
            }
        } catch (e: Exception) {
            Log.w("CallAudioHelper", "Proximity wake lock not supported: ${e.message}")
        }
    }

    fun startIncomingRingtoneAndVibration() {
        try {
            // Ringtone
            val ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            incomingRingtone = RingtoneManager.getRingtone(context, ringtoneUri)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                incomingRingtone?.isLooping = true
            }
            incomingRingtone?.play()

            // Vibration pattern (0ms wait, 1000ms vibrate, 1000ms sleep)
            val pattern = longArrayOf(0, 1000, 1000)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(pattern, 0)
            }
        } catch (e: Exception) {
            Log.w("CallAudioHelper", "Failed to play incoming ringtone: ${e.message}")
        }
    }

    fun startOutgoingRingbackTone() {
        try {
            isPlayingRingback = true
            toneGenerator = ToneGenerator(AudioManager.STREAM_VOICE_CALL, 70)
            toneGenerator?.startTone(ToneGenerator.TONE_SUP_RINGTONE)
        } catch (e: Exception) {
            Log.w("CallAudioHelper", "Failed to start ringback tone: ${e.message}")
        }
    }

    fun stopRingtones() {
        try {
            incomingRingtone?.stop()
            incomingRingtone = null

            vibrator?.cancel()

            if (isPlayingRingback) {
                isPlayingRingback = false
                toneGenerator?.stopTone()
                toneGenerator?.release()
                toneGenerator = null
            }
        } catch (e: Exception) {
            Log.w("CallAudioHelper", "Failed to stop ringtones: ${e.message}")
        }
    }

    fun setCallAudioMode(isSpeaker: Boolean) {
        try {
            audioManager?.let { am ->
                am.mode = AudioManager.MODE_IN_COMMUNICATION
                am.isSpeakerphoneOn = isSpeaker
                am.isMicrophoneMute = false
            }
        } catch (e: Exception) {
            Log.w("CallAudioHelper", "Failed to set audio mode: ${e.message}")
        }
    }

    fun toggleSpeakerphone(): Boolean {
        return try {
            val currentState = audioManager?.isSpeakerphoneOn ?: false
            val newState = !currentState
            audioManager?.isSpeakerphoneOn = newState
            newState
        } catch (e: Exception) {
            false
        }
    }

    fun setSpeakerphone(enable: Boolean) {
        try {
            audioManager?.isSpeakerphoneOn = enable
        } catch (e: Exception) {
            // Ignore
        }
    }

    fun isSpeakerphoneOn(): Boolean {
        return audioManager?.isSpeakerphoneOn ?: false
    }

    fun setMicrophoneMute(isMuted: Boolean) {
        try {
            audioManager?.isMicrophoneMute = isMuted
        } catch (e: Exception) {
            // Ignore
        }
    }

    fun isMicrophoneMute(): Boolean {
        return audioManager?.isMicrophoneMute ?: false
    }

    fun enableProximitySensor(enable: Boolean) {
        try {
            if (enable && proximitySensor != null) {
                sensorManager?.registerListener(this, proximitySensor, SensorManager.SENSOR_DELAY_NORMAL)
            } else {
                sensorManager?.unregisterListener(this)
                if (proximityWakeLock?.isHeld == true) {
                    proximityWakeLock?.release()
                }
            }
        } catch (e: Exception) {
            Log.w("CallAudioHelper", "Proximity sensor error: ${e.message}")
        }
    }

    override fun onSensorChanged(event: SensorEvent?) {
        if (event?.sensor?.type == Sensor.TYPE_PROXIMITY) {
            val distance = event.values[0]
            val maxRange = proximitySensor?.maximumRange ?: 5.0f
            val isNear = distance < maxRange

            try {
                if (isNear && !isSpeakerphoneOn()) {
                    if (proximityWakeLock?.isHeld == false) {
                        proximityWakeLock?.acquire(10 * 60 * 1000L) // 10 minutes max
                    }
                } else {
                    if (proximityWakeLock?.isHeld == true) {
                        proximityWakeLock?.release()
                    }
                }
            } catch (e: Exception) {
                // Ignore
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    fun resetAudio() {
        stopRingtones()
        enableProximitySensor(false)
        try {
            audioManager?.let { am ->
                am.mode = AudioManager.MODE_NORMAL
                am.isSpeakerphoneOn = false
                am.isMicrophoneMute = false
            }
        } catch (e: Exception) {
            Log.w("CallAudioHelper", "Failed to reset audio: ${e.message}")
        }
    }
}
