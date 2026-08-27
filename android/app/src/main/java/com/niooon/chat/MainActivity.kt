package com.niooon.chat

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.niooon.chat.bridge.BridgeRouter
import com.niooon.chat.bridge.NativeBridge
import com.niooon.chat.databinding.ActivityMainBinding
import com.niooon.chat.features.calling.CallManager
import com.niooon.chat.features.downloads.DownloadHelper
import com.niooon.chat.features.haptics.HapticHelper
import com.niooon.chat.features.network.NetworkMonitor
import com.niooon.chat.features.sharing.ShareHelper
import com.niooon.chat.web.WebUrlManager
import com.niooon.chat.web.WebViewManager

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    // Feature Helpers
    private val hapticHelper by lazy { HapticHelper(this) }
    private val shareHelper by lazy { ShareHelper(this) }
    private val downloadHelper by lazy { DownloadHelper(this) }
    private val webUrlManager by lazy { WebUrlManager(this) }

    private lateinit var networkMonitor: NetworkMonitor
    private lateinit var bridgeRouter: BridgeRouter
    private lateinit var nativeBridge: NativeBridge
    private lateinit var webViewManager: WebViewManager

    private val fileChooserLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        try {
            if (::webViewManager.isInitialized) {
                webViewManager.handleFileChooserResult(result.resultCode, result.data)
            }
        } catch (e: Exception) {
            Log.e("NiooonChat", "Error handling file chooser result: ${e.message}")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        setTheme(R.style.AppTheme_NoActionBar)
        super.onCreate(savedInstanceState)

        try {
            binding = ActivityMainBinding.inflate(layoutInflater)
            setContentView(binding.root)
        } catch (e: Throwable) {
            Log.e("NiooonChat", "Fatal view inflation exception: ${e.message}", e)
            return
        }

        // Strict Dark Mode Theme configuration
        setupSystemBars()

        initBridgeAndServices()
        setupSwipeRefresh()
        setupOfflineRetry()
        setupBackNavigation()

        // Load targeted application URL or deep link
        try {
            val initialUrl = webUrlManager.sanitizeTargetUrl(intent?.dataString)
            loadAppUrl(initialUrl)
        } catch (e: Exception) {
            loadAppUrl(webUrlManager.liveUrl)
        }
    }

    private fun setupSystemBars() {
        try {
            WindowCompat.setDecorFitsSystemWindows(window, true)
            window.statusBarColor = ContextCompat.getColor(this, R.color.colorPrimary)
            window.navigationBarColor = ContextCompat.getColor(this, R.color.colorPrimary)

            val controller = WindowInsetsControllerCompat(window, window.decorView)
            controller.isAppearanceLightStatusBars = false
            controller.isAppearanceLightNavigationBars = false
        } catch (e: Exception) {
            Log.w("NiooonChat", "Failed to style system bars: ${e.message}")
        }
    }

    private fun initBridgeAndServices() {
        try {
            networkMonitor = NetworkMonitor(this) { isConnected ->
                runOnUiThread {
                    if (!isFinishing && !isDestroyed) {
                        if (::binding.isInitialized) {
                            if (isConnected) {
                                binding.layoutOffline.visibility = View.GONE
                                val currentUrl = binding.webView.url
                                if (currentUrl.isNullOrBlank() || currentUrl == "about:blank") {
                                    loadAppUrl(webUrlManager.liveUrl)
                                }
                            } else {
                                if (binding.webView.url.isNullOrBlank() || binding.webView.url == "about:blank") {
                                    binding.layoutOffline.visibility = View.VISIBLE
                                }
                            }
                        }
                        if (::webViewManager.isInitialized) {
                            webViewManager.dispatchEventToWeb("native:networkChanged", "{\"isConnected\": $isConnected}")
                        }
                    }
                }
            }

            bridgeRouter = BridgeRouter(
                activity = this,
                hapticHelper = hapticHelper,
                shareHelper = shareHelper,
                downloadHelper = downloadHelper,
                networkMonitor = networkMonitor,
                onAppReadyListener = {
                    runOnUiThread {
                        if (::binding.isInitialized && !isFinishing && !isDestroyed) {
                            binding.layoutLoading.visibility = View.GONE
                            binding.progressBar.visibility = View.GONE
                        }
                    }
                }
            )

            nativeBridge = NativeBridge(bridgeRouter)

            CallManager.init(this)
            CallManager.webEventDispatcher = { eventName, payloadJson ->
                runOnUiThread {
                    if (::webViewManager.isInitialized && !isFinishing && !isDestroyed) {
                        webViewManager.dispatchEventToWeb(eventName, payloadJson)
                    }
                }
            }

            webViewManager = WebViewManager(
                activity = this,
                binding = binding,
                webUrlManager = webUrlManager,
                downloadHelper = downloadHelper,
                nativeBridge = nativeBridge,
                fileChooserLauncher = fileChooserLauncher
            )

            webViewManager.setupWebView { _ ->
                // Page finished callback
            }

            networkMonitor.startMonitoring()
        } catch (e: Exception) {
            Log.e("NiooonChat", "Error initializing bridge & services: ${e.message}", e)
        }
    }

    private fun setupSwipeRefresh() {
        try {
            binding.swipeRefreshLayout.setColorSchemeColors(
                ContextCompat.getColor(this, R.color.colorAccent)
            )
            binding.swipeRefreshLayout.setProgressBackgroundColorSchemeColor(
                ContextCompat.getColor(this, R.color.cardBackground)
            )

            binding.swipeRefreshLayout.setOnRefreshListener {
                if (::networkMonitor.isInitialized && networkMonitor.isConnected()) {
                    binding.webView.reload()
                } else {
                    binding.swipeRefreshLayout.isRefreshing = false
                    binding.layoutOffline.visibility = View.VISIBLE
                }
            }

            binding.webView.viewTreeObserver?.addOnScrollChangedListener {
                try {
                    binding.swipeRefreshLayout.isEnabled = binding.webView.scrollY == 0
                } catch (e: Exception) {
                    // Ignore
                }
            }
        } catch (e: Exception) {
            Log.w("NiooonChat", "Error setting up swipe refresh: ${e.message}")
        }
    }

    private fun setupOfflineRetry() {
        try {
            binding.btnRetry.setOnClickListener {
                if (::networkMonitor.isInitialized && networkMonitor.isConnected()) {
                    binding.layoutOffline.visibility = View.GONE
                    binding.layoutLoading.visibility = View.VISIBLE
                    val urlToLoad = binding.webView.url ?: webUrlManager.liveUrl
                    loadAppUrl(urlToLoad)
                } else {
                    Toast.makeText(this, "Network still unavailable. Please check your connection.", Toast.LENGTH_SHORT).show()
                }
            }
        } catch (e: Exception) {
            Log.w("NiooonChat", "Error setting up offline retry: ${e.message}")
        }
    }

    private fun setupBackNavigation() {
        try {
            onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    if (!::binding.isInitialized) {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                        return
                    }

                    try {
                        binding.webView.evaluateJavascript(
                            "typeof window.__onAndroidBackPress === 'function' ? window.__onAndroidBackPress() : false"
                        ) { result ->
                            val handledByWeb = result == "true"
                            if (!handledByWeb) {
                                if (binding.webView.canGoBack()) {
                                    binding.webView.goBack()
                                } else {
                                    isEnabled = false
                                    onBackPressedDispatcher.onBackPressed()
                                }
                            }
                        }
                    } catch (e: Exception) {
                        if (binding.webView.canGoBack()) {
                            binding.webView.goBack()
                        } else {
                            isEnabled = false
                            onBackPressedDispatcher.onBackPressed()
                        }
                    }
                }
            })
        } catch (e: Exception) {
            Log.w("NiooonChat", "Error setting up back navigation: ${e.message}")
        }
    }

    private fun loadAppUrl(url: String) {
        try {
            if (!::binding.isInitialized) return

            binding.layoutOffline.visibility = View.GONE
            binding.progressBar.visibility = View.VISIBLE
            binding.webView.loadUrl(url)
        } catch (e: Exception) {
            Log.e("NiooonChat", "Error loading app URL: ${e.message}", e)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        try {
            setIntent(intent)
            intent.dataString?.let { deepLink ->
                val targetUrl = webUrlManager.sanitizeTargetUrl(deepLink)
                loadAppUrl(targetUrl)
            }
        } catch (e: Exception) {
            Log.e("NiooonChat", "Error onNewIntent: ${e.message}", e)
        }
    }

    override fun onResume() {
        super.onResume()
        try {
            if (::binding.isInitialized) {
                binding.webView.onResume()
            }
            if (::webViewManager.isInitialized) {
                webViewManager.dispatchEventToWeb("native:lifecycle", "{\"state\": \"resumed\"}")
            }
        } catch (e: Exception) {
            // Safe ignore
        }
    }

    override fun onPause() {
        try {
            if (::binding.isInitialized) {
                binding.webView.onPause()
            }
            if (::webViewManager.isInitialized) {
                webViewManager.dispatchEventToWeb("native:lifecycle", "{\"state\": \"paused\"}")
            }
        } catch (e: Exception) {
            // Safe ignore
        }
        super.onPause()
    }

    override fun onDestroy() {
        try {
            if (::networkMonitor.isInitialized) {
                networkMonitor.stopMonitoring()
            }
            if (::binding.isInitialized) {
                binding.webView.stopLoading()
                binding.webView.destroy()
            }
        } catch (e: Exception) {
            // Safe ignore
        }
        super.onDestroy()
    }
}
