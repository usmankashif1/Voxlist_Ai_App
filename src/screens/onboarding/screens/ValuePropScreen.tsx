import React from 'react';
import { StyleSheet } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import OnboardingHeroIllustration from '../components/OnboardingHeroIllustration';
import OnboardingLayout from '../components/OnboardingLayout';
import { useOnboardingEntrance } from '../hooks/useOnboardingEntrance';
import type { OnboardingStackParamList } from '../navigation/OnboardingNavigator';
import { RF, RH, RW } from '../../../core/utils/responsive';

const ValuePropScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
    const isFocused = useIsFocused();
    const entrance = useOnboardingEntrance(isFocused);

    return (
        <OnboardingLayout
            step={1}
            progressSteps={4}
            hero={<OnboardingHeroIllustration isActive={isFocused} />}
            title="Tired of typing out every messy thought?"
            description="Long lists, half-written notes, and tedious manual typing drain your energy before you even start."
            buttonLabel="Next"
            heroAnimationStyle={entrance.heroStyle}
            titleAnimationStyle={entrance.titleStyle}
            descriptionAnimationStyle={entrance.descriptionStyle}
            footerAnimationStyle={entrance.footerStyle}
            titleTextStyle={styles.title}
            descriptionTextStyle={styles.description}
            onContinue={() => navigation.navigate('VoiceToTasks')}
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

export default ValuePropScreen;
