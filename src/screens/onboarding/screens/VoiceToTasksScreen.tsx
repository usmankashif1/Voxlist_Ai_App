import React from 'react';
import { StyleSheet } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import VoiceToTasksIllustration from '../components/VoiceToTasksIllustration';
import OnboardingLayout from '../components/OnboardingLayout';
import { useOnboardingEntrance } from '../hooks/useOnboardingEntrance';
import type { OnboardingStackParamList } from '../navigation/OnboardingNavigator';
import { RF, RH, RW } from '../../../core/utils/responsive';

const VoiceToTasksScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
    const isFocused = useIsFocused();
    const entrance = useOnboardingEntrance(isFocused);
    const handleContinue = () => {
        navigation.navigate('MicrophonePermission');
    };

    return (
        <OnboardingLayout
            step={2}
            progressSteps={4}
            hero={<VoiceToTasksIllustration isActive={isFocused} replayKey={0} />}
            title="Just speak naturally, skip the typing."
            description="Record messy voice notes on the go — Voxlist AI instantly turns your words into clear, organized tasks."
            buttonLabel="Next"
            heroAnimationStyle={entrance.heroStyle}
            titleAnimationStyle={entrance.titleStyle}
            descriptionAnimationStyle={entrance.descriptionStyle}
            footerAnimationStyle={entrance.footerStyle}
            titleTextStyle={styles.title}
            descriptionTextStyle={styles.description}
            onContinue={handleContinue}
        />
    );
};

const styles = StyleSheet.create({
    title: {
        fontSize: RF(25),
        lineHeight: RF(30.5),
        letterSpacing: -0.5,
    },
    description: {
        fontSize: RF(15),
        lineHeight: RF(22.5),
        maxWidth: RW(306),
        marginTop: RH(10),
    },
});

export default VoiceToTasksScreen;
