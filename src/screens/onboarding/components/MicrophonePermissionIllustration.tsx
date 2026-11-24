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
import Svg, { Defs, Ellipse, Line, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import AppText from '../../../components/AppText';
import { taskTheme } from '../../../core/theme/taskTheme';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

interface MicrophonePermissionIllustrationProps {
    isActive: boolean;
}

const MicrophonePermissionIllustration = ({
    isActive,
}: MicrophonePermissionIllustrationProps) => {
    const glowOneProgress = useSharedValue(0);
    const glowTwoProgress = useSharedValue(0);
    const ringOneProgress = useSharedValue(0);
    const ringTwoProgress = useSharedValue(0);
    const sheetProgress = useSharedValue(1);
    const allowPulseProgress = useSharedValue(0);
    const sheetTranslationDistance = RH(80);
    const allowPulseShadowRadius = RS(6);

    useEffect(() => {
        cancelAnimation(glowOneProgress);
        cancelAnimation(glowTwoProgress);
        cancelAnimation(ringOneProgress);
        cancelAnimation(ringTwoProgress);
        cancelAnimation(sheetProgress);
        cancelAnimation(allowPulseProgress);
        glowOneProgress.value = 0;
        glowTwoProgress.value = 0;
        ringOneProgress.value = 0;
        ringTwoProgress.value = 0;
        sheetProgress.value = 1;
        allowPulseProgress.value = 0;

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
        ringOneProgress.value = withRepeat(
            withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }),
            -1,
        );
        ringTwoProgress.value = withDelay(
            650,
            withRepeat(
                withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }),
                -1,
            ),
        );
        sheetProgress.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 630 }),
                withTiming(0, { duration: 720, easing: ease }),
                withTiming(0, { duration: 2340 }),
                withTiming(1, { duration: 630, easing: ease }),
                withTiming(1, { duration: 180 }),
            ),
            -1,
        );
        allowPulseProgress.value = withRepeat(
            withSequence(
                withTiming(0, { duration: 1350 }),
                withTiming(1, { duration: 450, easing: ease }),
                withTiming(0, { duration: 450, easing: ease }),
                withTiming(0, { duration: 2250 }),
            ),
            -1,
        );

        return () => {
            cancelAnimation(glowOneProgress);
            cancelAnimation(glowTwoProgress);
            cancelAnimation(ringOneProgress);
            cancelAnimation(ringTwoProgress);
            cancelAnimation(sheetProgress);
            cancelAnimation(allowPulseProgress);
        };
    }, [
        isActive,
        glowOneProgress,
        glowTwoProgress,
        ringOneProgress,
        ringTwoProgress,
        sheetProgress,
        allowPulseProgress,
    ]);

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
    const ringOneAnimatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(ringOneProgress.value, [0, 1], [0.5, 0]),
        transform: [{ scale: interpolate(ringOneProgress.value, [0, 1], [0.7, 1.4]) }],
    }));
    const ringTwoAnimatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(ringTwoProgress.value, [0, 1], [0.5, 0]),
        transform: [{ scale: interpolate(ringTwoProgress.value, [0, 1], [0.7, 1.4]) }],
    }));
    const sheetAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: sheetProgress.value * sheetTranslationDistance }],
    }));
    const allowPulseAnimatedStyle = useAnimatedStyle(() => ({
        shadowOpacity: interpolate(allowPulseProgress.value, [0, 1], [0, 0.18]),
        shadowRadius: interpolate(allowPulseProgress.value, [0, 1], [0, allowPulseShadowRadius]),
    }));

    return (
        <View pointerEvents="none" style={styles.container}>
            <Svg width="100%" height="100%" viewBox="0 0 270 250" style={styles.glowArtwork}>
                <Defs>
                    <RadialGradient id="microphoneGlowOne" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor={taskTheme.colors.primary} stopOpacity={0.26} />
                        <Stop offset="70%" stopColor={taskTheme.colors.primary} stopOpacity={0} />
                    </RadialGradient>
                    <RadialGradient id="microphoneGlowTwo" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor={taskTheme.colors.primary} stopOpacity={0.2} />
                        <Stop offset="70%" stopColor={taskTheme.colors.primary} stopOpacity={0} />
                    </RadialGradient>
                </Defs>
                <AnimatedEllipse
                    cx={135}
                    cy={125}
                    rx={107}
                    ry={97}
                    fill="url(#microphoneGlowOne)"
                    animatedProps={glowOneAnimatedProps}
                />
                <AnimatedEllipse
                    cx={135}
                    cy={125}
                    rx={81}
                    ry={71}
                    fill="url(#microphoneGlowTwo)"
                    animatedProps={glowTwoAnimatedProps}
                />
            </Svg>

            <View style={styles.phoneShadow}>
                <View style={styles.phone}>
                    <View style={styles.phoneHeader}>
                        <View style={styles.speaker} />
                        <View style={styles.microphoneArea}>
                            <Animated.View style={[styles.ring, ringOneAnimatedStyle]} />
                            <Animated.View style={[styles.ring, ringTwoAnimatedStyle]} />
                            <View style={styles.microphoneBadge}>
                                <Svg width={RS(18)} height={RS(18)} viewBox="0 0 24 24">
                                    <Rect
                                        x={9}
                                        y={2}
                                        width={6}
                                        height={12}
                                        rx={3}
                                        fill="none"
                                        stroke={taskTheme.colors.text}
                                        strokeWidth={1.8}
                                    />
                                    <Path
                                        d="M5 11a7 7 0 0 0 14 0"
                                        fill="none"
                                        stroke={taskTheme.colors.text}
                                        strokeWidth={1.8}
                                        strokeLinecap="round"
                                    />
                                    <Line
                                        x1={12}
                                        y1={18}
                                        x2={12}
                                        y2={21}
                                        stroke={taskTheme.colors.text}
                                        strokeWidth={1.8}
                                        strokeLinecap="round"
                                    />
                                </Svg>
                            </View>
                        </View>
                    </View>

                    <Animated.View style={[styles.permissionSheet, sheetAnimatedStyle]}>
                        <AppText style={styles.sheetTitle}>Allow microphone access?</AppText>
                        <View style={styles.permissionChoices}>
                            <View style={styles.mockDenyButton}>
                                <AppText style={styles.mockDenyText}>Don't Allow</AppText>
                            </View>
                            <Animated.View style={[styles.mockAllowButton, allowPulseAnimatedStyle]}>
                                <AppText style={styles.mockAllowText}>Allow</AppText>
                            </Animated.View>
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
        backgroundColor: taskTheme.colors.surface,
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
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: taskTheme.colors.surface,
        borderWidth: RS(2),
        borderColor: taskTheme.colors.text,
        borderRadius: RS(22),
    },
    phoneHeader: {
        paddingTop: RH(14),
        alignItems: 'center',
    },
    speaker: {
        width: RW(36),
        height: RH(4),
        borderRadius: RS(2),
        backgroundColor: taskTheme.colors.borderStrong,
        marginBottom: RH(22),
    },
    microphoneArea: {
        width: RW(72),
        height: RH(72),
        alignItems: 'center',
        justifyContent: 'center',
    },
    ring: {
        position: 'absolute',
        width: RW(72),
        height: RH(72),
        borderRadius: RS(36),
        borderWidth: RS(1.4),
        borderColor: taskTheme.colors.primary,
    },
    microphoneBadge: {
        zIndex: 2,
        width: RW(44),
        height: RH(44),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(22),
        backgroundColor: taskTheme.colors.background,
        borderWidth: RS(1.5),
        borderColor: taskTheme.colors.border,
    },
    permissionSheet: {
        position: 'absolute',
        left: 0,
        bottom: 0,
        width: '100%',
        alignItems: 'center',
        gap: RH(9),
        paddingTop: RH(12),
        paddingHorizontal: RW(14),
        paddingBottom: RH(14),
        backgroundColor: taskTheme.colors.surface,
        borderTopWidth: RS(1),
        borderTopColor: taskTheme.colors.border,
        borderTopLeftRadius: RS(14),
        borderTopRightRadius: RS(14),
        shadowColor: taskTheme.colors.text,
        shadowOffset: { width: 0, height: -RH(6) },
        shadowOpacity: 0.1,
        shadowRadius: RS(8),
        elevation: RS(6),
    },
    sheetTitle: {
        color: taskTheme.colors.text,
        fontSize: RF(10.5),
        fontWeight: '600',
        textAlign: 'center',
    },
    permissionChoices: {
        width: '100%',
        flexDirection: 'row',
        gap: RW(8),
    },
    mockDenyButton: {
        flex: 1,
        alignItems: 'center',
        borderWidth: RS(1),
        borderColor: taskTheme.colors.border,
        borderRadius: RS(8),
        paddingVertical: RH(6),
    },
    mockDenyText: {
        color: taskTheme.colors.textTertiary,
        fontSize: RF(10),
        fontWeight: '600',
    },
    mockAllowButton: {
        flex: 1,
        alignItems: 'center',
        borderRadius: RS(8),
        paddingVertical: RH(6),
        backgroundColor: taskTheme.colors.primary,
        shadowColor: taskTheme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
    },
    mockAllowText: {
        color: taskTheme.colors.white,
        fontSize: RF(10),
        fontWeight: '700',
    },
});

export default MicrophonePermissionIllustration;
