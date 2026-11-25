import {
    AndroidImportance,
    getExactAlarmPermissionsAsync,
    getNotificationChannelAsync,
    getPermissionsAsync,
} from 'expo-notifications';
import { Platform } from 'react-native';
import { ANDROID_CHANNEL_ID } from '../permissions/permissionService';
import {
    getReminderDeviceInfo,
    isIgnoringBatteryOptimizations,
    type ReminderDeviceInfo,
} from '../notifications/reminderStatus';
import { getBrandGuide } from './brandGuides';

export type ReminderStepState = 'on' | 'off' | 'unknown';

export interface ReminderHealthStatus {
    notifications: ReminderStepState;
    exactAlarms: ReminderStepState;
    batteryActivity: ReminderStepState;
    notificationsApplicable: boolean;
    exactAlarmsApplicable: boolean;
    deviceInfo: ReminderDeviceInfo;
}

const getNotificationState = (
    permission: PromiseSettledResult<Awaited<ReturnType<typeof getPermissionsAsync>>>,
    channel: PromiseSettledResult<Awaited<ReturnType<typeof getNotificationChannelAsync>>>,
    supportsNotificationChannels: boolean,
): ReminderStepState => {
    if (permission.status === 'fulfilled' && !permission.value.granted) return 'off';
    if (permission.status !== 'fulfilled') return 'unknown';
    if (!supportsNotificationChannels) return 'on';
    if (channel.status !== 'fulfilled') return 'unknown';
    if (!channel.value) return 'unknown';
    return channel.value.importance >= AndroidImportance.HIGH ? 'on' : 'off';
};

export const getReminderHealthStatus = async (): Promise<ReminderHealthStatus> => {
    const deviceInfo = await getReminderDeviceInfo();
    if (Platform.OS !== 'android') {
        return {
            notifications: 'on',
            exactAlarms: 'on',
            batteryActivity: 'on',
            notificationsApplicable: false,
            exactAlarmsApplicable: false,
            deviceInfo,
        };
    }

    const exactAlarmsApplicable = deviceInfo.sdkInt >= 31;
    const notificationsApplicable = deviceInfo.sdkInt >= 33;
    const [notificationPermission, channel, exactAlarms, batteryActivity] =
        await Promise.allSettled([
            getPermissionsAsync(),
            deviceInfo.sdkInt >= 26
                ? getNotificationChannelAsync(ANDROID_CHANNEL_ID)
                : Promise.resolve(null),
            exactAlarmsApplicable
                ? getExactAlarmPermissionsAsync()
                : Promise.resolve(null),
            isIgnoringBatteryOptimizations(),
        ]);

    if (notificationPermission.status === 'rejected') {
        console.error('Could not read notification permission for reminder health.', notificationPermission.reason);
    }
    if (channel.status === 'rejected') {
        console.error('Could not read the task reminder notification channel.', channel.reason);
    }
    if (exactAlarmsApplicable && exactAlarms.status === 'rejected') {
        console.error('Could not read reminder timing access.', exactAlarms.reason);
    }
    if (batteryActivity.status === 'rejected') {
        console.error('Could not read background activity access.', batteryActivity.reason);
    }

    const notifications = getNotificationState(
        notificationPermission,
        channel,
        deviceInfo.sdkInt >= 26,
    );
    const exactAlarmState: ReminderStepState = !exactAlarmsApplicable
        ? 'on'
        : exactAlarms.status === 'rejected'
            ? 'unknown'
            : exactAlarms.value?.granted
                ? 'on'
                : 'off';

    return {
        notifications,
        exactAlarms: exactAlarmState,
        batteryActivity: batteryActivity.status === 'rejected'
            ? 'unknown'
            : batteryActivity.value
                ? 'on'
                : 'off',
        notificationsApplicable: notificationsApplicable || notifications !== 'on',
        exactAlarmsApplicable,
        deviceInfo,
    };
};

export const needsReminderHealthAttention = (
    status: ReminderHealthStatus,
    brandGuidanceReviewed: boolean,
): boolean => (
    (status.notificationsApplicable && status.notifications !== 'on')
    || (status.exactAlarmsApplicable && status.exactAlarms !== 'on')
    || status.batteryActivity !== 'on'
    || (getBrandGuide(status.deviceInfo) !== null && !brandGuidanceReviewed)
);
