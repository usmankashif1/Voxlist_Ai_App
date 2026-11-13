import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import RootNavigator from './src/navigation/root/RootNavigator';
import { store } from './src/store/store';

const App = () => (
    <Provider store={store}>
        <SafeAreaProvider>
            <StatusBar barStyle="dark-content" />
            <RootNavigator />
        </SafeAreaProvider>
    </Provider>
);

export default App;
