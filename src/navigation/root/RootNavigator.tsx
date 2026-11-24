import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    AppState,
    Platform,
    StyleSheet,
    View,
} from 'react-native';
import {
    NavigationContainer,
    useNavigationContainerRef,
    type NavigatorScreenParams,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import * as Network from 'expo-network';
import * as Notifications from 'expo-notifications';
import StackNavigator from '../main/Stack/StackNavigator';
import type { MainStackParamList } from '../main/Stack/StackNavigator';
import OnboardingNavigator from '../../screens/onboarding/navigation/OnboardingNavigator';
import AppButton from '../../components/AppButton';
import AppText from '../../components/AppText';
import { taskTheme } from '../../core/theme/taskTheme';
import { RF, RH, RS, RW } from '../../core/utils/responsive';
import {
    getHasCompletedOnboarding,
    setHasCompletedOnboarding as persistOnboardingCompletion,
} from '../../core/storage/onboardingStorage';
import { syncTasksForUser } from '../../core/storage/taskSyncService';
import { startForegroundReminderService } from '../../core/notifications/reminderStatus';
import { initializeAuth } from '../../store/authThunks';
import { selectAuth } from '../../store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

export type RootStackParamList = {
    Onboarding: undefined;
    Main: NavigatorScreenParams<MainStackParamList>;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
    const dispatch = useAppDispatch();
    const { session } = useAppSelector(selectAuth);
    const navigationRef = useNavigationContainerRef<RootStackParamList>();
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
    const [onboardingStorageError, setOnboardingStorageError] = useState(false);
    const pendingNotificationTaskId = useRef<string | null>(null);
    const reminderServiceState = useRef<'unknown' | 'starting' | 'started'>('unknown');
    const lastNotificationResponse = Notifications.useLastNotificationResponse();

    const loadOnboardingState = useCallback(async () => {
        setOnboardingStorageError(false);
        try {
            const completed = await getHasCompletedOnboarding();
            setHasCompletedOnboarding(completed);
            if (!completed) {
                void SplashScreen.hideAsync().catch(error => {
                    console.error('Could not hide the splash screen before onboarding.', error);
                });
            }
        } catch (error) {
            console.error('Could not read the onboarding completion state.', error);
            setOnboardingStorageError(true);
            void SplashScreen.hideAsync().catch(hideError => {
                console.error('Could not hide the splash screen after an onboarding storage error.', hideError);
            });
        }
    }, []);

    useEffect(() => {
        void loadOnboardingState();
    }, [loadOnboardingState]);

    const navigateToTask = useCallback((taskId: string) => {
        if (hasCompletedOnboarding !== true || !navigationRef.isReady()) {
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
    }, [hasCompletedOnboarding, navigationRef]);



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
        if (hasCompletedOnboarding !== true) return;
        const taskId = pendingNotificationTaskId.current;
        if (taskId) navigateToTask(taskId);
    }, [hasCompletedOnboarding, navigateToTask]);

    useEffect(() => {
        if (hasCompletedOnboarding !== true) return;
        const taskId = pendingNotificationTaskId.current;
        if (taskId) navigateToTask(taskId);
    }, [hasCompletedOnboarding, navigateToTask]);

    useEffect(() => {
        dispatch(initializeAuth());
    }, [dispatch]);

    const userId = session && session.user.is_anonymous !== true
        ? session.user.id
        : null;

    const refreshReminderService = useCallback(async () => {
        if (Platform.OS !== 'android') return;
        if (
            reminderServiceState.current === 'started'
            || reminderServiceState.current === 'starting'
        ) return;
        reminderServiceState.current = 'starting';
        try {
            await startForegroundReminderService();
            reminderServiceState.current = 'started';
        } catch (error) {
            reminderServiceState.current = 'unknown';
            console.error('Could not update the foreground reminder service.', error);
        }
    }, []);




    // useEffect(() => {
    //     if (!userId) return undefined;

    //     const sync = () => {
    //         void syncTasksForUser(userId).catch(error => {
    //             console.error('Task sync failed; local changes are still saved.', error);
    //         });
    //     };
    //     let isOnline = false;
    //     const updateNetworkState = (
    //         state: Network.NetworkState,
    //         source: 'initial' | 'listener',
    //     ) => {
    //         console.log(`[NETWORK_DEBUG] RootNavigator ${source} state: ${JSON.stringify(state)}`);
    //         const wasOnline = isOnline;
    //         isOnline = state.isConnected === true && state.isInternetReachable !== false;
    //         if (isOnline && !wasOnline) sync();
    //     };
    //     const networkSubscription = Network.addNetworkStateListener(
    //         state => updateNetworkState(state, 'listener'),
    //     );
    //     void Network.getNetworkStateAsync()
    //         .then(state => updateNetworkState(state, 'initial'))
    //         .catch(error => {
    //             console.error('Could not determine network availability for task sync.', error);
    //         });
    //     const appStateSubscription = AppState.addEventListener('change', state => {
    //         if (state === 'active' && isOnline) sync();
    //     });

    //     return () => {
    //         networkSubscription.remove();
    //         appStateSubscription.remove();
    //     };
    // }, [userId]);





    useEffect(() => {
        const sync = () => {
            if (!userId) return;
            void syncTasksForUser(userId).catch(error => {
                console.error('Task sync failed; local changes are still saved.', error);
            });
        };

        let isOnline = false;
        let offlineTimer: ReturnType<typeof setTimeout> | null = null;
        void refreshReminderService();
        const appStateSubscription = AppState.addEventListener('change', state => {
            if (state === 'active') {
                void refreshReminderService();
                if (isOnline) sync();
            }
        });

        const clearOfflineTimer = () => {
            if (offlineTimer) {
                clearTimeout(offlineTimer);
                offlineTimer = null;
            }
        };

        const updateNetworkState = (
            state: Network.NetworkState,
            source: 'initial' | 'listener',
        ) => {
            console.log(`[NETWORK_DEBUG] RootNavigator ${source} state: ${JSON.stringify(state)}`);
            const wasOnline = isOnline;

            // Hard offline: radio is down. Trust this immediately.
            if (state.isConnected === false) {
                clearOfflineTimer();
                isOnline = false;
                return;
            }

            // Connected, but reachability says false: on cellular this is
            // often a transient validation delay, not a real outage.
            // Wait a few seconds before actually marking offline, in case
            // a newer event clears it first.
            if (state.isConnected === true && state.isInternetReachable === false) {
                clearOfflineTimer();
                offlineTimer = setTimeout(() => {
                    isOnline = false;
                }, 4000);
                return;
            }

            // Connected and reachable (or reachability unknown/null) — online.
            clearOfflineTimer();
            isOnline = true;
            if (isOnline && !wasOnline) sync();
        };

        const networkSubscription = userId
            ? Network.addNetworkStateListener(state => updateNetworkState(state, 'listener'))
            : null;
        if (userId) {
            void Network.getNetworkStateAsync()
                .then(state => updateNetworkState(state, 'initial'))
                .catch(error => {
                    console.error('Could not determine network availability for task sync.', error);
                });
        }

        return () => {
            clearOfflineTimer();
            networkSubscription?.remove();
            appStateSubscription.remove();
        };
    }, [refreshReminderService, userId]);






    if (hasCompletedOnboarding === null) {
        return (
            <View style={styles.startupState}>
                {onboardingStorageError ? (
                    <>
                        <AppText style={styles.startupTitle}>Could not load setup</AppText>
                        <AppText style={styles.startupMessage}>
                            Check your device storage, then try again.
                        </AppText>
                        <AppButton style={styles.retryButton} onPress={() => void loadOnboardingState()}>
                            <AppText style={styles.retryButtonText}>Try again</AppText>
                        </AppButton>
                    </>
                ) : (
                    <ActivityIndicator color={taskTheme.colors.primary} />
                )}
            </View>
        );
    }

    return (
        <NavigationContainer ref={navigationRef} onReady={handleNavigationReady}>
            <Stack.Navigator
                initialRouteName={hasCompletedOnboarding ? 'Main' : 'Onboarding'}
                screenOptions={{
                    headerShown: false,
                    animation: Platform.OS === 'ios' ? 'simple_push' : 'ios_from_right',
                    animationDuration: 200,
                }}
            >
                <Stack.Screen name="Onboarding">
                    {({ navigation }) => (
                        <OnboardingNavigator
                            onComplete={async () => {
                                await persistOnboardingCompletion();
                                setHasCompletedOnboarding(true);
                                navigation.replace('Main', {
                                    screen: 'HomeFlow',
                                    params: { screen: 'Home' },
                                });
                            }}
                        />
                    )}
                </Stack.Screen>
                <Stack.Screen name="Main" component={StackNavigator} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    startupState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: RW(taskTheme.spacing.xl),
        backgroundColor: taskTheme.colors.background,
    },
    startupTitle: {
        color: taskTheme.colors.text,
        fontSize: RF(18),
        fontWeight: '700',
    },
    startupMessage: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(14),
        textAlign: 'center',
        marginTop: RH(taskTheme.spacing.sm),
    },
    retryButton: {
        minHeight: RH(44),
        justifyContent: 'center',
        paddingHorizontal: RW(taskTheme.spacing.lg),
        marginTop: RH(taskTheme.spacing.lg),
        borderRadius: RS(taskTheme.radius.sm),
        backgroundColor: taskTheme.colors.primary,
    },
    retryButtonText: {
        color: taskTheme.colors.white,
        fontSize: RF(14),
        fontWeight: '700',
    },
});

export default RootNavigator;
