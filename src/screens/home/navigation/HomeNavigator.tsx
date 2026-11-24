import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../../profile/screens/ProfileScreen';
import LoginScreen from '../../auth/screens/LoginScreen';
import SignUpScreen from '../../auth/screens/SignUpScreen';
import ForgotPasswordScreen from '../../auth/screens/ForgotPasswordScreen';
import VerifyResetCodeScreen from '../../auth/screens/VerifyResetCodeScreen';
import ResetPasswordScreen from '../../auth/screens/ResetPasswordScreen';
import TaskDetailsScreen from '../screens/TaskDetailsScreen';
import ReportAiContentScreen from '../../profile/screens/ReportAiContentScreen';

export type HomeStackParamList = {
    Home: undefined;
    TaskDetails: { taskId: string };
    Settings: undefined;
    Login: undefined;
    SignUp: undefined;
    ForgotPassword: undefined;
    VerifyResetCode: { email: string };
    ResetPassword: undefined;
    ReportAiContent: undefined;
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
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="VerifyResetCode" component={VerifyResetCodeScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="ReportAiContent" component={ReportAiContentScreen} />
    </Stack.Navigator>
);

export default HomeNavigator;
