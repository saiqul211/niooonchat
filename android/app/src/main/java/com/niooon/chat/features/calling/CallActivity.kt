package com.niooon.chat.features.calling

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.view.animation.AlphaAnimation
import android.view.animation.Animation
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.niooon.chat.R
import com.niooon.chat.databinding.ActivityCallBinding

class CallActivity : AppCompatActivity() {

    private lateinit var binding: ActivityCallBinding
    private var pulseAnimation: Animation? = null

    private val permissionsLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val audioGranted = permissions[Manifest.permission.RECORD_AUDIO] ?: false
        val cameraGranted = permissions[Manifest.permission.CAMERA] ?: false

        if (!audioGranted) {
            Toast.makeText(this, "Microphone permission is required for calls", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Show over lockscreen and keep screen on
        setupWindowFlags()

        binding = ActivityCallBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Check Permissions
        checkCallPermissions()

        // Handle Intent Actions (from notifications or deep link)
        handleIntent(intent)

        setupListeners()
        updateUI()

        CallManager.onStateChangedListener = {
            runOnUiThread {
                if (!isFinishing && !isDestroyed) {
                    updateUI()
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    private fun setupWindowFlags() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            )
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT

        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.isAppearanceLightStatusBars = false
        controller.isAppearanceLightNavigationBars = false
    }

    private fun checkCallPermissions() {
        val permissionsToRequest = mutableListOf(Manifest.permission.RECORD_AUDIO)
        if (CallManager.currentSession?.callType == CallType.VIDEO) {
            permissionsToRequest.add(Manifest.permission.CAMERA)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            permissionsToRequest.add(Manifest.permission.BLUETOOTH_CONNECT)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val needed = permissionsToRequest.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (needed.isNotEmpty()) {
            permissionsLauncher.launch(needed.toTypedArray())
        }
    }

    private fun handleIntent(intent: Intent?) {
        if (intent == null) return

        if (intent.getBooleanExtra("AUTO_ACCEPT", false) || intent.action == CallNotificationHelper.ACTION_ACCEPT_CALL) {
            CallManager.acceptCall()
        } else if (intent.getBooleanExtra("AUTO_DECLINE", false) || intent.action == CallNotificationHelper.ACTION_DECLINE_CALL) {
            CallManager.rejectCall()
            finish()
        } else if (intent.getBooleanExtra("AUTO_END", false) || intent.action == CallNotificationHelper.ACTION_END_CALL) {
            CallManager.endCall()
            finish()
        }
    }

    private fun setupListeners() {
        binding.btnEndCall.setOnClickListener {
            CallManager.endCall()
            finish()
        }

        binding.btnRejectIncoming.setOnClickListener {
            CallManager.rejectCall()
            finish()
        }

        binding.btnAcceptIncoming.setOnClickListener {
            CallManager.acceptCall()
        }

        binding.btnMute.setOnClickListener {
            val isMuted = CallManager.toggleMute()
            binding.btnMute.setImageResource(if (isMuted) R.drawable.ic_mic_off else R.drawable.ic_mic_on)
        }

        binding.btnSpeaker.setOnClickListener {
            val isSpeaker = CallManager.toggleSpeakerphone()
            binding.btnSpeaker.setImageResource(if (isSpeaker) R.drawable.ic_speaker_on else R.drawable.ic_speaker_off)
        }

        binding.btnToggleVideo.setOnClickListener {
            val isVideoMuted = CallManager.toggleVideo()
            binding.btnToggleVideo.setImageResource(if (isVideoMuted) R.drawable.ic_video_off else R.drawable.ic_video_on)
            binding.cardLocalVideo.visibility = if (isVideoMuted) View.GONE else View.VISIBLE
        }

        binding.btnSwitchCamera.setOnClickListener {
            CallManager.switchCamera()
            Toast.makeText(this, "Camera flipped", Toast.LENGTH_SHORT).show()
        }
    }

    private fun updateUI() {
        val session = CallManager.currentSession
        if (session == null || session.status == CallStatus.ENDED || session.status == CallStatus.REJECTED) {
            stopPulseAnimation()
            finish()
            return
        }

        val isVideo = session.callType == CallType.VIDEO
        binding.tvCallTypeBadge.text = if (isVideo) "NIOOON VIDEO CALL" else "NIOOON VOICE CALL"
        binding.tvCallerName.text = session.targetUserName
        binding.tvCallerUsername.text = "@${session.targetUsername}"

        val initials = if (session.targetUserName.isNotBlank()) {
            session.targetUserName.split(" ").mapNotNull { it.firstOrNull()?.toString() }.take(2).joinToString("").uppercase()
        } else {
            "NC"
        }
        binding.tvAvatarInitials.text = initials

        // Video views
        binding.btnSwitchCamera.visibility = if (isVideo && session.status == CallStatus.CONNECTED) View.VISIBLE else View.GONE
        binding.btnToggleVideo.visibility = if (isVideo) View.VISIBLE else View.GONE
        binding.containerRemoteVideo.visibility = if (isVideo && session.status == CallStatus.CONNECTED) View.VISIBLE else View.GONE
        binding.cardLocalVideo.visibility = if (isVideo && session.status == CallStatus.CONNECTED && !CallManager.isVideoMuted) View.VISIBLE else View.GONE

        // Controls states
        binding.btnMute.setImageResource(if (CallManager.isMicMuted) R.drawable.ic_mic_off else R.drawable.ic_mic_on)
        binding.btnSpeaker.setImageResource(if (CallManager.isSpeakerphoneOn) R.drawable.ic_speaker_on else R.drawable.ic_speaker_off)
        binding.btnToggleVideo.setImageResource(if (CallManager.isVideoMuted) R.drawable.ic_video_off else R.drawable.ic_video_on)

        when (session.status) {
            CallStatus.RINGING -> {
                binding.layoutIncomingActions.visibility = View.VISIBLE
                binding.layoutEndCall.visibility = View.GONE
                binding.layoutActiveControls.visibility = View.GONE
                binding.tvCallStatus.text = if (isVideo) "Incoming video call..." else "Incoming voice call..."
                binding.tvCallStatus.setTextColor(ContextCompat.getColor(this, R.color.colorAccent))
                startPulseAnimation()
            }
            CallStatus.OUTGOING -> {
                binding.layoutIncomingActions.visibility = View.GONE
                binding.layoutEndCall.visibility = View.VISIBLE
                binding.layoutActiveControls.visibility = View.VISIBLE
                binding.tvCallStatus.text = "Ringing..."
                binding.tvCallStatus.setTextColor(Color.parseColor("#60A5FA"))
                startPulseAnimation()
            }
            CallStatus.CONNECTING -> {
                binding.layoutIncomingActions.visibility = View.GONE
                binding.layoutEndCall.visibility = View.VISIBLE
                binding.layoutActiveControls.visibility = View.VISIBLE
                binding.tvCallStatus.text = "Connecting..."
                binding.tvCallStatus.setTextColor(Color.parseColor("#34D399"))
            }
            CallStatus.CONNECTED -> {
                stopPulseAnimation()
                binding.layoutIncomingActions.visibility = View.GONE
                binding.layoutEndCall.visibility = View.VISIBLE
                binding.layoutActiveControls.visibility = View.VISIBLE
                binding.tvCallStatus.text = CallManager.formatDuration(session.durationSeconds)
                binding.tvCallStatus.setTextColor(Color.parseColor("#22C55E"))
            }
            else -> {
                stopPulseAnimation()
                binding.tvCallStatus.text = "Call Ended"
                binding.tvCallStatus.setTextColor(Color.parseColor("#EF4444"))
            }
        }
    }

    private fun startPulseAnimation() {
        if (pulseAnimation == null) {
            pulseAnimation = AlphaAnimation(0.3f, 1.0f).apply {
                duration = 800
                repeatMode = Animation.REVERSE
                repeatCount = Animation.INFINITE
            }
            binding.avatarGlowRing.startAnimation(pulseAnimation)
        }
    }

    private fun stopPulseAnimation() {
        pulseAnimation?.cancel()
        pulseAnimation = null
        binding.avatarGlowRing.clearAnimation()
    }

    override fun onDestroy() {
        stopPulseAnimation()
        if (CallManager.onStateChangedListener != null) {
            CallManager.onStateChangedListener = null
        }
        super.onDestroy()
    }
}
