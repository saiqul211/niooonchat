package com.niooon.chat.bridge

/**
 * Standard Structured Response for Web ↔ Android Bridge interactions
 */
data class BridgeResponse(
    val success: Boolean,
    val data: Any? = null,
    val error: String? = null,
    val capability: String? = null,
    val version: Int = BridgeCapabilities.VERSION
) {
    fun toJson(): String {
        val dataStr = when (data) {
            null -> "null"
            is String -> "\"${data.replace("\"", "\\\"")}\""
            is Number, is Boolean -> data.toString()
            is List<*> -> "[${data.joinToString(",") { "\"$it\"" }}]"
            else -> "\"$data\""
        }

        val errorStr = if (error != null) "\"${error.replace("\"", "\\\"")}\"" else "null"
        val capabilityStr = if (capability != null) "\"$capability\"" else "null"

        return """
            {
                "success": $success,
                "data": $dataStr,
                "error": $errorStr,
                "capability": $capabilityStr,
                "version": $version
            }
        """.trimIndent()
    }
}
