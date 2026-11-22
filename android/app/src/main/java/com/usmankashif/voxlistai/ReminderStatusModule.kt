package com.usmankashif.voxlistai

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
}
