package com.niooon.chat.features.haptics

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

class HapticHelper(private val context: Context) {

    private val vibrator: Vibrator? by lazy {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val manager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            manager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }

    fun vibrate(durationMs: Long) {
        val safeDuration = durationMs.coerceIn(5, 500)
        vibrator?.let {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                it.vibrate(VibrationEffect.createOneShot(safeDuration, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                it.vibrate(safeDuration)
            }
        }
    }

    fun hapticFeedback(type: String) {
        val duration: Long = when (type.lowercase()) {
            "heavy" -> 45
            "medium" -> 30
            "selection" -> 12
            "light" -> 18
            else -> 20
        }
        vibrate(duration)
    }
}
