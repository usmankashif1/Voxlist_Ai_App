import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    cancelAnimation,
    Easing,
    interpolate,
    useAnimatedProps,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import Svg, {
    Circle,
    Defs,
    Ellipse,
    G,
    Line,
    LinearGradient,
    Path,
    RadialGradient,
    Rect,
    Stop,
    Text as SvgText,
} from 'react-native-svg';
import { taskTheme } from '../../../core/theme/taskTheme';
import { RS } from '../../../core/utils/responsive';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface VoiceToTasksIllustrationProps {
    isActive: boolean;
    replayKey: number;
}

interface VoiceWaveProps {
    d: string;
    stroke: string;
    strokeWidth: number;
    delay: number;
    isActive: boolean;
    replayKey: number;
}

interface EqualizerBarProps {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    duration: number;
    delay: number;
    isActive: boolean;
    replayKey: number;
}

interface AnimatedArtworkProps {
    isActive: boolean;
    replayKey: number;
}

const VoiceWave = ({
    d,
    stroke,
    strokeWidth,
    delay,
    isActive,
    replayKey,
}: VoiceWaveProps) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        cancelAnimation(progress);
        progress.value = 0;
        if (!isActive) {
            return;
        }

        progress.value = withDelay(
            delay,
            withRepeat(
                withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }),
                -1,
            ),
        );

        return () => cancelAnimation(progress);
    }, [delay, isActive, progress, replayKey]);

    const animatedProps = useAnimatedProps(() => ({
        opacity: interpolate(progress.value, [0, 0.35, 1], [0, 0.9, 0]),
        scaleX: interpolate(progress.value, [0, 1], [0.72, 1.28]),
        scaleY: interpolate(progress.value, [0, 1], [0.72, 1.28]),
        originX: 74,
        originY: 72,
    }));

    return (
        <AnimatedPath
            d={d}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            animatedProps={animatedProps}
        />
    );
};

const EqualizerBar = ({
    x,
    y,
    width,
    height,
    color,
    duration,
    delay,
    isActive,
    replayKey,
}: EqualizerBarProps) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        cancelAnimation(progress);
        progress.value = 0;
        if (!isActive) {
            return;
        }

        progress.value = withDelay(
            delay,
            withRepeat(
                withTiming(1, {
                    duration: duration / 2,
                    easing: Easing.inOut(Easing.ease),
                }),
                -1,
                true,
            ),
        );

        return () => cancelAnimation(progress);
    }, [delay, duration, isActive, progress, replayKey]);

    const animatedProps = useAnimatedProps(() => {
        const animatedHeight = interpolate(progress.value, [0, 1], [height * 0.35, height]);
        return {
            y: y + (height - animatedHeight) / 2,
            height: animatedHeight,
        };
    });

    return (
        <AnimatedRect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={width / 2}
            fill={color}
            animatedProps={animatedProps}
        />
    );
};

