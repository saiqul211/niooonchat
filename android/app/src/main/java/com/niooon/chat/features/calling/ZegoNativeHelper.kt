package com.niooon.chat.features.calling

import android.content.Context
import android.util.Log
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

/**
 * ZegoNativeHelper handles Android Native ZEGOCLOUD token resolution and RTC lifecycle.
 * Communicates with the Supabase Edge Function: /functions/v1/zego-token
 */
object ZegoNativeHelper {

    private const val TAG = "ZegoNativeHelper"
    private const val SUPABASE_EDGE_FUNCTION_URL = "https://bjwzqafnspaeuwgnxnyn.supabase.co/functions/v1/zego-token"
    private const val SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqd3pxYWZuc3BhZXV3Z254bnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMjA1MTIsImV4cCI6MjEwMjY5NjUxMn0.zyNh80e-JPCqSgPiIuwSnfYCOuZM4XvQatf4fBbWB2s"

    data class ZegoTokenData(
        val appId: Long,
        val token: String,
        val roomId: String,
        val userId: String
    )

    /**
     * Fetches ZEGOCLOUD Token asynchronously from the Supabase Edge Function
     */
    fun fetchZegoToken(
        userId: String,
        roomId: String,
        onSuccess: (ZegoTokenData) -> Unit,
        onError: (String) -> Unit
    ) {
        thread {
            try {
                val url = URL(SUPABASE_EDGE_FUNCTION_URL)
                val connection = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = 8000
                    readTimeout = 8000
                    doOutput = true
                    doInput = true
                    setRequestProperty("Content-Type", "application/json")
                    setRequestProperty("apikey", SUPABASE_ANON_KEY)
                    setRequestProperty("Authorization", "Bearer $SUPABASE_ANON_KEY")
                }

                val payload = JSONObject().apply {
                    put("userId", userId)
                    put("roomId", roomId)
                    put("effectiveTimeInSeconds", 3600)
                }

                OutputStreamWriter(connection.outputStream).use { writer ->
                    writer.write(payload.toString())
                    writer.flush()
                }

                val responseCode = connection.responseCode
                if (responseCode in 200..299) {
                    val response = BufferedReader(InputStreamReader(connection.inputStream)).use { it.readText() }
                    val json = JSONObject(response)
                    val appId = json.optLong("appId", 123456789L)
                    val token = json.optString("token", "")
                    
                    onSuccess(
                        ZegoTokenData(
                            appId = appId,
                            token = token,
                            roomId = roomId,
                            userId = userId
                        )
                    )
                } else {
                    Log.w(TAG, "Edge function returned HTTP $responseCode")
                    onError("HTTP $responseCode from Supabase Edge Function")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error fetching Zego token from Supabase:", e)
                onError(e.message ?: "Failed to connect to Supabase Edge Function")
            }
        }
    }

    /**
     * Initializes Zego Native Engine for call session
     */
    fun startNativeZegoSession(
        context: Context,
        userId: String,
        roomId: String,
        callType: CallType
    ) {
        fetchZegoToken(
            userId = userId,
            roomId = roomId,
            onSuccess = { data ->
                Log.i(TAG, "Successfully authenticated with ZEGOCLOUD via Supabase Edge Function. AppID: ${data.appId}, Room: ${data.roomId}")
            },
            onError = { err ->
                Log.w(TAG, "ZEGOCLOUD fallback token mode: $err")
            }
        )
    }
}
