package com.niooon.chat.features.sharing

import android.content.Context
import android.content.Intent

class ShareHelper(private val context: Context) {

    fun shareText(title: String, text: String): Boolean {
        return try {
            val sendIntent = Intent().apply {
                action = Intent.ACTION_SEND
                putExtra(Intent.EXTRA_TEXT, text)
                putExtra(Intent.EXTRA_TITLE, title)
                type = "text/plain"
            }
            val chooserIntent = Intent.createChooser(sendIntent, title).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(chooserIntent)
            true
        } catch (e: Exception) {
            false
        }
    }
}