const AnimatedArtwork = ({ isActive, replayKey }: AnimatedArtworkProps) => {
    const breathing = useSharedValue(0);
    const headAngle = useSharedValue(0);
    const eyelidScale = useSharedValue(0.14);
    const mouthScale = useSharedValue(0.3);
    const recordingProgress = useSharedValue(0);
    const arrowProgress = useSharedValue(0);
    const arrowHeadProgress = useSharedValue(0);
    const arrowFloat = useSharedValue(0);
    const taskOneProgress = useSharedValue(0);
    const taskTwoProgress = useSharedValue(0);
    const taskThreeProgress = useSharedValue(0);

    useEffect(() => {
        cancelAnimation(breathing);
        cancelAnimation(headAngle);
        cancelAnimation(eyelidScale);
        cancelAnimation(mouthScale);
        cancelAnimation(recordingProgress);
        cancelAnimation(arrowProgress);
        cancelAnimation(arrowHeadProgress);
        cancelAnimation(arrowFloat);
        cancelAnimation(taskOneProgress);
        cancelAnimation(taskTwoProgress);
        cancelAnimation(taskThreeProgress);
        breathing.value = 0;
        headAngle.value = 0;
        eyelidScale.value = 0.14;
        mouthScale.value = 0.3;
        recordingProgress.value = 0;
        arrowProgress.value = 0;
        arrowHeadProgress.value = 0;
        arrowFloat.value = 0;
        taskOneProgress.value = 0;
        taskTwoProgress.value = 0;
        taskThreeProgress.value = 0;

        if (!isActive) {
            return;
        }

        const ease = Easing.inOut(Easing.ease);
        const entranceEase = Easing.bezier(0.22, 1, 0.36, 1);
        breathing.value = withRepeat(
            withTiming(1.2, { duration: 1900, easing: ease }),
            -1,
            true,
        );
        headAngle.value = withRepeat(
            withSequence(
                withTiming(1.4, { duration: 1620, easing: ease }),
                withTiming(-0.6, { duration: 1080, easing: ease }),
                withTiming(0, { duration: 900, easing: ease }),
            ),
            -1,
        );
        eyelidScale.value = withRepeat(
            withSequence(
                withTiming(0.14, { duration: 2024 }),
                withTiming(1, { duration: 184, easing: ease }),
                withTiming(0.14, { duration: 184, easing: ease }),
                withTiming(0.14, { duration: 2208 }),
            ),
            -1,
        );
        mouthScale.value = withRepeat(
            withSequence(
                withTiming(1.3, { duration: 225, easing: ease }),
                withTiming(0.45, { duration: 225, easing: ease }),
                withTiming(1.4, { duration: 225, easing: ease }),
                withTiming(0.3, { duration: 225, easing: ease }),
            ),
            -1,
        );
        recordingProgress.value = withRepeat(
            withTiming(1, { duration: 700, easing: ease }),
            -1,
            true,
        );
        arrowProgress.value = withDelay(
            240,
            withTiming(1, { duration: 620, easing: entranceEase }),
        );
        arrowHeadProgress.value = withDelay(
            240,
            withTiming(1, { duration: 680, easing: entranceEase }),
        );
        arrowFloat.value = withDelay(
            900,
            withRepeat(withTiming(1.8, { duration: 1600, easing: ease }), -1, true),
        );
        taskOneProgress.value = withDelay(
            420,
            withTiming(1, { duration: 420, easing: entranceEase }),
        );
        taskTwoProgress.value = withDelay(
            580,
            withTiming(1, { duration: 420, easing: entranceEase }),
        );
        taskThreeProgress.value = withDelay(
            740,
            withTiming(1, { duration: 420, easing: entranceEase }),
        );

        return () => {
            cancelAnimation(breathing);
            cancelAnimation(headAngle);
            cancelAnimation(eyelidScale);
            cancelAnimation(mouthScale);
            cancelAnimation(recordingProgress);
            cancelAnimation(arrowProgress);
            cancelAnimation(arrowHeadProgress);
            cancelAnimation(arrowFloat);
            cancelAnimation(taskOneProgress);
            cancelAnimation(taskTwoProgress);
            cancelAnimation(taskThreeProgress);
        };
    }, [
        isActive,
        replayKey,
        breathing,
        headAngle,
        eyelidScale,
        mouthScale,
        recordingProgress,
        arrowProgress,
        arrowHeadProgress,
        arrowFloat,
        taskOneProgress,
        taskTwoProgress,
        taskThreeProgress,
    ]);

    const upperBodyAnimatedProps = useAnimatedProps(() => ({
        translate: [0, breathing.value],
    }));
    const headAnimatedProps = useAnimatedProps(() => ({
        rotation: headAngle.value,
        originX: 64,
        originY: 82,
    }));
    const leftEyelidAnimatedProps = useAnimatedProps(() => ({
        scaleY: eyelidScale.value,
        originX: 58.5,
        originY: 48.6,
    }));
    const rightEyelidAnimatedProps = useAnimatedProps(() => ({
        scaleY: eyelidScale.value,
        originX: 73.5,
        originY: 48.6,
    }));
    const mouthAnimatedProps = useAnimatedProps(() => ({
        scaleY: mouthScale.value,
        originX: 66.5,
        originY: 69.2,
    }));
    const recordingDotAnimatedProps = useAnimatedProps(() => ({
        opacity: interpolate(recordingProgress.value, [0, 1], [1, 0.45]),
        scaleX: interpolate(recordingProgress.value, [0, 1], [1, 1.25]),
        scaleY: interpolate(recordingProgress.value, [0, 1], [1, 1.25]),
        originX: 316,
        originY: 57,
    }));
    const arrowLineAnimatedProps = useAnimatedProps(() => ({
        strokeDashoffset: interpolate(arrowProgress.value, [0, 1], [60, 0]),
        opacity: interpolate(arrowProgress.value, [0, 0.15, 1], [0, 1, 1]),
    }));
    const arrowHeadAnimatedProps = useAnimatedProps(() => ({
        opacity: interpolate(arrowHeadProgress.value, [0, 0.62, 0.86, 1], [0, 0, 1, 1]),
        scaleX: interpolate(arrowHeadProgress.value, [0, 0.62, 0.86, 1], [0.6, 0.6, 1.12, 1]),
        scaleY: interpolate(arrowHeadProgress.value, [0, 0.62, 0.86, 1], [0.6, 0.6, 1.12, 1]),
        originX: 167,
        originY: 76,
    }));
    const arrowFloatAnimatedProps = useAnimatedProps(() => ({
        translate: [0, -arrowFloat.value],
    }));
    const taskOneAnimatedProps = useAnimatedProps(() => ({
        opacity: taskOneProgress.value,
        translate: [0, interpolate(taskOneProgress.value, [0, 1], [5, 0])],
    }));
    const taskTwoAnimatedProps = useAnimatedProps(() => ({
        opacity: taskTwoProgress.value,
        translate: [0, interpolate(taskTwoProgress.value, [0, 1], [5, 0])],
    }));
    const taskThreeAnimatedProps = useAnimatedProps(() => ({
        opacity: taskThreeProgress.value,
        translate: [0, interpolate(taskThreeProgress.value, [0, 1], [5, 0])],
    }));

    return (
        <Svg
            width="100%"
            height="100%"
            viewBox="0 0 335 294"
            fill="none"
            style={styles.artwork}
        >
            <Defs>
                <RadialGradient id="voiceToTasksHalo" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor={taskTheme.colors.borderStrong} stopOpacity={0.55} />
                    <Stop offset="75%" stopColor={taskTheme.colors.border} stopOpacity={0.14} />
                    <Stop offset="100%" stopColor={taskTheme.colors.background} stopOpacity={0} />
                </RadialGradient>
                <LinearGradient id="voiceToTasksPhone" x1={0} y1={0} x2={1} y2={1}>
                    <Stop offset="0%" stopColor={taskTheme.colors.text} />
                    <Stop offset="55%" stopColor={taskTheme.colors.reminderTrackOn} />
                    <Stop offset="100%" stopColor={taskTheme.colors.primary} />
                </LinearGradient>
            </Defs>
            <Circle cx={72} cy={148} r={82} fill="url(#voiceToTasksHalo)" />
            <Ellipse cx={64} cy={281} rx={48} ry={6.5} fill={taskTheme.colors.borderStrong} opacity={0.78} />

            <G>
                <Path d="M44 172 L64 172 L61 224 L59 267 L45 267 L44 222 Z" fill={taskTheme.colors.text} />
                <Path d="M64 172 L84 172 L84 222 L81 267 L67 267 L64 224 Z" fill={taskTheme.colors.reminderTrackOn} />
                <Path d="M58 175 Q64 185 64 198" stroke={taskTheme.colors.reminderTrackOn} strokeWidth={1.2} strokeLinecap="round" opacity={0.6} />
                <G>
                    <Path d="M44 265 L59 265 L60 274 C60 277, 58 279, 54 279 L36 279 C34 279, 33 276, 36 273 Z" fill={taskTheme.colors.textSecondary} />
                    <Path d="M34 276 L60 276 C60 279, 58 280, 55 280 L36 280 C34 280, 33 278, 34 276 Z" fill={taskTheme.colors.surface} />
                    <Line x1={44} y1={268} x2={49} y2={269} stroke={taskTheme.colors.surface} strokeWidth={1.2} strokeLinecap="round" />
                    <Line x1={42} y1={271} x2={47} y2={272} stroke={taskTheme.colors.surface} strokeWidth={1.2} strokeLinecap="round" />
                </G>
                <G>
                    <Path d="M67 265 L82 265 L90 273 C93 276, 92 279, 89 279 L68 279 C66 279, 66 277, 67 274 Z" fill={taskTheme.onboardingIllustration.shoeDark} />
                    <Path d="M66 276 L92 276 C92 278, 91 280, 88 280 L68 280 C66 280, 66 279, 66 276 Z" fill={taskTheme.colors.background} />
                    <Line x1={77} y1={268} x2={82} y2={269} stroke={taskTheme.colors.surface} strokeWidth={1.2} strokeLinecap="round" />
                    <Line x1={79} y1={271} x2={84} y2={272} stroke={taskTheme.colors.surface} strokeWidth={1.2} strokeLinecap="round" />
                </G>
            </G>

            <AnimatedG animatedProps={upperBodyAnimatedProps}>
                <Path d="M52 90 L76 90 L76 174 L52 174 Z" fill={taskTheme.colors.surface} />
                <Path d="M55 91 Q64 98 73 91" fill="none" stroke={taskTheme.colors.border} strokeWidth={1.4} strokeLinecap="round" />
                <Path d="M42 96 C44 90, 50 88, 56 89 L56 175 L41 175 C40 150, 40 118, 42 96 Z" fill={taskTheme.colors.text} />
                <Path d="M72 89 C79 88, 84 91, 86 98 L86 175 L71 175 Z" fill={taskTheme.onboardingIllustration.jacketSecondary} />
                <Path d="M50 88 L58 91 L56 104 L46 96 Z" fill={taskTheme.colors.reminderTrackOn} />
                <Path d="M71 89 L80 92 L77 104 L69 96 Z" fill={taskTheme.colors.reminderTrackOn} />
                <G>
                    <Rect x={44} y={112} width={9.5} height={11} rx={1.5} fill="none" stroke={taskTheme.colors.reminderTrackOn} strokeWidth={1.1} />
                    <Path d="M44 115 L48.7 117.5 L53.5 115" stroke={taskTheme.colors.reminderTrackOn} strokeWidth={1.1} fill="none" />
                    <Circle cx={48.7} cy={115.5} r={0.9} fill={taskTheme.colors.textSecondary} />
                    <Rect x={74} y={112} width={9.5} height={11} rx={1.5} fill="none" stroke={taskTheme.colors.reminderTrackOn} strokeWidth={1.1} />
                    <Path d="M74 115 L78.7 117.5 L83.5 115" stroke={taskTheme.colors.reminderTrackOn} strokeWidth={1.1} fill="none" />
                    <Circle cx={78.7} cy={115.5} r={0.9} fill={taskTheme.colors.textSecondary} />
                </G>
                <Line x1={56} y1={96} x2={56} y2={175} stroke={taskTheme.colors.reminderTrackOn} strokeWidth={1.2} opacity={0.65} />
                <Line x1={71} y1={96} x2={71} y2={175} stroke={taskTheme.colors.reminderTrackOn} strokeWidth={1.2} opacity={0.65} />
                <Path d="M56 76 L70 76 L72 92 L54 92 Z" fill={taskTheme.onboardingIllustration.skinLight} />
                <Path d="M57 79 Q63 85 70 79 L70 76 L56 76 Z" fill={taskTheme.onboardingIllustration.skinShade} opacity={0.7} />

                <AnimatedG animatedProps={headAnimatedProps}>
                    <G>
                        <Ellipse cx={43.5} cy={56.5} rx={3.8} ry={6} fill={taskTheme.onboardingIllustration.skinLight} stroke={taskTheme.onboardingIllustration.skinShade} strokeWidth={0.8} />
                        <Path d="M42.8 54 C44.5 54, 44.8 58.5, 42.8 59.2" stroke={taskTheme.onboardingIllustration.skinDeep} strokeWidth={1.1} strokeLinecap="round" />
                    </G>
                    <Path d="M44 50 C44 35, 54 28, 66 29 C76 29.5, 81 37, 81 49 L81 62 C80 73, 72 80, 62 80 C51 80, 44 71, 44 58 Z" fill={taskTheme.onboardingIllustration.skin} />
                    <Path d="M44 59 L47 59.5 C48.5 66.5, 55 71, 63 71 C71 71, 77 67, 80.5 60.5 L81 64 C79.5 74.5, 72 80.5, 62 80.5 C51.5 80.5, 44.5 72, 44 59 Z" fill={taskTheme.onboardingIllustration.beard} />
                    <Path d="M55 64.5 C58 62.5, 63 62.5, 67 63.5 C71 62.5, 75 63.5, 77 65 C75 66.5, 71 65.5, 67 65.2 C63 65.5, 58 66.5, 55 64.5 Z" fill={taskTheme.onboardingIllustration.beard} />
                    <Ellipse cx={66.5} cy={69} rx={7.5} ry={3.8} fill={taskTheme.onboardingIllustration.skin} />
                    <AnimatedEllipse
                        cx={66.5}
                        cy={69.2}
                        rx={3.4}
                        ry={2.1}
                        fill={taskTheme.onboardingIllustration.mouth}
                        animatedProps={mouthAnimatedProps}
                    />
                    <Path d="M64.2 68.1 Q66.5 68.6 68.8 68.1" stroke={taskTheme.colors.white} strokeWidth={0.9} strokeLinecap="round" opacity={0.85} />
                    <Path d="M42 54 C40 34, 49 23, 65 23 C76 23, 83 30, 82 39 C78 36, 73 35, 66 36 C59 37, 52 38, 48 45 L46 54 Z" fill={taskTheme.colors.reminderTrackOn} />
                    <Path d="M51 26 Q58 20 66 23 Q72 20 77 26" fill={taskTheme.colors.reminderTrackOn} />
                    <Path d="M56 27 Q64 25 71 28" stroke={taskTheme.colors.text} strokeWidth={1.6} strokeLinecap="round" opacity={0.7} />
                    <G>
                        <Path d="M54 46.2 Q58.5 44.4 62.8 46" stroke={taskTheme.colors.reminderTrackOn} strokeWidth={1.8} strokeLinecap="round" fill="none" />
                        <Path d="M70 46 Q73.8 44.6 77.5 46" stroke={taskTheme.colors.reminderTrackOn} strokeWidth={1.8} strokeLinecap="round" fill="none" />
                        <Ellipse cx={58.5} cy={52} rx={3.8} ry={3.2} fill={taskTheme.colors.white} />
                        <Circle cx={59.8} cy={52.3} r={1.75} fill={taskTheme.colors.reminderTrackOn} />
                        <Circle cx={60.4} cy={51.6} r={0.55} fill={taskTheme.colors.white} />
                        <AnimatedPath
                            d="M54.3 48.6 L62.7 48.6 L62.7 55.4 C60 55.8, 57 55.8, 54.3 55.4 Z"
                            fill={taskTheme.onboardingIllustration.skinWarm}
                            animatedProps={leftEyelidAnimatedProps}
                        />
                        <Ellipse cx={73.5} cy={52} rx={3.4} ry={3.1} fill={taskTheme.colors.white} />
                        <Circle cx={74.6} cy={52.3} r={1.65} fill={taskTheme.colors.reminderTrackOn} />
                        <Circle cx={75.1} cy={51.6} r={0.5} fill={taskTheme.colors.white} />
                        <AnimatedPath
                            d="M69.7 48.6 L77.3 48.6 L77.3 55.4 C75 55.8, 72 55.8, 69.7 55.4 Z"
                            fill={taskTheme.onboardingIllustration.skinWarm}
                            animatedProps={rightEyelidAnimatedProps}
                        />
                    </G>
                    <Path d="M66.8 50.5 L69.5 58.8 L65.5 60.2" fill="none" stroke={taskTheme.onboardingIllustration.skinShade} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                </AnimatedG>

                <G>
                    <VoiceWave
                        d="M78 66 Q83 71 78 77"
                        stroke={taskTheme.colors.success}
                        strokeWidth={1.6}
                        delay={0}
                        isActive={isActive}
                        replayKey={replayKey}
                    />
                    <VoiceWave
                        d="M84 62 Q92 71 84 81"
                        stroke={taskTheme.colors.text}
                        strokeWidth={1.5}
                        delay={380}
                        isActive={isActive}
                        replayKey={replayKey}
                    />
                    <VoiceWave
                        d="M90 58 Q101 71 90 85"
                        stroke={taskTheme.colors.textSecondary}
                        strokeWidth={1.3}
                        delay={760}
                        isActive={isActive}
                        replayKey={replayKey}
                    />
                </G>

                <G>
                    <Path d="M42 100 C33 118, 34 134, 41 146" stroke={taskTheme.colors.text} strokeWidth={13.5} strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M36 128 L42 132" stroke={taskTheme.colors.reminderTrackOn} strokeWidth={1.2} strokeLinecap="round" opacity={0.65} />
                    <Path d="M36 144 L46 146" stroke={taskTheme.colors.reminderTrackOn} strokeWidth={3.2} strokeLinecap="round" />
                    <G>
                        <Path
                            d="M36.5 145.5 L45.5 147 C47 151, 47.5 155, 45.5 158 C43.5 161, 39 161, 37.5 157.5 C36 154, 35.8 149, 36.5 145.5 Z"
                            fill={taskTheme.onboardingIllustration.skin}
                            stroke={taskTheme.onboardingIllustration.skinStroke}
                            strokeWidth={0.6}
                        />
                        <Path
                            d="M44.5 148.5 C47.5 149.5, 49 152, 47.5 154.5 C46.2 156, 44.5 155, 44 153 Z"
                            fill={taskTheme.onboardingIllustration.skinWarm}
                            stroke={taskTheme.onboardingIllustration.skinStroke}
                            strokeWidth={0.6}
                        />
                        <Rect x={37.2} y={156} width={2.2} height={5.5} rx={1.1} fill={taskTheme.onboardingIllustration.skin} stroke={taskTheme.onboardingIllustration.skinStroke} strokeWidth={0.55} />
                        <Rect x={39.5} y={156.5} width={2.3} height={6.2} rx={1.15} fill={taskTheme.onboardingIllustration.skin} stroke={taskTheme.onboardingIllustration.skinStroke} strokeWidth={0.55} />
                        <Rect x={41.9} y={156.2} width={2.2} height={5.6} rx={1.1} fill={taskTheme.onboardingIllustration.skin} stroke={taskTheme.onboardingIllustration.skinStroke} strokeWidth={0.55} />
                        <Rect x={44.1} y={155.2} width={2} height={4.6} rx={1} fill={taskTheme.onboardingIllustration.skin} stroke={taskTheme.onboardingIllustration.skinStroke} strokeWidth={0.55} />
                        <G transform="rotate(10 41 146)">
                            <Rect x={36.2} y={144.3} width={9.6} height={3.2} rx={1} fill={taskTheme.colors.primary} />
                            <Circle cx={41} cy={145.9} r={3} fill={taskTheme.colors.surface} stroke={taskTheme.colors.reminderTrackOn} strokeWidth={1.1} />
                        </G>
                    </G>
                    <G>
                        <Path d="M80 101 L100 138" stroke={taskTheme.onboardingIllustration.jacketArm} strokeWidth={13} strokeLinecap="round" />
                        <Path d="M100 138 L111 121.5" stroke={taskTheme.onboardingIllustration.jacketArm} strokeWidth={11.5} strokeLinecap="round" />
                        <Path d="M78.5 94.5 Q86 99 85.5 108" stroke={taskTheme.colors.reminderTrackOn} strokeWidth={1.1} strokeLinecap="round" fill="none" opacity={0.5} />
                        <Path d="M93.5 134.5 Q98 131.5 102 134" stroke={taskTheme.colors.reminderTrackOn} strokeWidth={1.1} strokeLinecap="round" fill="none" opacity={0.55} />
                    </G>
                    <Path d="M111.6 120.5 L114.4 113" stroke={taskTheme.onboardingIllustration.skinLight} strokeWidth={8.6} />
                    <G>
                        <G transform="translate(124 84) rotate(14)">
                            <Rect x={-11.5} y={-21} width={23} height={42} rx={5.5} fill={taskTheme.colors.border} />
                            <Rect x={-11} y={-20.5} width={22} height={41} rx={5} fill={taskTheme.colors.primary} />
                            <Rect x={-9.9} y={-19.4} width={19.8} height={38.8} rx={4} fill="url(#voiceToTasksPhone)" stroke={taskTheme.onboardingIllustration.phoneStroke} strokeWidth={0.6} />
                            <Rect x={-12.3} y={-11} width={1.2} height={5} rx={0.6} fill={taskTheme.colors.textSecondary} />
                            <Rect x={-12.3} y={-4} width={1.2} height={5} rx={0.6} fill={taskTheme.colors.textSecondary} />
                            <Rect x={-8.4} y={-17.5} width={8.6} height={11.5} rx={2.3} fill={taskTheme.onboardingIllustration.phoneLens} stroke={taskTheme.onboardingIllustration.phoneStroke} strokeWidth={0.6} />
                            <Circle cx={-5.2} cy={-14} r={1.9} fill={taskTheme.colors.primary} stroke={taskTheme.colors.textSecondary} strokeWidth={0.6} />
                            <Circle cx={-4.7} cy={-14.5} r={0.55} fill={taskTheme.colors.borderStrong} opacity={0.8} />
                            <Circle cx={-5.2} cy={-9} r={1.9} fill={taskTheme.colors.primary} stroke={taskTheme.colors.textSecondary} strokeWidth={0.6} />
                            <Circle cx={-4.7} cy={-9.5} r={0.55} fill={taskTheme.colors.borderStrong} opacity={0.8} />
                            <Circle cx={-1.4} cy={-11.8} r={1} fill={taskTheme.colors.surfaceMuted} opacity={0.85} />
                            <Circle cx={-1.4} cy={-8.5} r={0.7} fill={taskTheme.colors.textSecondary} />
                            <Circle cx={0} cy={0.5} r={3.2} fill="none" stroke={taskTheme.colors.textSecondary} strokeWidth={0.6} opacity={0.45} />
                        </G>
                    </G>
                    <G>
                        <G transform="translate(124 84) rotate(14)">
                            <Rect x={6} y={8.6} width={9.4} height={3.9} rx={1.95} fill={taskTheme.onboardingIllustration.skin} stroke={taskTheme.onboardingIllustration.skinStroke} strokeWidth={0.6} />
                            <Rect x={6} y={12.6} width={9.6} height={3.9} rx={1.95} fill={taskTheme.onboardingIllustration.skin} stroke={taskTheme.onboardingIllustration.skinStroke} strokeWidth={0.6} />
                            <Rect x={6} y={16.6} width={9.2} height={3.9} rx={1.95} fill={taskTheme.onboardingIllustration.skin} stroke={taskTheme.onboardingIllustration.skinStroke} strokeWidth={0.6} />
                            <Rect x={6} y={20.4} width={8} height={3.6} rx={1.8} fill={taskTheme.onboardingIllustration.skin} stroke={taskTheme.onboardingIllustration.skinStroke} strokeWidth={0.6} />
                            <Path
                                d="M-6.8 33 C-8.5 28 -10.2 23.5 -10.2 17 L-10.2 9.5 Q0.4 6.8 11 9.5 L11 17.5 C11 24 7 28.5 1.6 33 Z"
                                fill={taskTheme.onboardingIllustration.skin}
                            />
                            <Path d="M-6 19 Q-2 24 -1 29" stroke={taskTheme.onboardingIllustration.skinShadow} strokeWidth={1} strokeLinecap="round" fill="none" opacity={0.65} />
                            <Path d="M6.2 12.6 L10.6 12.6 M6.2 16.6 L10.6 16.6 M6.2 20.4 L9.6 20.4" stroke={taskTheme.onboardingIllustration.skinStroke} strokeWidth={0.6} strokeLinecap="round" opacity={0.8} />
                            <Path
                                d="M-8 8.5 C-12 6.5 -16.4 8.8 -16.4 12 C-16.4 15.2 -13 16.8 -9 15.6 Z"
                                fill={taskTheme.onboardingIllustration.skinWarm}
                                stroke={taskTheme.onboardingIllustration.skinStroke}
                                strokeWidth={0.6}
                                strokeLinejoin="round"
                            />
                            <Path d="M-14.6 10.6 Q-13 9.8 -11.6 10.4" stroke={taskTheme.colors.white} strokeWidth={0.7} strokeLinecap="round" fill="none" opacity={0.6} />
                        </G>
                    </G>
                    <Path d="M106.9 117.4 L116.1 123.6" stroke={taskTheme.colors.reminderTrackOn} strokeWidth={3.4} strokeLinecap="round" />
                </G>
            </AnimatedG>

            <AnimatedG animatedProps={arrowFloatAnimatedProps}>
                <AnimatedPath
                    d="M 151 100 C 152 84, 158 76, 167 76"
                    stroke={taskTheme.colors.primary}
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={60}
                    animatedProps={arrowLineAnimatedProps}
                />
                <AnimatedPath
                    d="M 162 71 L 169 76 L 162 81"
                    stroke={taskTheme.colors.primary}
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    animatedProps={arrowHeadAnimatedProps}
                />
            </AnimatedG>

            <G>
                <Rect x={179} y={46} width={150} height={186} rx={14} fill={taskTheme.colors.surface} stroke={taskTheme.colors.border} strokeWidth={1.2} />
                <Rect x={179} y={46} width={150} height={22} rx={14} fill={taskTheme.colors.surfaceMuted} />
                <Rect x={179} y={58} width={150} height={10} fill={taskTheme.colors.surfaceMuted} />
                <Line x1={179} y1={68} x2={329} y2={68} stroke={taskTheme.colors.border} strokeWidth={0.8} />
                <SvgText x={189} y={60.5} fill={taskTheme.colors.text} fontSize={8} fontWeight="700" fontFamily="Inter">Voice to Tasks</SvgText>
                <AnimatedCircle
                    cx={316}
                    cy={57}
                    r={2.8}
                    fill={taskTheme.colors.success}
                    animatedProps={recordingDotAnimatedProps}
                />

                <Rect x={185} y={73} width={138} height={44} rx={7} fill={taskTheme.colors.surfaceMuted} stroke={taskTheme.colors.primary} strokeWidth={1.2} />
                <Circle cx={198} cy={87} r={7.5} fill={taskTheme.colors.primary} />
                <Rect x={196.4} y={82.5} width={3.2} height={5.4} rx={1.6} fill={taskTheme.colors.white} />
                <Path d="M194.8 87.2 A3.2 3.2 0 0 0 201.2 87.2" stroke={taskTheme.colors.white} strokeWidth={1} strokeLinecap="round" fill="none" />
                <Line x1={198} y1={90.4} x2={198} y2={91.8} stroke={taskTheme.colors.white} strokeWidth={1} strokeLinecap="round" />

                <G>
                    <EqualizerBar x={212} y={83} width={2.2} height={8} color={taskTheme.colors.text} duration={720} delay={0} isActive={isActive} replayKey={replayKey} />
                    <EqualizerBar x={217} y={80} width={2.2} height={14} color={taskTheme.colors.primary} duration={640} delay={110} isActive={isActive} replayKey={replayKey} />
                    <EqualizerBar x={222} y={82} width={2.2} height={10} color={taskTheme.colors.text} duration={780} delay={220} isActive={isActive} replayKey={replayKey} />
                    <EqualizerBar x={227} y={78} width={2.2} height={18} color={taskTheme.colors.primary} duration={580} delay={70} isActive={isActive} replayKey={replayKey} />
                    <EqualizerBar x={232} y={81} width={2.2} height={12} color={taskTheme.colors.text} duration={750} delay={180} isActive={isActive} replayKey={replayKey} />
                    <EqualizerBar x={237} y={79} width={2.2} height={16} color={taskTheme.colors.primary} duration={620} delay={300} isActive={isActive} replayKey={replayKey} />
                    <EqualizerBar x={242} y={82} width={2.2} height={10} color={taskTheme.colors.text} duration={700} delay={140} isActive={isActive} replayKey={replayKey} />
                    <EqualizerBar x={247} y={80} width={2.2} height={14} color={taskTheme.colors.primary} duration={660} delay={260} isActive={isActive} replayKey={replayKey} />
                    <EqualizerBar x={252} y={83} width={2.2} height={8} color={taskTheme.colors.textSecondary} duration={740} delay={90} isActive={isActive} replayKey={replayKey} />
                </G>

                <Rect x={289} y={81.5} width={28} height={11} rx={5.5} fill={taskTheme.colors.border} />
                <SvgText x={303} y={89.2} textAnchor="middle" fill={taskTheme.colors.text} fontSize={6} fontWeight="700" fontFamily="Inter">0:08</SvgText>
                <SvgText x={191} y={108.5} fill={taskTheme.colors.textSecondary} fontSize={6.1} fontWeight="500" fontFamily="Inter">
                    &quot;Book dentist Tuesday &amp; send weekly report...&quot;
                </SvgText>

                <Line x1={190} y1={126} x2={318} y2={126} stroke={taskTheme.colors.border} strokeWidth={0.8} />
                <Rect x={227} y={120} width={54} height={12} rx={6} fill={taskTheme.colors.primary} />
                <SvgText x={254} y={128} textAnchor="middle" fill={taskTheme.colors.white} fontSize={5.8} fontWeight="700" fontFamily="Inter">AI STRUCTURED</SvgText>

                <AnimatedG animatedProps={taskOneAnimatedProps}>
                    <Rect x={185} y={137} width={138} height={27} rx={6} fill={taskTheme.colors.surface} stroke={taskTheme.colors.border} strokeWidth={0.9} />
                    <Rect x={190} y={145.5} width={9.5} height={9.5} rx={2.6} fill={taskTheme.colors.success} />
                    <Path d="M192.4 150.3 L194.1 152 L197.1 148.5" stroke={taskTheme.colors.white} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
                    <SvgText x={204} y={149.2} fill={taskTheme.colors.text} fontSize={6.6} fontWeight="600" fontFamily="Inter">Book dentist appointment</SvgText>
                    <SvgText x={204} y={158.2} fill={taskTheme.colors.textSecondary} fontSize={5.6} fontWeight="500" fontFamily="Inter">Next Tuesday</SvgText>
                </AnimatedG>
                <AnimatedG animatedProps={taskTwoAnimatedProps}>
                    <Rect x={185} y={168} width={138} height={27} rx={6} fill={taskTheme.colors.surface} stroke={taskTheme.colors.border} strokeWidth={0.9} />
                    <Rect x={190} y={176.5} width={9.5} height={9.5} rx={2.6} fill={taskTheme.colors.success} />
                    <Path d="M192.4 181.3 L194.1 183 L197.1 179.5" stroke={taskTheme.colors.white} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
                    <SvgText x={204} y={180.2} fill={taskTheme.colors.text} fontSize={6.6} fontWeight="600" fontFamily="Inter">Send weekly report</SvgText>
                    <SvgText x={204} y={189.2} fill={taskTheme.colors.textSecondary} fontSize={5.6} fontWeight="500" fontFamily="Inter">Due Friday</SvgText>
                </AnimatedG>
                <AnimatedG animatedProps={taskThreeAnimatedProps}>
                    <Rect x={185} y={199} width={138} height={27} rx={6} fill={taskTheme.colors.surfaceMuted} stroke={taskTheme.colors.border} strokeWidth={0.9} />
                    <Rect x={190} y={207.5} width={9.5} height={9.5} rx={2.6} fill={taskTheme.colors.primary} />
                    <Path d="M192.4 212.3 L194.1 214 L197.1 210.5" stroke={taskTheme.colors.white} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
                    <SvgText x={204} y={211.2} fill={taskTheme.colors.text} fontSize={6.6} fontWeight="600" fontFamily="Inter">Call client on invoice</SvgText>
                    <SvgText x={204} y={220.2} fill={taskTheme.colors.textSecondary} fontSize={5.6} fontWeight="500" fontFamily="Inter">Today</SvgText>
                </AnimatedG>
            </G>
        </Svg>
    );
};

