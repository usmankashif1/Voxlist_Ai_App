import {
    AndroidImportance,
    getExactAlarmPermissionsAsync,
    getPermissionsAsync as getNotificationPermissionsAsync,
    requestExactAlarmPermissionsAsync,
    requestPermissionsAsync as requestNotificationPermissionsAsync,
    setNotificationChannelAsync,
} from 'expo-notifications';
import { AudioModule } from 'expo-audio';
import { Alert, Linking, Platform } from 'react-native';
import type { PermissionResponse } from 'expo';

export const ANDROID_CHANNEL_ID = 'task-reminders-v4';
const pendingRequests = new Map<string, Promise<PermissionResponse>>();
let exactAlarmPromptedThisSession = false;

const getOrRequestPermission = (
    key: string,
    getPermission: () => Promise<PermissionResponse>,
    requestPermission: () => Promise<PermissionResponse>,
): Promise<PermissionResponse> => {
    const pendingRequest = pendingRequests.get(key);
    if (pendingRequest) return pendingRequest;

    const request = (async () => {
        let permission = await getPermission();
        if (!permission.granted && permission.canAskAgain) {
            permission = await requestPermission();
        }
        return permission;
    })().finally(() => {
        pendingRequests.delete(key);
    });

    pendingRequests.set(key, request);
    return request;
};

const showSettingsAlert = (permissionName: string): void => {
    Alert.alert(
        `${permissionName} permission required`,
        `Allow ${permissionName.toLowerCase()} access in your device settings to use this feature.`,
        [
            { text: 'Not now', style: 'cancel' },
            {
                text: 'Open Settings',
                onPress: () => {
                    void Linking.openSettings().catch(error => {
                        console.error(`Could not open settings for ${permissionName} permission.`, error);
                    });
                },
            },
        ],
    );
};

export const requestMicrophonePermission = async (
    showSettingsIfBlocked = false,
): Promise<boolean> => {
    const permission = await getOrRequestPermission(
        'microphone',
        () => AudioModule.getRecordingPermissionsAsync(),
        () => AudioModule.requestRecordingPermissionsAsync(),
    );

    if (!permission.granted && showSettingsIfBlocked && !permission.canAskAgain) {
        showSettingsAlert('Microphone');
    }

    return permission.granted;
};

export const prepareNotificationChannel = async (): Promise<void> => {
    if (Platform.OS !== 'android') return;

    await setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Task reminders',
        importance: AndroidImportance.MAX,
        enableVibrate: true,
        vibrationPattern: [0, 250, 250, 250],
    });
};

export const requestExactAlarmPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    const currentPermission = await getExactAlarmPermissionsAsync();
    if (currentPermission.granted) return true;
    if (!currentPermission.canAskAgain) {
        showSettingsAlert('Exact alarms');
        return false;
    }
    if (exactAlarmPromptedThisSession) return false;

    exactAlarmPromptedThisSession = true;
    const requestedPermission = await requestExactAlarmPermissionsAsync();
    if (!requestedPermission.granted) {
        showSettingsAlert('Exact alarms');
    }
    return requestedPermission.granted;
};

export const requestNotificationPermission = async (
    showSettingsIfBlocked = false,
): Promise<boolean> => {
    await prepareNotificationChannel();
    const permission = await getOrRequestPermission(
        'notifications',
        () => getNotificationPermissionsAsync(),
        () => requestNotificationPermissionsAsync(),
    );

    if (!permission.granted && showSettingsIfBlocked && !permission.canAskAgain) {
        showSettingsAlert('Notifications');
    }

    return permission.granted;
};
