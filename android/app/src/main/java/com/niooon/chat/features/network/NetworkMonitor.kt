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

    private val connectivityManager: ConnectivityManager by lazy {
        context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    }

    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            onNetworkStatusChanged(true)
        }

        override fun onLost(network: Network) {
            onNetworkStatusChanged(false)
        }
    }

    fun isConnected(): Boolean {
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    fun startMonitoring() {
        try {
            val builder = NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            connectivityManager.registerNetworkCallback(builder.build(), networkCallback)
        } catch (e: Exception) {
            // Ignored on legacy environments
        }
    }

    fun stopMonitoring() {
        try {
            connectivityManager.unregisterNetworkCallback(networkCallback)
        } catch (e: Exception) {
            // Ignored
        }
    }
}