const VoiceToTasksIllustration = ({ isActive, replayKey }: VoiceToTasksIllustrationProps) => (
    <View style={styles.container}>
        <View pointerEvents="none" style={styles.cardShadow} />
        <View pointerEvents="none" style={styles.phoneShadow} />
        <AnimatedArtwork isActive={isActive} replayKey={replayKey} />
    </View>
);

const styles = StyleSheet.create({
    container: {
        width: '100%',
        aspectRatio: 335 / 294,
        overflow: 'visible',
    },
    artwork: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    cardShadow: {
        position: 'absolute',
        left: '53.43%',
        top: '15.65%',
        width: '44.77%',
        height: '63.27%',
        borderRadius: RS(14),
        backgroundColor: taskTheme.colors.surface,
        shadowColor: taskTheme.colors.text,
        shadowOffset: { width: 0, height: RS(8) },
        shadowOpacity: 0.09,
        shadowRadius: RS(8),
        elevation: 5,
    },
    phoneShadow: {
        position: 'absolute',
        left: '32.1%',
        top: '20.7%',
        width: '9.7%',
        height: '15.7%',
        borderRadius: RS(7),
        backgroundColor: taskTheme.colors.primary,
        shadowColor: taskTheme.colors.primary,
        shadowOffset: { width: RS(1), height: RS(4) },
        shadowOpacity: 0.22,
        shadowRadius: RS(3.5),
        elevation: 4,
        transform: [{ rotate: '14deg' }],
    },
});

export default VoiceToTasksIllustration;
