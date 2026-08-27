package com.niooon.chat.bridge

/**
 * Standard Capability Registry for Niooon Chat Native Android Bridge (Version 1)
 */
object BridgeCapabilities {
    const val VERSION = 1

    const val CAPABILITY_HAPTICS = "haptics"
    const val CAPABILITY_SHARE = "share"
    const val CAPABILITY_DOWNLOADS = "downloads"
    const val CAPABILITY_CAMERA = "camera"
    const val CAPABILITY_FILE_PICKER = "filePicker"
    const val CAPABILITY_NETWORK = "network"
    const val CAPABILITY_STATUS_BAR = "statusBar"
    const val CAPABILITY_NOTIFICATIONS = "notifications"
    const val CAPABILITY_TOAST = "toast"
    const val CAPABILITY_APP_LIFECYCLE = "appLifecycle"
    const val CAPABILITY_CALLING = "calling"

    val ALL_CAPABILITIES = listOf(
        CAPABILITY_HAPTICS,
        CAPABILITY_SHARE,
        CAPABILITY_DOWNLOADS,
        CAPABILITY_CAMERA,
        CAPABILITY_FILE_PICKER,
        CAPABILITY_NETWORK,
        CAPABILITY_STATUS_BAR,
        CAPABILITY_NOTIFICATIONS,
        CAPABILITY_TOAST,
        CAPABILITY_APP_LIFECYCLE,
        CAPABILITY_CALLING
    )

    fun hasCapability(capability: String): Boolean {
        return ALL_CAPABILITIES.contains(capability)
    }
}
