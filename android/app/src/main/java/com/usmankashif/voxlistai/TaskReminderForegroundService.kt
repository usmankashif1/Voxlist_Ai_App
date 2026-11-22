package com.usmankashif.voxlistai

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat

class TaskReminderForegroundService : Service() {
  private var isForeground = false

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val serviceRequested = preferences().getBoolean(KEY_SERVICE_REQUESTED, false)

    if (intent?.action == ACTION_STOP || !serviceRequested) {
      if (isForeground) {
        removeForegroundNotification()
        isForeground = false
      }
      stopSelf(startId)
      return START_NOT_STICKY
    }

    if (intent?.action == ACTION_UPDATE && isForeground) {
      getSystemService(NotificationManager::class.java)
        .notify(NOTIFICATION_ID, buildStatusNotification())
    } else {
      startInForeground()
    }

    return START_STICKY
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun startInForeground() {
    val serviceType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
    } else {
      0
    }
    ServiceCompat.startForeground(
      this,
      NOTIFICATION_ID,
      buildStatusNotification(),
      serviceType
    )
    isForeground = true
  }

  private fun removeForegroundNotification() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      stopForeground(STOP_FOREGROUND_REMOVE)
    } else {
      @Suppress("DEPRECATION")
      stopForeground(true)
    }
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

    val channel = NotificationChannel(
      CHANNEL_ID,
      CHANNEL_NAME,
      NotificationManager.IMPORTANCE_LOW
    ).apply {
      description = "Quiet status for task reminders."
      setSound(null, null)
      enableVibration(false)
      setShowBadge(false)
    }

    getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
  }

  private fun buildStatusNotification() =
    NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(R.drawable.notification_icon)
      // .setContentTitle("Task reminders")
      // .setContentText(getStatusText())
      .setContentIntent(createContentIntent())
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setSilent(true)
      .setShowWhen(false)
      .build()

  private fun getStatusText(): String {
    val preferences = preferences()
    if (!preferences.contains(KEY_DUE_TASK_COUNT)) return "Reminders active"

    val count = preferences.getInt(KEY_DUE_TASK_COUNT, -1)
    if (count < 0) return "Reminders active"

    return when (count) {
      1 -> "1 task due"
      else -> "$count tasks due"
    }
  }

  private fun createContentIntent(): PendingIntent {
    val launchIntent = Intent(this, MainActivity::class.java).apply {
      action = Intent.ACTION_MAIN
      addCategory(Intent.CATEGORY_LAUNCHER)
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED
    }
    return PendingIntent.getActivity(
      this,
      CONTENT_REQUEST_CODE,
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private fun preferences() =
    getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)

  companion object {
    private const val CHANNEL_ID = "app-status"
    private const val CHANNEL_NAME = "App status"
    private const val NOTIFICATION_ID = 4201
    private const val CONTENT_REQUEST_CODE = 4202
    private const val PREFERENCES_NAME = "reminder_status"
    private const val KEY_DUE_TASK_COUNT = "due_task_count"
    private const val KEY_SERVICE_REQUESTED = "service_requested"
    private const val ACTION_START = "com.usmankashif.voxlistai.action.START_REMINDER_SERVICE"
    private const val ACTION_UPDATE = "com.usmankashif.voxlistai.action.UPDATE_REMINDER_STATUS"
    private const val ACTION_STOP = "com.usmankashif.voxlistai.action.STOP_REMINDER_SERVICE"

    fun setDueTaskCount(context: Context, count: Int) {
      val preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
      preferences.edit().putInt(KEY_DUE_TASK_COUNT, count).apply()
      if (preferences.getBoolean(KEY_SERVICE_REQUESTED, false)) {
        ContextCompat.startForegroundService(
          context,
          serviceIntent(context, ACTION_UPDATE)
        )
      }
    }

    fun start(context: Context) {
      context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
        .edit()
        .putBoolean(KEY_SERVICE_REQUESTED, true)
        .apply()
      ContextCompat.startForegroundService(context, serviceIntent(context, ACTION_START))
    }

    fun stop(context: Context) {
      val preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
      val serviceRequested = preferences.getBoolean(KEY_SERVICE_REQUESTED, false)
      preferences.edit().putBoolean(KEY_SERVICE_REQUESTED, false).apply()
      if (serviceRequested) {
        context.startService(serviceIntent(context, ACTION_STOP))
      }
    }

    private fun serviceIntent(context: Context, action: String) =
      Intent(context, TaskReminderForegroundService::class.java).setAction(action)
  }
}
