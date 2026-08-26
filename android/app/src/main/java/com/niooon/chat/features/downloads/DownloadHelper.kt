package com.niooon.chat.features.downloads

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Environment
import android.webkit.URLUtil
import android.widget.Toast

class DownloadHelper(private val context: Context) {

    fun downloadFile(url: String, userAgent: String?, contentDisposition: String?, mimeType: String?): Boolean {
        return try {
            val safeMime = mimeType ?: "application/octet-stream"
            val fileName = URLUtil.guessFileName(url, contentDisposition, safeMime)

            val request = DownloadManager.Request(Uri.parse(url)).apply {
                setMimeType(safeMime)
                if (!userAgent.isNullOrBlank()) {
                    addRequestHeader("User-Agent", userAgent)
                }
                setDescription("Downloading file from Niooon Chat...")
                setTitle(fileName)
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
            }

            val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            dm.enqueue(request)
            Toast.makeText(context, "Download started: $fileName", Toast.LENGTH_SHORT).show()
            true
        } catch (e: Exception) {
            // Fallback to opening in external browser
            try {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
                true
            } catch (err: Exception) {
                false
            }
        }
    }
}
