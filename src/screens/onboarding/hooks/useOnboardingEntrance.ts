import { useEffect } from 'react';
import type { ViewStyle } from 'react-native';
import {
    cancelAnimation,
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';
import type { AnimatedStyle } from 'react-native-reanimated';

interface OnboardingEntranceStyles {
    heroStyle: AnimatedStyle<ViewStyle>;
    titleStyle: AnimatedStyle<ViewStyle>;
    descriptionStyle: AnimatedStyle<ViewStyle>;
    footerStyle: AnimatedStyle<ViewStyle>;
}

export const useOnboardingEntrance = (
    isActive: boolean,
    replayKey = 0,
): OnboardingEntranceStyles => {
    const hero = useSharedValue(0);
    const title = useSharedValue(0);
    const description = useSharedValue(0);
    const footer = useSharedValue(0);

    useEffect(() => {
        if (!isActive) {
            cancelAnimation(hero);
            cancelAnimation(title);
            cancelAnimation(description);
            cancelAnimation(footer);
            hero.value = 0;
            title.value = 0;
            description.value = 0;
            footer.value = 0;
            return;
        }

        const easing = Easing.bezier(0.22, 1, 0.36, 1);
        hero.value = withTiming(1, { duration: 600, easing });
        title.value = withDelay(130, withTiming(1, { duration: 540, easing }));
        description.value = withDelay(240, withTiming(1, { duration: 540, easing }));
        footer.value = withDelay(340, withTiming(1, { duration: 500, easing }));

        return () => {
            cancelAnimation(hero);
            cancelAnimation(title);
            cancelAnimation(description);
            cancelAnimation(footer);
        };
    }, [isActive, replayKey, hero, title, description, footer]);

    const heroStyle = useAnimatedStyle<ViewStyle>(() => ({
        opacity: hero.value,
        transform: [
            { translateY: interpolate(hero.value, [0, 1], [10, 0]) },
            { scale: interpolate(hero.value, [0, 1], [0.97, 1]) },
        ],
    }));
    const titleStyle = useAnimatedStyle<ViewStyle>(() => ({
        opacity: title.value,
        transform: [{ translateY: interpolate(title.value, [0, 1], [14, 0]) }],
    }));
    const descriptionStyle = useAnimatedStyle<ViewStyle>(() => ({
        opacity: description.value,
        transform: [{ translateY: interpolate(description.value, [0, 1], [14, 0]) }],
    }));
    const footerStyle = useAnimatedStyle<ViewStyle>(() => ({
        opacity: footer.value,
        transform: [{ translateY: interpolate(footer.value, [0, 1], [14, 0]) }],
    }));

    return { heroStyle, titleStyle, descriptionStyle, footerStyle };
};
