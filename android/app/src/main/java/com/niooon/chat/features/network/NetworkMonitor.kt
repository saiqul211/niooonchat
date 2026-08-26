package com.niooon.chat.features.network

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest

class NetworkMonitor(
    private val context: Context,
    private val onNetworkStatusChanged: (isConnected: Boolean) -> Unit
) {

    private val connectivityManager: ConnectivityManager? by lazy {
        try {
            context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
        } catch (e: Exception) {
            null
        }
    }

    private var isRegistered = false

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            try {
                onNetworkStatusChanged(true)
            } catch (e: Exception) {
                // Ignore callback delivery error
            }
        }

        override fun onLost(network: Network) {
            try {
                onNetworkStatusChanged(false)
            } catch (e: Exception) {
                // Ignore callback delivery error
            }
        }
    }

    fun isConnected(): Boolean {
        return try {
            val cm = connectivityManager ?: return true
            val network = cm.activeNetwork ?: return false
            val capabilities = cm.getNetworkCapabilities(network) ?: return false
            capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        } catch (e: Exception) {
            true // Fallback to optimistic online
        }
    }

    fun startMonitoring() {
        if (isRegistered) return
        try {
            val cm = connectivityManager ?: return
            val builder = NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            cm.registerNetworkCallback(builder.build(), networkCallback)
            isRegistered = true
        } catch (e: Exception) {
            // Ignored on restricted environments
        }
    }

    fun stopMonitoring() {
        if (!isRegistered) return
        try {
            connectivityManager?.unregisterNetworkCallback(networkCallback)
            isRegistered = false
        } catch (e: Exception) {
            // Ignored
        }
    }
}
