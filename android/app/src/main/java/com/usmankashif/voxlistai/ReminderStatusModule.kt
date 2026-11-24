package com.usmankashif.voxlistai

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ReminderStatusModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "ReminderStatus"

  @ReactMethod
  fun setDueTaskCount(count: Int, promise: Promise) {
    if (count < 0) {
      promise.reject("E_INVALID_DUE_TASK_COUNT", "Due-task count cannot be negative.")
      return
    }
    try {
      TaskReminderForegroundService.setDueTaskCount(reactApplicationContext, count)
      promise.resolve(null)
    } catch (error: RuntimeException) {
      promise.reject("E_REMINDER_STATUS_UPDATE", "Could not update reminder status.", error)
    }
  }

  @ReactMethod
  fun startForegroundReminderService(promise: Promise) {
    try {
      TaskReminderForegroundService.start(reactApplicationContext)
      promise.resolve(null)
    } catch (error: RuntimeException) {
      promise.reject("E_REMINDER_SERVICE_START", "Could not start the reminder service.", error)
    }
  }

  @ReactMethod
  fun stopForegroundReminderService(promise: Promise) {
    try {
      TaskReminderForegroundService.stop(reactApplicationContext)
      promise.resolve(null)
    } catch (error: RuntimeException) {
      promise.reject("E_REMINDER_SERVICE_STOP", "Could not stop the reminder service.", error)
    }
  }

  @ReactMethod
  fun isIgnoringBatteryOptimizations(promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
        promise.resolve(true)
        return
      }

      val powerManager = reactApplicationContext
        .getSystemService(Context.POWER_SERVICE) as? PowerManager
      if (powerManager == null) {
        promise.reject("E_BATTERY_STATUS", "Could not read battery optimization status.")
        return
      }
      promise.resolve(powerManager.isIgnoringBatteryOptimizations(reactApplicationContext.packageName))
    } catch (error: RuntimeException) {
      promise.reject("E_BATTERY_STATUS", "Could not read battery optimization status.", error)
    }
  }

  @ReactMethod
  fun requestBatteryOptimizationExemption(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      promise.resolve(null)
      return
    }

    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("E_BATTERY_SETTINGS", "Could not open battery optimization settings.")
      return
    }

    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
      data = Uri.parse("package:${reactApplicationContext.packageName}")
    }
    try {
      activity.startActivity(intent)
      promise.resolve(null)
    } catch (error: ActivityNotFoundException) {
      promise.reject("E_BATTERY_SETTINGS", "Could not open battery optimization settings.", error)
    } catch (error: RuntimeException) {
      promise.reject("E_BATTERY_SETTINGS", "Could not open battery optimization settings.", error)
    }
  }
}
