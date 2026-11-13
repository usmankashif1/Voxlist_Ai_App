import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import ReportAiContentScreen from '../screens/ReportAiContentScreen';

export type ProfileStackParamList = {
    Profile: undefined;
    ReportAiContent: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="ReportAiContent" component={ReportAiContentScreen} />
    </Stack.Navigator>
);

export default ProfileNavigator;
