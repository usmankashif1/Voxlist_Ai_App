package com.usmankashif.voxlistai

import android.content.ActivityNotFoundException
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.Locale

class ReminderStatusModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "ReminderStatus"

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
  fun openBatteryOptimizationSettings(promise: Promise) {
    val settingsIntent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
    } else {
      appDetailsIntent()
    }
    if (tryStartActivity(settingsIntent) || tryStartActivity(appDetailsIntent())) {
      promise.resolve(null)
    } else {
      promise.reject("E_BATTERY_SETTINGS", "Could not open battery optimization or app settings.")
    }
  }

  @ReactMethod
  fun openExactAlarmSettings(promise: Promise) {
    val settingsIntent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
        data = Uri.fromParts("package", reactApplicationContext.packageName, null)
      }
    } else {
      appDetailsIntent()
    }
    if (tryStartActivity(settingsIntent) || tryStartActivity(appDetailsIntent())) {
      promise.resolve(null)
    } else {
      promise.reject("E_EXACT_ALARM_SETTINGS", "Could not open reminder timing settings.")
    }
  }

  @ReactMethod
  fun openAppDetailsSettings(promise: Promise) {
    if (tryStartActivity(appDetailsIntent())) {
      promise.resolve(null)
    } else {
      promise.reject("E_APP_SETTINGS", "Could not open app settings.")
    }
  }

  @ReactMethod
  fun openAppNotificationSettings(promise: Promise) {
    val notificationIntent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
      putExtra(Settings.EXTRA_APP_PACKAGE, reactApplicationContext.packageName)
    }
    if (tryStartActivity(notificationIntent) || tryStartActivity(appDetailsIntent())) {
      promise.resolve(null)
    } else {
      promise.reject("E_NOTIFICATION_SETTINGS", "Could not open notification or app settings.")
    }
  }

  @ReactMethod
  fun getDeviceInfo(promise: Promise) {
    try {
      val deviceInfo = Arguments.createMap().apply {
        putString("manufacturer", Build.MANUFACTURER.orEmpty())
        putString("brand", Build.BRAND.orEmpty())
        putInt("sdkInt", Build.VERSION.SDK_INT)
        putString("osSkinHint", getOsSkinHint())
      }
      promise.resolve(deviceInfo)
    } catch (error: RuntimeException) {
      promise.reject("E_DEVICE_INFO", "Could not read device information.", error)
    }
  }

  @ReactMethod
  fun openOemAutostartSettings(promise: Promise) {
    try {
      val opened = oemAutostartTargets().any { target ->
        tryStartActivity(Intent().setComponent(target))
      }
      val openedSettings = opened || tryStartActivity(appDetailsIntent())
      promise.resolve(Arguments.createMap().apply {
        putBoolean("opened", openedSettings)
      })
    } catch (error: RuntimeException) {
      promise.reject("E_OEM_SETTINGS", "Could not open OEM background settings.", error)
    }
  }

  private fun getOsSkinHint(): String? {
    val oneUi = readSystemProperty("ro.build.version.oneui")
    if (!oneUi.isNullOrBlank()) {
      val versionCode = oneUi.toIntOrNull()
      return if (versionCode != null && versionCode > 0) {
        "One UI ${versionCode / 10000}.${(versionCode % 10000) / 100}"
      } else {
        "One UI $oneUi"
      }
    }

    val properties = listOf(
      "HyperOS" to listOf("ro.mi.os.version.name", "ro.mi.os.version.incremental"),
      "MIUI" to listOf("ro.miui.ui.version.name", "ro.build.version.miui"),
      "ColorOS" to listOf("ro.build.version.opporom", "ro.build.version.oplusrom"),
      "Funtouch OS" to listOf("ro.vivo.os.version", "ro.vivo.product.version"),
      "MagicOS" to listOf("ro.build.version.magic"),
      "EMUI" to listOf("ro.build.version.emui"),
    )
    for ((skin, keys) in properties) {
      val version = keys.firstNotNullOfOrNull { key ->
        readSystemProperty(key)?.takeIf(String::isNotBlank)
      }
      if (version != null) return "$skin $version"
    }
    return null
  }

  private fun readSystemProperty(key: String): String? {
    return try {
      val systemProperties = Class.forName("android.os.SystemProperties")
      systemProperties.getMethod("get", String::class.java)
        .invoke(null, key) as? String
    } catch (_: ReflectiveOperationException) {
      null
    } catch (_: SecurityException) {
      null
    }
  }

  private fun appDetailsIntent() = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
    data = Uri.fromParts("package", reactApplicationContext.packageName, null)
  }

  private fun tryStartActivity(intent: Intent): Boolean {
    return try {
      val activity = reactApplicationContext.currentActivity
      if (activity != null) {
        activity.startActivity(intent)
      } else {
        reactApplicationContext.startActivity(
          Intent(intent).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
      }
      true
    } catch (error: ActivityNotFoundException) {
      false
    } catch (error: SecurityException) {
      false
    } catch (error: RuntimeException) {
      false
    }
  }

  private fun oemAutostartTargets(): List<ComponentName> {
    val manufacturer = "${Build.MANUFACTURER} ${Build.BRAND}".lowercase(Locale.ROOT)
    // OEM settings activities are undocumented and can change between OS versions.
    val targets = when {
      listOf("xiaomi", "redmi", "poco").any { manufacturer.contains(it) } -> listOf(
        "com.miui.securitycenter" to "com.miui.permcenter.autostart.AutoStartManagementActivity",
      )
      listOf("oppo", "realme").any { manufacturer.contains(it) } -> listOf(
        "com.coloros.safecenter" to "com.coloros.safecenter.permission.startup.StartupAppListActivity",
        "com.oplus.safecenter" to "com.oplus.safecenter.permission.startup.StartupAppListActivity",
      )
      "oneplus" in manufacturer -> listOf(
        "com.oneplus.security" to "com.oneplus.security.chainlaunch.view.ChainLaunchAppListActivity",
      )
      listOf("vivo", "iqoo").any { manufacturer.contains(it) } -> listOf(
        "com.iqoo.secure" to "com.iqoo.secure.safeguard.PurviewTabActivity",
        "com.vivo.permissionmanager" to "com.vivo.permissionmanager.activity.BgStartUpManagerActivity",
      )
      listOf("huawei", "honor").any { manufacturer.contains(it) } -> listOf(
        "com.huawei.systemmanager" to "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity",
        "com.huawei.systemmanager" to "com.huawei.systemmanager.appcontrol.activity.StartupAppControlActivity",
      )
      "samsung" in manufacturer -> listOf(
        "com.samsung.android.sm" to "com.samsung.android.sm.app.dashboard.SmartManagerDashBoardActivity",
      )
      listOf("tecno", "infinix", "itel").any { manufacturer.contains(it) } -> listOf(
        "com.transsion.phonemanager" to "com.transsion.phonemanager.ui.activity.AppManagerActivity",
      )
      else -> emptyList()
    }
    return targets.map { (packageName, className) ->
      ComponentName(packageName, className)
    }
  }
}
