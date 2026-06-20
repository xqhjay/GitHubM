package com.github.manager

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import java.util.concurrent.ConcurrentHashMap

/**
 * 前台下载服务：保活进程，确保 APP 切到后台后下载不中断。
 *
 * 启动方式（MainActivity 调用）：
 *   Intent(context, DownloadService::class.java).apply {
 *       action = DownloadService.ACTION_START
 *       putExtra("url", url)
 *       putExtra("fileName", fileName)
 *       putExtra("token", token)
 *   }
 *
 * 取消方式：
 *   Intent(context, DownloadService::class.java).apply {
 *       action = DownloadService.ACTION_CANCEL
 *       putExtra("fileName", fileName)
 *   }
 */
class DownloadService : Service() {

    companion object {
        const val ACTION_START  = "com.github.manager.DOWNLOAD_START"
        const val ACTION_CANCEL = "com.github.manager.DOWNLOAD_CANCEL"

        private const val CHANNEL_ID    = "download_service_channel"
        private const val FOREGROUND_ID = 9999  // 前台 Notification ID（固定，代表"服务正在运行"）
    }

    // 协程作用域：绑定 Service 生命周期，Service 销毁时自动取消
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    // 正在进行的下载任务：fileName → Job
    private val activeJobs = ConcurrentHashMap<String, Job>()

    // ── 生命周期 ─────────────────────────────────────────────────────

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        // 立即进入前台，否则 Android 8+ 会在 5 秒后 ANR/Kill
        startForeground(FOREGROUND_ID, buildServiceNotification("下载服务运行中"))
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START  -> handleStart(intent)
            ACTION_CANCEL -> handleCancel(intent)
        }
        // START_STICKY：服务被系统杀死后自动重启（重启时 intent 为 null，仅保持前台存活）
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null  // 非绑定服务

    // ── 下载逻辑 ─────────────────────────────────────────────────────

    private fun handleStart(intent: Intent) {
        val url      = intent.getStringExtra("url")      ?: return
        val fileName = intent.getStringExtra("fileName") ?: return
        val token    = intent.getStringExtra("token")    ?: ""

        // 如果该文件已经在下载中，忽略重复请求
        if (activeJobs[fileName]?.isActive == true) return

        val job = serviceScope.launch {
            try {
                FastDownloader.download(applicationContext, url, fileName, token)
            } finally {
                activeJobs.remove(fileName)
                // 没有活跃任务时自动停止服务（释放资源、撤销前台通知）
                if (activeJobs.isEmpty()) {
                    stopSelf()
                }
            }
        }
        activeJobs[fileName] = job
        updateServiceNotification()
    }

    private fun handleCancel(intent: Intent) {
        val fileName = intent.getStringExtra("fileName") ?: return
        activeJobs[fileName]?.cancel()
        activeJobs.remove(fileName)
        if (activeJobs.isEmpty()) {
            stopSelf()
        }
    }

    // ── 通知辅助 ─────────────────────────────────────────────────────

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "后台下载服务",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "保持下载任务在后台持续运行"
                setShowBadge(false)
            }
            getSystemService(NotificationManager::class.java)
                .createNotificationChannel(channel)
        }
    }

    private fun buildServiceNotification(text: String) =
        NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setContentTitle("GitHub 管理器")
            .setContentText(text)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setSilent(true)
            .build()

    private fun updateServiceNotification() {
        val count = activeJobs.size
        val text = if (count == 1) "正在下载 1 个文件..." else "正在同时下载 $count 个文件..."
        startForeground(FOREGROUND_ID, buildServiceNotification(text))
    }
}
