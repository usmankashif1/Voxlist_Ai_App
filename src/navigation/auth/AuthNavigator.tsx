import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../../screens/auth/screens/LoginScreen';
import SignUpScreen from '../../screens/auth/screens/SignUpScreen';

export type AuthStackParamList = {
    Login: undefined;
    SignUp: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = () => (
    <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
            headerShown: false,
            animation: Platform.OS === 'ios' ? 'simple_push' : 'ios_from_right',
            animationDuration: 200,
        }}
    >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
);

export default AuthNavigator;
