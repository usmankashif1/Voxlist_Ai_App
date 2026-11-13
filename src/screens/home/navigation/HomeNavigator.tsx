import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../../profile/screens/ProfileScreen';
import LoginScreen from '../../auth/screens/LoginScreen';
import SignUpScreen from '../../auth/screens/SignUpScreen';
import TaskDetailsScreen from '../screens/TaskDetailsScreen';

export type HomeStackParamList = {
    Home: undefined;
    TaskDetails: { taskId: string };
    Settings: undefined;
    Login: undefined;
    SignUp: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeNavigator = () => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
            animation: Platform.OS === 'ios' ? 'simple_push' : 'ios_from_right',
            animationDuration: 200,
        }}
    >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="TaskDetails" component={TaskDetailsScreen} />
        <Stack.Screen name="Settings" component={ProfileScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
);

export default HomeNavigator;
