package com.niooon.chat

import android.app.Application
import android.util.Log
import android.webkit.WebView

class NiooonApplication : Application() {

    override fun onCreate() {
        super.onCreate()

        // Global crash guard to capture and log any unhandled runtime exceptions
        val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            Log.e("NiooonChat", "Global uncaught exception on thread ${thread.name}: ${throwable.message}", throwable)
            try {
                defaultHandler?.uncaughtException(thread, throwable)
            } catch (e: Throwable) {
                Log.e("NiooonChat", "Exception inside crash handler: ${e.message}", e)
            }
        }

        // Enable safe debugging in debug mode
        try {
            WebView.setWebContentsDebuggingEnabled(true)
        } catch (e: Throwable) {
            Log.w("NiooonChat", "Failed to set web contents debugging: ${e.message}")
        }
    }
}
