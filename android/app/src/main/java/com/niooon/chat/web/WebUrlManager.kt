package com.niooon.chat.web

import android.content.Context
import android.net.Uri
import com.niooon.chat.R

class WebUrlManager(private val context: Context) {

    val liveUrl: String by lazy {
        context.getString(R.string.live_remote_url)
    }

    val fallbackUrl: String by lazy {
        context.getString(R.string.fallback_remote_url)
    }

    fun sanitizeTargetUrl(incomingUrl: String?): String {
        if (incomingUrl.isNullOrBlank()) return liveUrl

        return try {
            val uri = Uri.parse(incomingUrl)
            if (uri.scheme == "https" || uri.scheme == "http" || uri.scheme == "niooonchat") {
                if (uri.scheme == "niooonchat") {
                    // Convert deep link schema (e.g. niooonchat://chat/alice) to live Web URL
                    val path = uri.path ?: ""
                    val query = if (uri.query != null) "?${uri.query}" else ""
                    "$liveUrl$path$query"
                } else {
                    incomingUrl
                }
            } else {
                liveUrl
            }
        } catch (e: Exception) {
            liveUrl
        }
    }

    fun isTrustedHost(host: String?): Boolean {
        if (host == null) return false
        return host.contains("run.app") ||
                host.contains("vercel.app") ||
                host.contains("supabase.co") ||
                host == "localhost" ||
                host == "127.0.0.1" ||
                host == "10.0.2.2"
    }
}
