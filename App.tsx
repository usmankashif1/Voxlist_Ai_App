import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { prepareNotificationChannel } from './src/core/permissions/permissionService';
import { AppToast, AuthToastListener } from './src/components/AuthToastNotifications';
import RootNavigator from './src/navigation/root/RootNavigator';
import { store } from './src/store/store';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

void SplashScreen.preventAutoHideAsync().catch(error => {
    console.error('Could not keep the splash screen visible during local task loading.', error);
});

const App = () => {
    useEffect(() => {
        void prepareNotificationChannel().catch(error => {
            console.error('Could not prepare the task reminder notification channel.', error);
        });
    }, []);

    return (
        <Provider store={store}>
            <SafeAreaProvider>
                <StatusBar barStyle="dark-content" />
                <RootNavigator />
                <AuthToastListener />
                <AppToast />
            </SafeAreaProvider>
        </Provider>
    );
};

export default App;
