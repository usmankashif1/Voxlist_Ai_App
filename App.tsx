import React from 'react';
import { StatusBar } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import RootNavigator from './src/navigation/root/RootNavigator';
import { store } from './src/store/store';

void SplashScreen.preventAutoHideAsync().catch(error => {
    console.error('Could not keep the splash screen visible during local task loading.', error);
});

const App = () => (
    <Provider store={store}>
        <SafeAreaProvider>
            <StatusBar barStyle="dark-content" />
            <RootNavigator />
        </SafeAreaProvider>
    </Provider>
);

export default App;
