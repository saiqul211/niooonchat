package com.niooon.chat

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.niooon.chat.bridge.BridgeRouter
import com.niooon.chat.bridge.NativeBridge
import com.niooon.chat.databinding.ActivityMainBinding
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

    private lateinit var fileChooserLauncher: ActivityResultLauncher<Intent>

    override fun onCreate(savedInstanceState: Bundle?) {
        // Apply theme cleanly before super.onCreate
        setTheme(R.style.AppTheme_NoActionBar)
        super.onCreate(savedInstanceState)

        try {
            binding = ActivityMainBinding.inflate(layoutInflater)
            setContentView(binding.root)
        } catch (e: Exception) {
            // Safe fallback if inflation fails
            setContentView(R.layout.activity_main)
        }

        // Strict Dark Mode Theme configuration
        setupSystemBars()

        initLaunchers()
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
            // Ignore system bars styling on unsupported devices
        }
    }

    private fun initLaunchers() {
        try {
            fileChooserLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
                if (::webViewManager.isInitialized) {
                    webViewManager.handleFileChooserResult(result.resultCode, result.data)
                }
            }
        } catch (e: Exception) {
            // Fallback
        }
    }

    private fun initBridgeAndServices() {
        bridgeRouter = BridgeRouter(
            activity = this,
            hapticHelper = hapticHelper,
            shareHelper = shareHelper,
            downloadHelper = downloadHelper,
            networkMonitor = NetworkMonitor(this) { /* placeholder */ },
            onAppReadyListener = {
                if (::binding.isInitialized) {
                    binding.layoutLoading.visibility = View.GONE
                    binding.progressBar.visibility = View.GONE
                }
            }
        )

        nativeBridge = NativeBridge(bridgeRouter)

        webViewManager = WebViewManager(
            activity = this,
            binding = binding,
            webUrlManager = webUrlManager,
            downloadHelper = downloadHelper,
            nativeBridge = nativeBridge,
            fileChooserLauncher = fileChooserLauncher
        )

        webViewManager.setupWebView { url ->
            // Page finished callback
        }

        networkMonitor = NetworkMonitor(this) { isConnected ->
            runOnUiThread {
                if (::binding.isInitialized) {
                    if (isConnected) {
                        binding.layoutOffline.visibility = View.GONE
                    } else {
                        binding.layoutOffline.visibility = View.VISIBLE
                    }
                }
                if (::webViewManager.isInitialized) {
                    webViewManager.dispatchEventToWeb("native:networkChanged", "{\"isConnected\": $isConnected}")
                }
            }
        }
        networkMonitor.startMonitoring()
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
            // Ignore
        }
    }

    private fun setupOfflineRetry() {
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
                }
            })
        } catch (e: Exception) {
            // Fallback
        }
    }

    private fun loadAppUrl(url: String) {
        if (!::binding.isInitialized) return

        if (::networkMonitor.isInitialized && !networkMonitor.isConnected()) {
            binding.layoutLoading.visibility = View.GONE
            binding.layoutOffline.visibility = View.VISIBLE
            return
        }
        binding.layoutOffline.visibility = View.GONE
        binding.webView.loadUrl(url)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        intent.dataString?.let { deepLink ->
            val targetUrl = webUrlManager.sanitizeTargetUrl(deepLink)
            loadAppUrl(targetUrl)
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
