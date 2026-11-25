import { NativeModules, Platform } from 'react-native';

interface ReminderStatusNativeModule {
    isIgnoringBatteryOptimizations: () => Promise<boolean>;
    openBatteryOptimizationSettings: () => Promise<void>;
    openExactAlarmSettings: () => Promise<void>;
    openAppDetailsSettings: () => Promise<void>;
    openAppNotificationSettings: () => Promise<void>;
    getDeviceInfo: () => Promise<ReminderDeviceInfo>;
    openOemAutostartSettings: () => Promise<{ opened: boolean }>;
}

export interface ReminderDeviceInfo {
    manufacturer: string;
    brand: string;
    sdkInt: number;
    osSkinHint: string | null;
}

const nativeModule = NativeModules.ReminderStatus as
    | ReminderStatusNativeModule
    | undefined;

const getNativeModule = (): ReminderStatusNativeModule => {
    if (!nativeModule) {
        throw new Error('Android reminder status module is unavailable.');
    }
    return nativeModule;
};

export const isIgnoringBatteryOptimizations = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    return getNativeModule().isIgnoringBatteryOptimizations();
};

export const openBatteryOptimizationSettings = async (): Promise<void> => {
    if (Platform.OS !== 'android') return;
    await getNativeModule().openBatteryOptimizationSettings();
};

export const openExactAlarmSettings = async (): Promise<void> => {
    if (Platform.OS !== 'android') return;
    await getNativeModule().openExactAlarmSettings();
};

export const openAppDetailsSettings = async (): Promise<void> => {
    if (Platform.OS !== 'android') return;
    await getNativeModule().openAppDetailsSettings();
};

export const openAppNotificationSettings = async (): Promise<void> => {
    if (Platform.OS !== 'android') return;
    await getNativeModule().openAppNotificationSettings();
};

export const getReminderDeviceInfo = async (): Promise<ReminderDeviceInfo> => {
    if (Platform.OS !== 'android') {
        return { manufacturer: '', brand: '', sdkInt: 0, osSkinHint: null };
    }
    return getNativeModule().getDeviceInfo();
};

export const openOemAutostartSettings = async (): Promise<{ opened: boolean }> => {
    if (Platform.OS !== 'android') return { opened: false };
    return getNativeModule().openOemAutostartSettings();
};
