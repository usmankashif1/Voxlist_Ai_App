import React from 'react';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MessyTalkIllustration from '../components/MessyTalkIllustration';
import OnboardingLayout from '../components/OnboardingLayout';
import { useOnboardingEntrance } from '../hooks/useOnboardingEntrance';
import type { OnboardingStackParamList } from '../navigation/OnboardingNavigator';
import { RF, RH, RW } from '../../../core/utils/responsive';

const MessyTalkScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
    const isFocused = useIsFocused();
    const entrance = useOnboardingEntrance(isFocused);

    return (
        <OnboardingLayout
            step={2}
            hero={<MessyTalkIllustration />}
            title={'So just talk.\nHowever it comes out.'}
            description="Ramble, pause, switch languages mid-sentence — we're listening."
            buttonLabel="Next"
            heroAnimationStyle={entrance.heroStyle}
            titleAnimationStyle={entrance.titleStyle}
            descriptionAnimationStyle={entrance.descriptionStyle}
            footerAnimationStyle={entrance.footerStyle}
            titleTextStyle={{ fontSize: RF(27), lineHeight: RF(33), letterSpacing: -0.5 }}
            descriptionTextStyle={{ maxWidth: RW(306), marginTop: RH(10) }}
            onContinue={() => navigation.navigate('MicrophonePermission')}
        />
    );
};

export default MessyTalkScreen;
