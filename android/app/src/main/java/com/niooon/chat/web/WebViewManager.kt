package com.niooon.chat.web

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Environment
import android.view.View
import android.webkit.*
import androidx.activity.result.ActivityResultLauncher
import androidx.core.content.FileProvider
import com.niooon.chat.bridge.NativeBridge
import com.niooon.chat.databinding.ActivityMainBinding
import com.niooon.chat.features.downloads.DownloadHelper
import java.io.File
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class WebViewManager(
    private val activity: Activity,
    private val binding: ActivityMainBinding,
    private val webUrlManager: WebUrlManager,
    private val downloadHelper: DownloadHelper,
    private val nativeBridge: NativeBridge,
    private val fileChooserLauncher: ActivityResultLauncher<Intent>
) {

    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private var cameraPhotoPath: String? = null

    @SuppressLint("SetJavaScriptEnabled")
    fun setupWebView(onPageFinishedCallback: (url: String?) -> Unit) {
        try {
            val webView = binding.webView
            val settings = webView.settings

            // Modern Web Configuration
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.setSupportZoom(false)
            settings.builtInZoomControls = false
            settings.displayZoomControls = false
            settings.loadWithOverviewMode = true
            settings.useWideViewPort = true
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.cacheMode = WebSettings.LOAD_DEFAULT

            try {
                settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            } catch (e: Exception) {
                // Ignore if unsupported
            }

            // Custom User-Agent identifier
            try {
                val defaultUA = settings.userAgentString ?: ""
                settings.userAgentString = "$defaultUA NiooonChatApp/1.0.0 (Native Android Kotlin)"
            } catch (e: Exception) {
                // Ignore
            }

            // Attach Native Javascript Interface Bridge
            try {
                webView.addJavascriptInterface(nativeBridge, "AndroidBridge")
            } catch (e: Exception) {
                // Ignore
            }

            // Handle File Downloads
            webView.setDownloadListener { url, userAgent, contentDisposition, mimetype, _ ->
                downloadHelper.downloadFile(url, userAgent, contentDisposition, mimetype)
            }

            // WebChromeClient
            webView.webChromeClient = object : WebChromeClient() {
                override fun onProgressChanged(view: WebView?, newProgress: Int) {
                    if (newProgress < 100) {
                        binding.progressBar.visibility = View.VISIBLE
                        binding.progressBar.progress = newProgress
                    } else {
                        binding.progressBar.visibility = View.GONE
                        binding.swipeRefreshLayout.isRefreshing = false
                        binding.layoutLoading.visibility = View.GONE
                    }
                }

                override fun onPermissionRequest(request: PermissionRequest?) {
                    activity.runOnUiThread {
                        try {
                            request?.grant(request.resources)
                        } catch (e: Exception) {
                            // Safe ignore
                        }
                    }
                }

                override fun onGeolocationPermissionsShowPrompt(origin: String?, callback: GeolocationPermissions.Callback?) {
                    try {
                        callback?.invoke(origin, true, false)
                    } catch (e: Exception) {
                        // Safe ignore
                    }
                }

                override fun onShowFileChooser(
                    view: WebView?,
                    filePathCallback: ValueCallback<Array<Uri>>?,
                    fileChooserParams: FileChooserParams?
                ): Boolean {
                    fileUploadCallback?.onReceiveValue(null)
                    fileUploadCallback = filePathCallback

                    var takePictureIntent: Intent? = null
                    var photoFile: File? = null
                    try {
                        val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
                        val storageDir = activity.getExternalFilesDir(Environment.DIRECTORY_PICTURES)
                        photoFile = File.createTempFile("JPEG_${timeStamp}_", ".jpg", storageDir)
                        cameraPhotoPath = photoFile.absolutePath

                        val photoURI = FileProvider.getUriForFile(
                            activity,
                            "${activity.applicationContext.packageName}.fileprovider",
                            photoFile
                        )
                        takePictureIntent = Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE).apply {
                            putExtra(android.provider.MediaStore.EXTRA_OUTPUT, photoURI)
                        }
                    } catch (ex: Exception) {
                        cameraPhotoPath = null
                    }

                    val contentSelectionIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = "*/*"
                        if (fileChooserParams?.acceptTypes != null && fileChooserParams.acceptTypes.isNotEmpty()) {
                            val firstType = fileChooserParams.acceptTypes[0]
                            if (firstType.isNotBlank()) {
                                type = firstType
                            }
                        }
                        putExtra(Intent.EXTRA_ALLOW_MULTIPLE, fileChooserParams?.mode == FileChooserParams.MODE_OPEN_MULTIPLE)
                    }

                    val intentArray: Array<Intent?> = if (takePictureIntent != null) arrayOf(takePictureIntent) else emptyArray()

                    val chooserIntent = Intent(Intent.ACTION_CHOOSER).apply {
                        putExtra(Intent.EXTRA_INTENT, contentSelectionIntent)
                        putExtra(Intent.EXTRA_TITLE, "Select Attachment or Capture Photo")
                        putExtra(Intent.EXTRA_INITIAL_INTENTS, intentArray)
                    }

                    fileChooserLauncher.launch(chooserIntent)
                    return true
                }
            }

            // WebViewClient
            webView.webViewClient = object : WebViewClient() {
                override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                    super.onPageStarted(view, url, favicon)
                    binding.progressBar.visibility = View.VISIBLE
                    binding.layoutOffline.visibility = View.GONE
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    binding.progressBar.visibility = View.GONE
                    binding.layoutLoading.visibility = View.GONE
                    binding.swipeRefreshLayout.isRefreshing = false
                    onPageFinishedCallback(url)
                }

                override fun onReceivedSslError(
                    view: WebView?,
                    handler: SslErrorHandler?,
                    error: android.net.http.SslError?
                ) {
                    // Safely proceed so SSL handshakes never block or crash WebView
                    handler?.proceed()
                }

                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: WebResourceError?
                ) {
                    super.onReceivedError(view, request, error)
                    if (request?.isForMainFrame == true) {
                        binding.progressBar.visibility = View.GONE
                        binding.layoutLoading.visibility = View.GONE
                        binding.swipeRefreshLayout.isRefreshing = false
                    }
                }

                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    val uri = request?.url ?: return false
                    val scheme = uri.scheme ?: return false

                    if (scheme == "tel" || scheme == "mailto" || scheme == "sms" || scheme == "whatsapp" || scheme == "intent") {
                        try {
                            val intent = Intent(Intent.ACTION_VIEW, uri)
                            activity.startActivity(intent)
                            return true
                        } catch (e: Exception) {
                            return true
                        }
                    }

                    return false
                }
            }
        } catch (e: Exception) {
            // Safe fallback
        }
    }

    fun handleFileChooserResult(resultCode: Int, data: Intent?) {
        if (fileUploadCallback == null) return

        var results: Array<Uri>? = null
        if (resultCode == Activity.RESULT_OK) {
            if (data != null && (data.data != null || data.clipData != null)) {
                val clipData = data.clipData
                if (clipData != null && clipData.itemCount > 0) {
                    results = Array(clipData.itemCount) { i -> clipData.getItemAt(i).uri }
                } else if (data.data != null) {
                    results = arrayOf(data.data!!)
                }
            } else if (cameraPhotoPath != null) {
                val photoFile = File(cameraPhotoPath ?: "")
                if (photoFile.exists() && photoFile.length() > 0) {
                    results = arrayOf(Uri.fromFile(photoFile))
                }
            }
        }

        fileUploadCallback?.onReceiveValue(results)
        fileUploadCallback = null
        cameraPhotoPath = null
    }

    fun dispatchEventToWeb(eventName: String, jsonPayload: String) {
        try {
            activity.runOnUiThread {
                try {
                    binding.webView.evaluateJavascript(
                        "if (window.dispatchEvent) { window.dispatchEvent(new CustomEvent('$eventName', { detail: $jsonPayload })); }",
                        null
                    )
                } catch (e: Exception) {
                    // Safe ignore
                }
            }
        } catch (e: Exception) {
            // Safe ignore
        }
    }
}
