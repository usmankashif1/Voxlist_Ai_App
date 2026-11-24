import { NativeModules, Platform } from 'react-native';

interface ReminderStatusNativeModule {
    setDueTaskCount: (count: number) => Promise<void>;
    startForegroundReminderService: () => Promise<void>;
    stopForegroundReminderService: () => Promise<void>;
    isIgnoringBatteryOptimizations: () => Promise<boolean>;
    requestBatteryOptimizationExemption: () => Promise<void>;
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

export const setDueTaskCount = async (count: number): Promise<void> => {
    if (Platform.OS !== 'android') return;
    await getNativeModule().setDueTaskCount(count);
};

export const startForegroundReminderService = async (): Promise<void> => {
    if (Platform.OS !== 'android') return;
    await getNativeModule().startForegroundReminderService();
};

export const stopForegroundReminderService = async (): Promise<void> => {
    if (Platform.OS !== 'android') return;
    await getNativeModule().stopForegroundReminderService();
};

export const isIgnoringBatteryOptimizations = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    return getNativeModule().isIgnoringBatteryOptimizations();
};

export const requestBatteryOptimizationExemption = async (): Promise<void> => {
    if (Platform.OS !== 'android') return;
    await getNativeModule().requestBatteryOptimizationExemption();
};
