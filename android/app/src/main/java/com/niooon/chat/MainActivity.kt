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
        super.onCreate(savedInstanceState)

        // Strict Dark Mode Theme configuration
        setupSystemBars()

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        initLaunchers()
        initBridgeAndServices()
        setupSwipeRefresh()
        setupOfflineRetry()
        setupBackNavigation()

        // Load targeted application URL or deep link
        val initialUrl = webUrlManager.sanitizeTargetUrl(intent?.dataString)
        loadAppUrl(initialUrl)
    }

    private fun setupSystemBars() {
        WindowCompat.setDecorFitsSystemWindows(window, true)
        window.statusBarColor = ContextCompat.getColor(this, R.color.colorPrimary)
        window.navigationBarColor = ContextCompat.getColor(this, R.color.colorPrimary)

        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.isAppearanceLightStatusBars = false
        controller.isAppearanceLightNavigationBars = false
    }

    private fun initLaunchers() {
        fileChooserLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            webViewManager.handleFileChooserResult(result.resultCode, result.data)
        }
    }

    private fun initBridgeAndServices() {
        networkMonitor = NetworkMonitor(this) { isConnected ->
            runOnUiThread {
                if (isConnected) {
                    binding.layoutOffline.visibility = View.GONE
                } else {
                    binding.layoutOffline.visibility = View.VISIBLE
                }
                webViewManager.dispatchEventToWeb("native:networkChanged", "{\"isConnected\": $isConnected}")
            }
        }
        networkMonitor.startMonitoring()

        bridgeRouter = BridgeRouter(
            activity = this,
            hapticHelper = hapticHelper,
            shareHelper = shareHelper,
            downloadHelper = downloadHelper,
            networkMonitor = networkMonitor,
            onAppReadyListener = {
                binding.layoutLoading.visibility = View.GONE
                binding.progressBar.visibility = View.GONE
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
    }

    private fun setupSwipeRefresh() {
        binding.swipeRefreshLayout.setColorSchemeColors(
            ContextCompat.getColor(this, R.color.colorAccent)
        )
        binding.swipeRefreshLayout.setProgressBackgroundColorSchemeColor(
            ContextCompat.getColor(this, R.color.cardBackground)
        )

        binding.swipeRefreshLayout.setOnRefreshListener {
            if (networkMonitor.isConnected()) {
                binding.webView.reload()
            } else {
                binding.swipeRefreshLayout.isRefreshing = false
                binding.layoutOffline.visibility = View.VISIBLE
            }
        }

        binding.webView.viewTreeObserver.addOnScrollChangedListener {
            binding.swipeRefreshLayout.isEnabled = binding.webView.scrollY == 0
        }
    }

    private fun setupOfflineRetry() {
        binding.btnRetry.setOnClickListener {
            if (networkMonitor.isConnected()) {
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
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
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
    }

    private fun loadAppUrl(url: String) {
        if (!networkMonitor.isConnected()) {
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
        binding.webView.onResume()
        webViewManager.dispatchEventToWeb("native:lifecycle", "{\"state\": \"resumed\"}")
    }

    override fun onPause() {
        binding.webView.onPause()
        webViewManager.dispatchEventToWeb("native:lifecycle", "{\"state\": \"paused\"}")
        super.onPause()
    }

    override fun onDestroy() {
        networkMonitor.stopMonitoring()
        binding.webView.destroy()
        super.onDestroy()
    }
}
