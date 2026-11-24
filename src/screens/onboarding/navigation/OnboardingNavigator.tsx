import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ValuePropScreen from '../screens/ValuePropScreen';
import MicPermissionScreen from '../screens/MicPermissionScreen';
import NotificationPermissionScreen from '../screens/NotificationPermissionScreen';

export type OnboardingStackParamList = {
    ValueProp: undefined;
    MicrophonePermission: undefined;
    NotificationPermission: undefined;
};

interface OnboardingNavigatorProps {
    onComplete: () => Promise<void>;
}

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const OnboardingNavigator = ({ onComplete }: OnboardingNavigatorProps) => (
    <Stack.Navigator
        initialRouteName="ValueProp"
        screenOptions={{
            headerShown: false,
            gestureEnabled: false,
            animation: 'fade',
        }}
    >
        <Stack.Screen name="ValueProp" component={ValuePropScreen} />
        <Stack.Screen name="MicrophonePermission" component={MicPermissionScreen} />
        <Stack.Screen name="NotificationPermission">
            {() => <NotificationPermissionScreen onComplete={onComplete} />}
        </Stack.Screen>
    </Stack.Navigator>
);

export default OnboardingNavigator;
