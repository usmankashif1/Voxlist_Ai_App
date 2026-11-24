import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    cancelAnimation,
    Easing,
    interpolate,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';
import AppText from '../../../components/AppText';
import { taskTheme } from '../../../core/theme/taskTheme';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

interface NotificationPermissionIllustrationProps {
    isActive: boolean;
}

const NotificationPermissionIllustration = ({
    isActive,
}: NotificationPermissionIllustrationProps) => {
    const glowOneProgress = useSharedValue(0);
    const glowTwoProgress = useSharedValue(0);
    const bannerProgress = useSharedValue(0);
    const bellRingProgress = useSharedValue(0);
    const bannerExitTranslation = RH(78);

    useEffect(() => {
        cancelAnimation(glowOneProgress);
        cancelAnimation(glowTwoProgress);
        cancelAnimation(bannerProgress);
        cancelAnimation(bellRingProgress);
        glowOneProgress.value = 0;
        glowTwoProgress.value = 0;
        bannerProgress.value = 0;
        bellRingProgress.value = 0;

        if (!isActive) {
            return;
        }

        const ease = Easing.inOut(Easing.ease);
        glowOneProgress.value = withRepeat(
            withTiming(1, { duration: 1700, easing: ease }),
            -1,
            true,
        );
        glowTwoProgress.value = withDelay(
            400,
            withRepeat(withTiming(1, { duration: 1700, easing: ease }), -1, true),
        );
        bannerProgress.value = withRepeat(
            withSequence(
                withTiming(0, { duration: 1000 }),
                withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) }),
                withTiming(1, { duration: 2000 }),
                withTiming(0, { duration: 250, easing: Easing.in(Easing.ease) }),
                withTiming(0, { duration: 100 }),
            ),
            -1,
        );
        bellRingProgress.value = withRepeat(
            withTiming(1, { duration: 4200 }),
            -1,
        );

        return () => {
            cancelAnimation(glowOneProgress);
            cancelAnimation(glowTwoProgress);
            cancelAnimation(bannerProgress);
            cancelAnimation(bellRingProgress);
        };
    }, [isActive, glowOneProgress, glowTwoProgress, bannerProgress, bellRingProgress]);

    const glowOneAnimatedProps = useAnimatedProps(() => ({
        opacity: interpolate(glowOneProgress.value, [0, 1], [0.55, 0.85]),
        scaleX: interpolate(glowOneProgress.value, [0, 1], [1, 1.06]),
        scaleY: interpolate(glowOneProgress.value, [0, 1], [1, 1.06]),
        originX: 135,
        originY: 125,
    }));
    const glowTwoAnimatedProps = useAnimatedProps(() => ({
        opacity: interpolate(glowTwoProgress.value, [0, 1], [0.55, 0.85]),
        scaleX: interpolate(glowTwoProgress.value, [0, 1], [1, 1.06]),
        scaleY: interpolate(glowTwoProgress.value, [0, 1], [1, 1.06]),
        originX: 135,
        originY: 125,
    }));
    const bannerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: bannerProgress.value,
        transform: [{
            translateY: interpolate(bannerProgress.value, [0, 1], [-bannerExitTranslation, 0]),
        }],
    }));
    const bellAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{
            rotate: `${interpolate(
                bellRingProgress.value,
                [0, 0.86, 0.89, 0.92, 0.95, 1],
                [0, 0, -13, 10, -6, 0],
            )}deg`,
        }],
    }));

    return (
        <View pointerEvents="none" style={styles.container}>
            <Svg width="100%" height="100%" viewBox="0 0 270 250" style={styles.glowArtwork}>
                <Defs>
                    <RadialGradient id="notificationGlowOne" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor={taskTheme.colors.primary} stopOpacity={0.26} />
                        <Stop offset="70%" stopColor={taskTheme.colors.primary} stopOpacity={0} />
                    </RadialGradient>
                    <RadialGradient id="notificationGlowTwo" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor={taskTheme.colors.primary} stopOpacity={0.2} />
                        <Stop offset="70%" stopColor={taskTheme.colors.primary} stopOpacity={0} />
                    </RadialGradient>
                </Defs>
                <AnimatedEllipse
                    cx={135}
                    cy={125}
                    rx={107}
                    ry={97}
                    fill="url(#notificationGlowOne)"
                    animatedProps={glowOneAnimatedProps}
                />
                <AnimatedEllipse
                    cx={135}
                    cy={125}
                    rx={81}
                    ry={71}
                    fill="url(#notificationGlowTwo)"
                    animatedProps={glowTwoAnimatedProps}
                />
            </Svg>

            <View style={styles.phoneShadow}>
                <View style={styles.phone}>
                    <View style={styles.phoneStatusBar}>
                        <AppText style={styles.phoneTime}>6:31</AppText>
                    </View>
                    <Animated.View style={[styles.notificationBanner, bannerAnimatedStyle]}>
                        <View style={styles.appIcon}>
                            <Animated.View style={bellAnimatedStyle}>
                                <Svg width={RS(13)} height={RS(13)} viewBox="0 0 24 24">
                                    <Path
                                        d="M6 9a6 6 0 0 1 12 0c0 4.5 1.5 6 1.5 6h-15S6 13.5 6 9Z"
                                        fill="none"
                                        stroke={taskTheme.colors.white}
                                        strokeWidth={2}
                                        strokeLinejoin="round"
                                    />
                                    <Path
                                        d="M10 18a2 2 0 0 0 4 0"
                                        fill="none"
                                        stroke={taskTheme.colors.white}
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                    />
                                </Svg>
                            </Animated.View>
                        </View>
                        <View style={styles.notificationCopy}>
                            <AppText style={styles.notificationTitle}>VoxList AI</AppText>
                            <AppText style={styles.notificationMessage}>
                                Reminder: Call mom at 5 PM
                            </AppText>
                        </View>
                    </Animated.View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'visible',
    },
    glowArtwork: {
        position: 'absolute',
        left: 0,
        top: 0,
    },
    phoneShadow: {
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: RW(168),
        height: RH(224),
        marginLeft: -RW(84),
        marginTop: -RH(112),
        borderRadius: RS(22),
        backgroundColor: taskTheme.colors.background,
        shadowColor: taskTheme.colors.text,
        shadowOffset: { width: 0, height: RH(12) },
        shadowOpacity: 0.12,
        shadowRadius: RS(13),
        elevation: RS(8),
    },
    phone: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        overflow: 'hidden',
        backgroundColor: taskTheme.colors.background,
        borderWidth: RS(2),
        borderColor: taskTheme.colors.text,
        borderRadius: RS(22),
    },
    phoneStatusBar: {
        height: RH(24),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: taskTheme.colors.surface,
    },
    phoneTime: {
        color: taskTheme.colors.text,
        fontSize: RF(9),
        fontWeight: '600',
    },
    notificationBanner: {
        position: 'absolute',
        top: RH(28),
        left: RW(8),
        right: RW(8),
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: RW(8),
        paddingVertical: RH(9),
        paddingHorizontal: RW(10),
        borderRadius: RS(12),
        backgroundColor: taskTheme.colors.surface,
        shadowColor: taskTheme.colors.text,
        shadowOffset: { width: 0, height: RH(8) },
        shadowOpacity: 0.14,
        shadowRadius: RS(8),
        elevation: RS(6),
    },
    appIcon: {
        width: RW(24),
        height: RH(24),
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(7),
        backgroundColor: taskTheme.colors.primary,
    },
    notificationCopy: {
        flex: 1,
        gap: RH(3),
    },
    notificationTitle: {
        color: taskTheme.colors.text,
        fontSize: RF(9.5),
        fontWeight: '700',
    },
    notificationMessage: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(9),
        lineHeight: RF(12),
    },
});

export default NotificationPermissionIllustration;
