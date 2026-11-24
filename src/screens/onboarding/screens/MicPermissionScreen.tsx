import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { requestMicrophonePermission } from '../../../core/permissions/permissionService';
import { saveOnboardingPermissionResult } from '../../../core/storage/onboardingStorage';
import OnboardingLayout from '../components/OnboardingLayout';
import type { OnboardingStackParamList } from '../navigation/OnboardingNavigator';

const MicPermissionScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleContinue = async () => {
        if (loading) return;
        setLoading(true);
        setMessage('');

        let granted = false;
        try {
            granted = await requestMicrophonePermission();
        } catch (error) {
            console.error('Could not request microphone permission during onboarding.', error);
            setMessage('You can enable microphone access later in settings.');
        }

        try {
            await saveOnboardingPermissionResult('microphone', granted);
        } catch (error) {
            console.error('Could not save the microphone permission result.', error);
            setMessage('Your permission choice could not be saved. You can continue.');
        }

        navigation.navigate('NotificationPermission');
        setLoading(false);
    };

    return (
        <OnboardingLayout
            step={2}
            icon="mic"
            title="Capture tasks by voice"
            description="Microphone access lets Voxlist turn your speech into tasks. You can still type tasks if you say no."
            buttonLabel="Continue"
            loading={loading}
            message={message}
            onContinue={() => void handleContinue()}
        />
    );
};

export default MicPermissionScreen;
