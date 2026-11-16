import React, { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import {
    NavigationContainer,
    useNavigationContainerRef,
    type NavigatorScreenParams,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Network from 'expo-network';
import * as Notifications from 'expo-notifications';
import StackNavigator from '../main/Stack/StackNavigator';
import type { MainStackParamList } from '../main/Stack/StackNavigator';
import { syncTasksForUser } from '../../core/storage/taskSyncService';
import { initializeAuth } from '../../store/authThunks';
import { selectAuth } from '../../store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

export type RootStackParamList = {
    Main: NavigatorScreenParams<MainStackParamList>;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
    const dispatch = useAppDispatch();
    const { session } = useAppSelector(selectAuth);
    const navigationRef = useNavigationContainerRef<RootStackParamList>();
    const pendingNotificationTaskId = useRef<string | null>(null);
    const lastNotificationResponse = Notifications.useLastNotificationResponse();

    const navigateToTask = useCallback((taskId: string) => {
        if (!navigationRef.isReady()) {
            pendingNotificationTaskId.current = taskId;
            return;
        }

        pendingNotificationTaskId.current = null;
        navigationRef.navigate('Main', {
            screen: 'HomeFlow',
            params: {
                screen: 'TaskDetails',
                params: { taskId },
            },
        });
    }, [navigationRef]);

    useEffect(() => {
        if (!lastNotificationResponse) return;

        const { actionIdentifier, notification } = lastNotificationResponse;
        const taskId = notification.request.content.data?.taskId;
        if (
            actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
            && typeof taskId === 'string'
            && taskId.length > 0
        ) {
            navigateToTask(taskId);
        }

        void Notifications.clearLastNotificationResponseAsync().catch(error => {
            console.error('Could not clear the handled notification response.', error);
        });
    }, [lastNotificationResponse, navigateToTask]);

    const handleNavigationReady = useCallback(() => {
        const taskId = pendingNotificationTaskId.current;
        if (taskId) navigateToTask(taskId);
    }, [navigateToTask]);

    useEffect(() => {
        dispatch(initializeAuth());
    }, [dispatch]);

    const userId = session && session.user.is_anonymous !== true
        ? session.user.id
        : null;

    useEffect(() => {
        if (!userId) return undefined;

        const sync = () => {
            void syncTasksForUser(userId).catch(error => {
                console.error('Task sync failed; local changes are still saved.', error);
            });
        };
        let isOnline = false;
        const updateNetworkState = (state: Network.NetworkState) => {
            const wasOnline = isOnline;
            isOnline = state.isConnected === true && state.isInternetReachable !== false;
            if (isOnline && !wasOnline) sync();
        };
        const networkSubscription = Network.addNetworkStateListener(updateNetworkState);
        void Network.getNetworkStateAsync()
            .then(updateNetworkState)
            .catch(error => {
                console.error('Could not determine network availability for task sync.', error);
            });
        const appStateSubscription = AppState.addEventListener('change', state => {
            if (state === 'active' && isOnline) sync();
        });

        return () => {
            networkSubscription.remove();
            appStateSubscription.remove();
        };
    }, [userId]);

    return (
        <NavigationContainer ref={navigationRef} onReady={handleNavigationReady}>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animation: Platform.OS === 'ios' ? 'simple_push' : 'ios_from_right',
                    animationDuration: 200,
                }}
            >
                <Stack.Screen name="Main" component={StackNavigator} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default RootNavigator;
