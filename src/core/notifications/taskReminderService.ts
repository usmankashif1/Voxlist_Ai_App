import {
    cancelScheduledNotificationAsync,
    getExactAlarmPermissionsAsync,
    getPermissionsAsync,
    scheduleNotificationAsync,
    SchedulableTriggerInputTypes,
} from 'expo-notifications';
import { Platform } from 'react-native';
import { getLocalDueDate } from '../utils/dateTime';
import type { Task } from '../../screens/home/home.types';
import {
    ANDROID_CHANNEL_ID,
    prepareNotificationChannel,
    requestExactAlarmPermission,
    requestNotificationPermission,
} from '../permissions/permissionService';

export interface ScheduledTaskReminder {
    notificationId: string;
    exactDelivery: boolean;
}

export const scheduleTaskReminder = async (
    task: Task,
    promptForPermissions = true,
): Promise<ScheduledTaskReminder | null> => {

    if (!task.reminderEnabled || !task.dueDate || !task.dueTime) {
        return null;
    }


    const dueAt = getLocalDueDate(task.dueDate, task.dueTime);
    if (dueAt.getTime() <= Date.now()) {
        throw new Error('The reminder time is in the past. Choose a future date and time.');
    }


    if (Platform.OS === 'android' && !promptForPermissions) {
        await prepareNotificationChannel();
    }


    const notificationsAllowed = promptForPermissions
        ? await requestNotificationPermission(true)
        : (await getPermissionsAsync()).granted;
    if (!notificationsAllowed) {
        throw new Error('Notification permission was not granted. Enable it in system settings to receive reminders.');
    }


    const exactAlarmGranted = promptForPermissions
        ? await requestExactAlarmPermission()
        : (await getExactAlarmPermissionsAsync()).granted;
    const body = task.subtasks[0] || 'Your task is due now.';
    const notificationId = await scheduleNotificationAsync({
        content: {
            title: task.title,
            body,
            sound: 'default',
            data: {
                taskId: task.id,
                dueAt: dueAt.toISOString(),
                exactDelivery: Platform.OS !== 'android' || exactAlarmGranted,
                notificationChannelId: ANDROID_CHANNEL_ID,
            },
            ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
        },
        trigger: {
            type: SchedulableTriggerInputTypes.DATE,
            date: dueAt,
            ...(Platform.OS === 'android'
                ? {
                    channelId: ANDROID_CHANNEL_ID,
                    // Expo uses setExactAndAllowWhileIdle when exact access exists; avoid alarm-clock UX for task reminders.
                    delivery: 'bestEffort' as const,
                }
                : {}),
        },
    });

    return {
        notificationId,
        exactDelivery: Platform.OS !== 'android' || exactAlarmGranted,
    };
};

export const cancelTaskReminder = async (notificationId: string | null): Promise<void> => {
    if (notificationId) {
        await cancelScheduledNotificationAsync(notificationId);
    }
};
