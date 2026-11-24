import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import OnboardingLayout from '../components/OnboardingLayout';
import type { OnboardingStackParamList } from '../navigation/OnboardingNavigator';

const ValuePropScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();

    return (
        <OnboardingLayout
            step={1}
            icon="mic-outline"
            title="Speak your tasks. We'll organize them."
            description="Capture ideas in multiple languages, then review them as clear, organized tasks."
            buttonLabel="Next"
            onContinue={() => navigation.navigate('MicrophonePermission')}
        />
    );
};

export default ValuePropScreen;
