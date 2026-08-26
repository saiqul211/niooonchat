package com.niooon.chat.web

import android.content.Context
import android.os.Build
import com.niooon.chat.bridge.BridgeCapabilities

/**
 * Runtime Environment and Capabilities state for Web ↔ Android communication
 */
object WebEnvironment {
    const val PLATFORM = "android"
    const val RUNTIME = "native-webview"
    const val APP_VERSION = "1.0.0"

    fun getRuntimeInfoJson(context: Context): String {
        val capabilitiesArray = BridgeCapabilities.ALL_CAPABILITIES.joinToString(",") { "\"$it\"" }
        return """
            {
                "platform": "$PLATFORM",
                "runtime": "$RUNTIME",
                "appVersion": "$APP_VERSION",
                "bridgeVersion": ${BridgeCapabilities.VERSION},
                "androidApiLevel": ${Build.VERSION.SDK_INT},
                "capabilities": [$capabilitiesArray]
            }
        """.trimIndent()
    }
}
