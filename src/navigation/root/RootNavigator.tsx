import React, { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Platform, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Network from 'expo-network';
import * as SecureStore from 'expo-secure-store';
import StackNavigator from '../main/Stack/StackNavigator';
import AuthNavigator from '../auth/AuthNavigator';
import { taskTheme } from '../../core/theme/taskTheme';
import { syncTasksForUser } from '../../core/storage/taskSyncService';
import { initializeAuth } from '../../store/authThunks';
import { selectAuth } from '../../store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

export type RootStackParamList = {
    Main: undefined;
    Auth: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const LOCAL_WORKSPACE_ENABLED_KEY = 'local-workspace-enabled-v1';

const RootNavigator = () => {
    const dispatch = useAppDispatch();
    const { session, isLoading } = useAppSelector(selectAuth);
    const [isNetworkReady, setIsNetworkReady] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [hasLocalWorkspace, setHasLocalWorkspace] = useState(false);

    useEffect(() => {
        dispatch(initializeAuth());
    }, [dispatch]);

    useEffect(() => {
        let isMounted = true;
        let hasLocalWorkspaceValue = false;
        let isPersistingLocalWorkspace = false;

        const applyNetworkState = (state: Network.NetworkState) => {
            const offline = state.isConnected === false
                || state.isInternetReachable === false;
            if (!isMounted) return;

            setIsOffline(offline);
            if (offline) {
                hasLocalWorkspaceValue = true;
                setHasLocalWorkspace(true);
                if (!isPersistingLocalWorkspace) {
                    isPersistingLocalWorkspace = true;
                    void SecureStore.setItemAsync(LOCAL_WORKSPACE_ENABLED_KEY, 'true')
                        .catch(error => {
                            isPersistingLocalWorkspace = false;
                            console.error('Could not save local workspace availability.', error);
                        });
                }
            }
        };

        const networkSubscription = Network.addNetworkStateListener(applyNetworkState);
        void (async () => {
            try {
                const [networkState, localWorkspaceValue] = await Promise.all([
                    Network.getNetworkStateAsync(),
                    SecureStore.getItemAsync(LOCAL_WORKSPACE_ENABLED_KEY),
                ]);
                if (!isMounted) return;
                hasLocalWorkspaceValue = localWorkspaceValue === 'true'
                    || hasLocalWorkspaceValue;
                isPersistingLocalWorkspace = hasLocalWorkspaceValue;
                setHasLocalWorkspace(hasLocalWorkspaceValue);
                applyNetworkState(networkState);
            } catch (error) {
                console.error('Could not determine offline app availability.', error);
            } finally {
                if (isMounted) setIsNetworkReady(true);
            }
        })();

        return () => {
            isMounted = false;
            networkSubscription.remove();
        };
    }, []);

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
        const networkSubscription = Network.addNetworkStateListener(state => {
            if (state.isConnected && state.isInternetReachable !== false) sync();
        });
        const appStateSubscription = AppState.addEventListener('change', state => {
            if (state === 'active') sync();
        });

        sync();
        return () => {
            networkSubscription.remove();
            appStateSubscription.remove();
        };
    }, [userId]);

    if (isLoading || !isNetworkReady) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator color={taskTheme.colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animation: Platform.OS === 'ios' ? 'simple_push' : 'ios_from_right',
                    animationDuration: 200,
                }}
            >
                {session || isOffline || hasLocalWorkspace ? (
                    <Stack.Screen name="Main" component={StackNavigator} />
                ) : (
                    <Stack.Screen name="Auth" component={AuthNavigator} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: taskTheme.colors.background,
    },
});

export default RootNavigator;
