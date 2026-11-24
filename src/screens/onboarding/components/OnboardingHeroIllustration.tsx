import React, { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text as NativeText, View } from 'react-native';
import Svg, {
    Circle,
    Defs,
    Ellipse,
    G,
    Line,
    LinearGradient,
    Path,
    Polygon,
    RadialGradient,
    Rect,
    Stop,
    Text as SvgText,
} from 'react-native-svg';
import Animated, {
    cancelAnimation,
    Easing,
    interpolate,
    useAnimatedProps,
    useDerivedValue,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

const LINE_1 = 'Book dentist appointment';
const FULL_TEXT = `${LINE_1} for next Tuesday`;
const LOOP_MS = 3600;
const TYPE_START_MS = 350;
const TYPE_END_MS = 2750;
const KEY_FLASH_MS = 105;
const EYELID_REST_SCALE = 0.32;
const TYPE_KEY_TIMES = (() => {
    const weights = Array.from(FULL_TEXT).map((character, index) => {
        const jitter = 0.8 + ((index * 29 + 7) % 9) * 0.045;
        return character === ' ' ? 1.55 * jitter : jitter;
    });
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    const span = TYPE_END_MS - TYPE_START_MS;
    let elapsed = 0;

    return weights.map(weight => {
        elapsed += (weight / total) * span;
        return TYPE_START_MS + elapsed;
    });
})();

const KEYBOARD_KEYS = [
    { key: 'q', x: 188, y: 196, width: 10.8 },
    { key: 'w', x: 200.8, y: 196, width: 10.8 },
    { key: 'e', x: 213.6, y: 196, width: 10.8 },
    { key: 'r', x: 226.4, y: 196, width: 10.8 },
    { key: 't', x: 239.2, y: 196, width: 10.8 },
    { key: 'y', x: 252, y: 196, width: 10.8 },
    { key: 'u', x: 264.8, y: 196, width: 10.8 },
    { key: 'i', x: 277.6, y: 196, width: 10.8 },
    { key: 'o', x: 290.4, y: 196, width: 10.8 },
    { key: 'p', x: 303.2, y: 196, width: 16.8 },
    { key: 'a', x: 193, y: 205, width: 11.2 },
    { key: 's', x: 206.2, y: 205, width: 11.2 },
    { key: 'd', x: 219.4, y: 205, width: 11.2 },
    { key: 'f', x: 232.6, y: 205, width: 11.2 },
    { key: 'g', x: 245.8, y: 205, width: 11.2 },
    { key: 'h', x: 259, y: 205, width: 11.2 },
    { key: 'j', x: 272.2, y: 205, width: 11.2 },
    { key: 'k', x: 285.4, y: 205, width: 11.2 },
    { key: 'l', x: 298.6, y: 205, width: 16.4 },
    { key: ' ', x: 211, y: 214, width: 79 },
];

const AnimatedArtwork = React.memo(({ isActive }: { isActive: boolean }) => {
    const breathing = useSharedValue(0);
    const headAngle = useSharedValue(0);
    const eyelidScale = useSharedValue(EYELID_REST_SCALE);
    const stressOpacity = useSharedValue(0.42);
    const sweatAProgress = useSharedValue(0);
    const sweatBProgress = useSharedValue(0);
    const screenGlow = useSharedValue(0.22);
    const leftThumbProgress = useSharedValue(0);
    const rightThumbProgress = useSharedValue(0);
    const arrowProgress = useSharedValue(0);
    const arrowHeadProgress = useSharedValue(0);
    const arrowFloat = useSharedValue(0);

    useEffect(() => {
        cancelAnimation(breathing);
        cancelAnimation(headAngle);
        cancelAnimation(eyelidScale);
        cancelAnimation(stressOpacity);
        cancelAnimation(sweatAProgress);
        cancelAnimation(sweatBProgress);
        cancelAnimation(screenGlow);
        cancelAnimation(leftThumbProgress);
        cancelAnimation(rightThumbProgress);
        cancelAnimation(arrowProgress);
        cancelAnimation(arrowHeadProgress);
        cancelAnimation(arrowFloat);
        breathing.value = 0;
        headAngle.value = 0;
        eyelidScale.value = EYELID_REST_SCALE;
        stressOpacity.value = 0.42;
        sweatAProgress.value = 0;
        sweatBProgress.value = 0;
        screenGlow.value = 0.22;
        leftThumbProgress.value = 0;
        rightThumbProgress.value = 0;
        arrowProgress.value = 0;
        arrowHeadProgress.value = 0;
        arrowFloat.value = 0;

        if (!isActive) {
            return;
        }

        const ease = Easing.inOut(Easing.ease);
        const keyframeEase = Easing.inOut(Easing.ease);
        breathing.value = withRepeat(withTiming(1.5, { duration: 2000, easing: ease }), -1, true);
        headAngle.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 2200, easing: ease }),
                withTiming(0, { duration: 1800, easing: ease }),
            ),
            -1,
        );
        eyelidScale.value = withRepeat(
            withSequence(
                withTiming(EYELID_REST_SCALE, { duration: 1848 }),
                withTiming(1, { duration: 220, easing: ease }),
                withTiming(EYELID_REST_SCALE, { duration: 220, easing: ease }),
                withTiming(EYELID_REST_SCALE, { duration: 2112 }),
            ),
            -1,
        );
        stressOpacity.value = withRepeat(
            withTiming(0.92, { duration: 1150, easing: ease }),
            -1,
            true,
        );
        sweatAProgress.value = withRepeat(
            withSequence(
                withTiming(0.18, { duration: 504, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
                withTiming(0.76, { duration: 1624, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
                withTiming(0.96, { duration: 560, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
                withTiming(1, { duration: 112, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
            ),
            -1,
        );
        sweatBProgress.value = withRepeat(
            withSequence(
                withTiming(0.3, { duration: 840, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
                withTiming(0.48, { duration: 504, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
                withTiming(0.86, { duration: 1064, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
                withTiming(1, { duration: 392, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
            ),
            -1,
        );
        screenGlow.value = withRepeat(
            withTiming(0.48, { duration: 1100, easing: ease }),
            -1,
            true,
        );
        leftThumbProgress.value = withRepeat(
            withSequence(
                withTiming(0.18, { duration: 243, easing: keyframeEase }),
                withTiming(0.35, { duration: 230, easing: keyframeEase }),
                withTiming(0.52, { duration: 230, easing: keyframeEase }),
                withTiming(0.7, { duration: 243, easing: keyframeEase }),
                withTiming(1, { duration: 404, easing: keyframeEase }),
            ),
            -1,
        );
        rightThumbProgress.value = withRepeat(
            withSequence(
                withTiming(0.2, { duration: 270, easing: keyframeEase }),
                withTiming(0.38, { duration: 243, easing: keyframeEase }),
                withTiming(0.55, { duration: 230, easing: keyframeEase }),
                withTiming(0.72, { duration: 230, easing: keyframeEase }),
                withTiming(0.88, { duration: 216, easing: keyframeEase }),
                withTiming(1, { duration: 161, easing: keyframeEase }),
            ),
            -1,
        );
        arrowProgress.value = withDelay(
            240,
            withTiming(1, { duration: 620, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
        );
        arrowHeadProgress.value = withDelay(
            240,
            withTiming(1, { duration: 680, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
        );
        arrowFloat.value = withDelay(
            900,
            withRepeat(withTiming(1.8, { duration: 1600, easing: ease }), -1, true),
        );

        return () => {
            cancelAnimation(breathing);
            cancelAnimation(headAngle);
            cancelAnimation(eyelidScale);
            cancelAnimation(stressOpacity);
            cancelAnimation(sweatAProgress);
            cancelAnimation(sweatBProgress);
            cancelAnimation(screenGlow);
            cancelAnimation(leftThumbProgress);
            cancelAnimation(rightThumbProgress);
            cancelAnimation(arrowProgress);
            cancelAnimation(arrowHeadProgress);
            cancelAnimation(arrowFloat);
        };
    }, [
        isActive,
        breathing,
        headAngle,
        eyelidScale,
        stressOpacity,
        sweatAProgress,
        sweatBProgress,
        screenGlow,
        leftThumbProgress,
        rightThumbProgress,
        arrowProgress,
        arrowHeadProgress,
        arrowFloat,
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
        originY: 49,
    }));
    const rightEyelidAnimatedProps = useAnimatedProps(() => ({
        scaleY: eyelidScale.value,
        originX: 73.5,
        originY: 49,
    }));
    const leftStressFlushAnimatedProps = useAnimatedProps(() => ({
        opacity: stressOpacity.value,
    }));
    const rightStressFlushAnimatedProps = useAnimatedProps(() => ({
        opacity: stressOpacity.value,
    }));
    const foreheadStressFlushAnimatedProps = useAnimatedProps(() => ({
        opacity: stressOpacity.value,
    }));
    const sweatAAnimatedProps = useAnimatedProps(() => ({
        opacity: interpolate(sweatAProgress.value, [0, 0.18, 0.76, 0.96, 1], [0, 1, 0.95, 0, 0]),
        translate: [
            0,
            interpolate(sweatAProgress.value, [0, 0.18, 0.76, 0.96, 1], [-4, 0, 11, 19, 19]),
        ],
        scale: [
            interpolate(sweatAProgress.value, [0, 0.18, 0.76, 0.96, 1], [0.78, 1.12, 1, 0.75, 0.75]),
            interpolate(sweatAProgress.value, [0, 0.18, 0.76, 0.96, 1], [0.78, 1.12, 1, 0.75, 0.75]),
        ],
        origin: [49, 45],
    }));
    const sweatBAnimatedProps = useAnimatedProps(() => ({
        opacity: interpolate(sweatBProgress.value, [0, 0.3, 0.48, 0.86, 1], [0, 0, 1, 0.95, 0]),
        translate: [
            0,
            interpolate(sweatBProgress.value, [0, 0.3, 0.48, 0.86, 1], [-3, -3, 2, 13, 20]),
        ],
        scale: [
            interpolate(sweatBProgress.value, [0, 0.3, 0.48, 0.86, 1], [0.72, 0.72, 1.08, 1, 0.7]),
            interpolate(sweatBProgress.value, [0, 0.3, 0.48, 0.86, 1], [0.72, 0.72, 1.08, 1, 0.7]),
        ],
        origin: [76, 39],
    }));
    const screenGlowAnimatedProps = useAnimatedProps(() => ({
        opacity: screenGlow.value,
    }));
    const leftThumbAnimatedProps = useAnimatedProps(() => ({
        translate: [
            interpolate(leftThumbProgress.value, [0, 0.18, 0.35, 0.52, 0.7, 1], [0, 1.8, 0, 1.35, 0, 0]),
            interpolate(leftThumbProgress.value, [0, 0.18, 0.35, 0.52, 0.7, 1], [0, 2, 0, 1.4, 0, 0]),
        ],
    }));
    const rightThumbAnimatedProps = useAnimatedProps(() => ({
        translate: [
            interpolate(rightThumbProgress.value, [0, 0.2, 0.38, 0.55, 0.72, 0.88, 1], [0, 0, -1.8, 0, -1.35, 0, 0]),
            interpolate(rightThumbProgress.value, [0, 0.2, 0.38, 0.55, 0.72, 0.88, 1], [0, 0, 1.8, 0, 2, 0, 0]),
        ],
    }));
    const leftArmAnimatedProps = useAnimatedProps(() => ({
        translate: [
            0,
            interpolate(leftThumbProgress.value, [0, 0.18, 0.35, 0.52, 0.7, 1], [0, 0.8, 0, 0.65, 0, 0]),
        ],
        rotation: interpolate(leftThumbProgress.value, [0, 0.18, 0.35, 0.52, 0.7, 1], [0, 2, 0, 1.6, 0, 0]),
        originX: 48,
        originY: 119,
    }));
    const rightArmAnimatedProps = useAnimatedProps(() => ({
        translate: [
            0,
            interpolate(rightThumbProgress.value, [0, 0.2, 0.38, 0.55, 0.72, 0.88, 1], [0, 0, 0.8, 0, 0.65, 0, 0]),
        ],
        rotation: interpolate(rightThumbProgress.value, [0, 0.2, 0.38, 0.55, 0.72, 0.88, 1], [0, 0, -2, 0, -1.6, 0, 0]),
        originX: 90,
        originY: 119,
    }));
    const leftHandAnimatedProps = useAnimatedProps(() => ({
        translate: [
            0,
            interpolate(leftThumbProgress.value, [0, 0.18, 0.35, 0.52, 0.7, 1], [0, 1.2, 0, 0.9, 0, 0]),
        ],
        rotation: interpolate(leftThumbProgress.value, [0, 0.18, 0.35, 0.52, 0.7, 1], [0, 2.8, 0, 2, 0, 0]),
        originX: 78,
        originY: 133,
    }));
    const rightHandAnimatedProps = useAnimatedProps(() => ({
        translate: [
            0,
            interpolate(rightThumbProgress.value, [0, 0.2, 0.38, 0.55, 0.72, 0.88, 1], [0, 0, 1.2, 0, 0.9, 0, 0]),
        ],
        rotation: interpolate(rightThumbProgress.value, [0, 0.2, 0.38, 0.55, 0.72, 0.88, 1], [0, 0, -2.8, 0, -2, 0, 0]),
        originX: 101,
        originY: 132,
    }));
    const arrowLineAnimatedProps = useAnimatedProps(() => ({
        strokeDashoffset: interpolate(arrowProgress.value, [0, 1], [90, 0]),
        opacity: interpolate(arrowProgress.value, [0, 0.15, 1], [0, 1, 1]),
    }));
    const arrowHeadAnimatedProps = useAnimatedProps(() => ({
        opacity: interpolate(arrowHeadProgress.value, [0, 0.62, 0.86, 1], [0, 0, 1, 1]),
        scale: [
            interpolate(arrowHeadProgress.value, [0, 0.62, 0.86, 1], [0.6, 0.6, 1.12, 1]),
            interpolate(arrowHeadProgress.value, [0, 0.62, 0.86, 1], [0.6, 0.6, 1.12, 1]),
        ],
        origin: [165, 76],
    }));
    const arrowFloatAnimatedProps = useAnimatedProps(() => ({
        translate: [0, -arrowFloat.value],
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
            <RadialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor="#D5D9E1" stopOpacity={0.55} />
                        <Stop offset="75%" stopColor="#E1E4EA" stopOpacity={0.14} />
                        <Stop offset="100%" stopColor="#F6F7F9" stopOpacity={0} />
                    </RadialGradient>
            <RadialGradient id="stressCheekGrad" cx="50%" cy="50%" r="55%">
                        <Stop offset="0%" stopColor="#EF4444" stopOpacity={0.54} />
                        <Stop offset="65%" stopColor="#A12E2E" stopOpacity={0.2} />
                        <Stop offset="100%" stopColor="#A12E2E" stopOpacity={0} />
                    </RadialGradient>
            <LinearGradient id="beamGrad" x1={88} y1={112} x2={64} y2={62} gradientUnits="userSpaceOnUse">
                        <Stop offset="0%" stopColor="#697284" stopOpacity={0.24} />
                        <Stop offset="100%" stopColor="#F6F7F9" stopOpacity={0} />
                    </LinearGradient>
            <LinearGradient id="phoneBackGrad" x1={0} y1={0} x2={1} y2={1}>
                        <Stop offset="0%" stopColor="#252A40" />
                        <Stop offset="55%" stopColor="#15171C" />
                        <Stop offset="100%" stopColor="#000000" />
                    </LinearGradient>
                </Defs>
            <Circle cx={72} cy={148} r={82} fill="url(#haloGrad)" />
            <Ellipse cx={64} cy={281} rx={48} ry={6.5} fill="#D5D9E1" opacity={0.78} />
            <G>
                    <Path d="M44 172 L64 172 L61 224 L59 267 L45 267 L44 222 Z" fill="#252A40" />
                    <Path d="M64 172 L84 172 L84 222 L81 267 L67 267 L64 224 Z" fill="#15171C" />
                    <Path d="M58 175 Q64 185 64 198" stroke="#15171C" strokeWidth={1.2} strokeLinecap="round" opacity={0.6} />
            <G>
                        <Path d="M44 265 L59 265 L60 274 C60 277, 58 279, 54 279 L36 279 C34 279, 33 276, 36 273 Z" fill="#697284" />
                        <Path d="M34 276 L60 276 C60 279, 58 280, 55 280 L36 280 C34 280, 33 278, 34 276 Z" fill="#FFFFFF" />
                        <Line x1={44} y1={268} x2={49} y2={269} stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" />
                        <Line x1={42} y1={271} x2={47} y2={272} stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" />
                    </G>
            <G>
                        <Path d="M67 265 L82 265 L90 273 C93 276, 92 279, 89 279 L68 279 C66 279, 66 277, 67 274 Z" fill="#4B5364" />
                        <Path d="M66 276 L92 276 C92 278, 91 280, 88 280 L68 280 C66 280, 66 279, 66 276 Z" fill="#F6F7F9" />
                        <Line x1={77} y1={268} x2={82} y2={269} stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" />
                        <Line x1={79} y1={271} x2={84} y2={272} stroke="#FFFFFF" strokeWidth={1.2} strokeLinecap="round" />
                    </G>
            <AnimatedG animatedProps={upperBodyAnimatedProps}>
                        <Path d="M52 90 L76 90 L76 174 L52 174 Z" fill="#FFFFFF" />
                        <Path d="M55 91 Q64 98 73 91" fill="none" stroke="#E1E4EA" strokeWidth={1.4} strokeLinecap="round" />
                        <Path d="M42 96 C44 90, 50 88, 56 89 L56 175 L41 175 C40 150, 40 118, 42 96 Z" fill="#252A40" />
                        <Path d="M72 89 C79 88, 84 91, 86 98 L86 175 L71 175 Z" fill="#2F3652" />
                        <Path d="M50 88 L58 91 L56 104 L46 96 Z" fill="#15171C" />
                        <Path d="M71 89 L80 92 L77 104 L69 96 Z" fill="#15171C" />
            <G>
                            <Rect x={44} y={112} width={9.5} height={11} rx={1.5} fill="none" stroke="#15171C" strokeWidth={1.1} />
                            <Path d="M44 115 L48.7 117.5 L53.5 115" stroke="#15171C" strokeWidth={1.1} fill="none" />
                            <Circle cx={48.7} cy={115.5} r={0.9} fill="#697284" />
                            <Rect x={74} y={112} width={9.5} height={11} rx={1.5} fill="none" stroke="#15171C" strokeWidth={1.1} />
                            <Path d="M74 115 L78.7 117.5 L83.5 115" stroke="#15171C" strokeWidth={1.1} fill="none" />
                            <Circle cx={78.7} cy={115.5} r={0.9} fill="#697284" />
                        </G>
                        <Line x1={56} y1={96} x2={56} y2={175} stroke="#15171C" strokeWidth={1.2} opacity={0.65} />
                        <Line x1={71} y1={96} x2={71} y2={175} stroke="#15171C" strokeWidth={1.2} opacity={0.65} />
                        <Path d="M56 76 L70 76 L72 92 L54 92 Z" fill="#F2BE9A" />
                        <Path d="M57 79 Q63 85 70 79 L70 76 L56 76 Z" fill="#DDA17A" opacity={0.7} />
            <AnimatedG animatedProps={headAnimatedProps}>
            <G>
                                <Ellipse cx={43.5} cy={56.5} rx={3.8} ry={6} fill="#F2BE9A" stroke="#DDA17A" strokeWidth={0.8} />
                                <Path d="M42.8 54 C44.5 54, 44.8 58.5, 42.8 59.2" stroke="#C58B68" strokeWidth={1.1} strokeLinecap="round" />
                            </G>
                            <Path d="M44 50 C44 35, 54 28, 66 29 C76 29.5, 81 37, 81 49 L81 62 C80 73, 72 80, 62 80 C51 80, 44 71, 44 58 Z" fill="#F9C9A7" />
                            <AnimatedEllipse cx={55} cy={60} rx={7.5} ry={5} fill="url(#stressCheekGrad)" animatedProps={leftStressFlushAnimatedProps} />
                            <AnimatedEllipse cx={76} cy={59.5} rx={5.5} ry={4.5} fill="url(#stressCheekGrad)" animatedProps={rightStressFlushAnimatedProps} />
                            <AnimatedEllipse cx={65} cy={40} rx={10} ry={4.5} fill="url(#stressCheekGrad)" animatedProps={foreheadStressFlushAnimatedProps} />
                            <Path d="M44 59 L47 59.5 C48.5 66.5, 55 71, 63 71 C71 71, 77 67, 80.5 60.5 L81 64 C79.5 74.5, 72 80.5, 62 80.5 C51.5 80.5, 44.5 72, 44 59 Z" fill="#4A352D" />
                            <Path d="M55 64.5 C58 62.5, 63 62.5, 67 63.5 C71 62.5, 75 63.5, 77 65 C75 66.5, 71 65.5, 67 65.2 C63 65.5, 58 66.5, 55 64.5 Z" fill="#4A352D" />
                            <Ellipse cx={66.5} cy={69} rx={7.5} ry={3.6} fill="#F9C9A7" />
                            <Path d="M61.5 69.2 Q66.5 67.5 71.5 69.4" stroke="#8C543E" strokeWidth={1.5} strokeLinecap="round" fill="none" />
                            <Path d="M42 54 C40 34, 49 23, 65 23 C76 23, 83 30, 82 39 C78 36, 73 35, 66 36 C59 37, 52 38, 48 45 L46 54 Z" fill="#15171C" />
                            <Path d="M51 26 Q58 20 66 23 Q72 20 77 26" fill="#15171C" />
                            <Path d="M56 27 Q64 25 71 28" stroke="#252A40" strokeWidth={1.6} strokeLinecap="round" opacity={0.7} />
            <G>
                                <Path d="M53.5 45 L62.5 46.8" stroke="#15171C" strokeWidth={1.9} strokeLinecap="round" />
                                <Path d="M70 46.8 L77.5 45.2" stroke="#15171C" strokeWidth={1.9} strokeLinecap="round" />
                                <Ellipse cx={58.5} cy={52.2} rx={3.8} ry={3.2} fill="#FFFFFF" />
                                <Circle cx={59.8} cy={52.8} r={1.75} fill="#15171C" />
                                <Circle cx={60.4} cy={52.1} r={0.55} fill="#FFFFFF" />
                                <AnimatedPath d="M54.3 48.6 L62.7 48.6 L62.7 55.6 C60 56, 57 56, 54.3 55.6 Z" fill="#EEB58E" animatedProps={leftEyelidAnimatedProps} />
                                <Ellipse cx={73.5} cy={52.2} rx={3.4} ry={3.1} fill="#FFFFFF" />
                                <Circle cx={74.6} cy={52.8} r={1.65} fill="#15171C" />
                                <Circle cx={75.1} cy={52.1} r={0.5} fill="#FFFFFF" />
                                <AnimatedPath d="M69.7 48.6 L77.3 48.6 L77.3 55.6 C75 56, 72 56, 69.7 55.6 Z" fill="#EEB58E" animatedProps={rightEyelidAnimatedProps} />
                            </G>
                            <Path d="M66.8 50.5 L69.5 58.8 L65.5 60.2" fill="none" stroke="#D4946C" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            <AnimatedG animatedProps={sweatAAnimatedProps}>
                                <Path d="M49 41 C49 41, 51.8 44.6, 51.8 46.5 A2.8 2.8 0 1 1 46.2 46.5 C46.2 44.6, 49 41, 49 41 Z" fill="#93C5FD" stroke="#3B82F6" strokeWidth={0.6} />
                                <Circle cx={48.2} cy={46.3} r={0.7} fill="#EFF6FF" />
                            </AnimatedG>
            <AnimatedG animatedProps={sweatBAnimatedProps}>
                                <Path d="M76 36 C76 36, 78.2 38.8, 78.2 40.4 A2.2 2.2 0 1 1 73.8 40.4 C73.8 38.8, 76 36, 76 36 Z" fill="#93C5FD" stroke="#3B82F6" strokeWidth={0.5} />
                            </AnimatedG>
                        </AnimatedG>
                        <AnimatedPolygon points="78,108 104,104 76,60 54,70" fill="url(#beamGrad)" animatedProps={screenGlowAnimatedProps} />
            <AnimatedG animatedProps={rightArmAnimatedProps}>
                            <Path d="M84 99 C94 114, 98 126, 98 134" stroke="#1E2235" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
                            <Path d="M93 130 L103 135" stroke="#15171C" strokeWidth={3.2} strokeLinecap="round" />
                        </AnimatedG>
            <AnimatedG animatedProps={leftArmAnimatedProps}>
                            <Path d="M42 100 C33 118, 37 136, 54 139 L72 136" stroke="#252A40" strokeWidth={13.5} strokeLinecap="round" strokeLinejoin="round" />
                            <Path d="M40 128 L46 133" stroke="#15171C" strokeWidth={1.2} strokeLinecap="round" opacity={0.65} />
                            <Path d="M70 130 L72 141" stroke="#15171C" strokeWidth={3.2} strokeLinecap="round" />
                        </AnimatedG>
            <G>
            <AnimatedG animatedProps={leftThumbAnimatedProps}>
                                <Path d="M75 129 C74 123, 76 118, 80 116 C82.5 115, 84.5 117, 83.5 121 L81 129 Z" fill="#EEB58E" stroke="#D4946C" strokeWidth={0.7} />
                            </AnimatedG>
            <AnimatedG animatedProps={rightThumbAnimatedProps}>
                                <Path d="M104 128 C105 122, 104 117, 100.5 116 C98 115.5, 96.5 117.5, 97.5 121 L99.5 128 Z" fill="#EEB58E" stroke="#D4946C" strokeWidth={0.7} />
                            </AnimatedG>
                        </G>
            <G>
            <G transform="rotate(18 93 122)">
                                <Rect x={75} y={101} width={34} height={52} rx={8} fill="#000000" opacity={0.035} />
                                <Rect x={78} y={102} width={29} height={48} rx={7} fill="#000000" opacity={0.06} />
                                <Rect x={80.5} y={104} width={24} height={44} rx={6} fill="#000000" opacity={0.12} />
                                <Rect x={79.5} y={100} width={23.5} height={44} rx={5.5} fill="#E1E4EA" />
                                <Rect x={81} y={100} width={23.5} height={44} rx={5.5} fill="#000000" />
                                <Rect x={82.5} y={101.2} width={21} height={41.6} rx={4.6} fill="url(#phoneBackGrad)" stroke="#333A56" strokeWidth={0.6} />
                                <Rect x={79.5} y={110} width={1.2} height={5} rx={0.6} fill="#697284" />
                                <Rect x={79.5} y={117} width={1.2} height={5} rx={0.6} fill="#697284" />
                                <Rect x={92.5} y={103.5} width={9} height={12.5} rx={2.4} fill="#0D0F14" stroke="#333A56" strokeWidth={0.6} />
                                <Circle cx={95.4} cy={107} r={2} fill="#000000" stroke="#697284" strokeWidth={0.6} />
                                <Circle cx={95.9} cy={106.5} r={0.6} fill="#D5D9E1" opacity={0.8} />
                                <Circle cx={95.4} cy={112.5} r={2} fill="#000000" stroke="#697284" strokeWidth={0.6} />
                                <Circle cx={95.9} cy={112} r={0.6} fill="#D5D9E1" opacity={0.8} />
                                <Circle cx={99.3} cy={109.7} r={1.1} fill="#FAFBFC" opacity={0.85} />
                                <Circle cx={99.3} cy={113} r={0.7} fill="#697284" />
                                <Circle cx={93} cy={124} r={3.4} fill="none" stroke="#697284" strokeWidth={0.6} opacity={0.45} />
                            </G>
                        </G>
            <AnimatedG animatedProps={leftHandAnimatedProps}>
                            <Path d="M71 131 C74 128, 78 124, 81 124 C83 124, 84 127, 83 131 L81 139 C78 140, 74 140, 71 139 Z" fill="#F9C9A7" />
                            <Path d="M73 136 Q78 138 82 135" stroke="#E5A982" strokeWidth={1} strokeLinecap="round" opacity={0.7} />
                            <Rect x={78} y={123.5} width={9.8} height={3.5} rx={1.75} transform="rotate(6 83 125)" fill="#F9C9A7" stroke="#D4946C" strokeWidth={0.6} />
                            <Rect x={78.5} y={127} width={10.4} height={3.6} rx={1.8} transform="rotate(6 83.5 128.8)" fill="#F9C9A7" stroke="#D4946C" strokeWidth={0.6} />
                            <Rect x={78.5} y={130.6} width={9.8} height={3.5} rx={1.75} transform="rotate(6 83 132.3)" fill="#F9C9A7" stroke="#D4946C" strokeWidth={0.6} />
                            <Rect x={78} y={134.1} width={8.5} height={3.3} rx={1.65} transform="rotate(6 82 135.7)" fill="#F9C9A7" stroke="#D4946C" strokeWidth={0.6} />
            <G transform="rotate(11 73 135)">
                                <Rect x={71.3} y={130.5} width={3.4} height={9.2} rx={1} fill="#000000" />
                                <Circle cx={73} cy={135} r={3.1} fill="#FFFFFF" stroke="#15171C" strokeWidth={1.1} />
                            </G>
                        </AnimatedG>
            <AnimatedG animatedProps={rightHandAnimatedProps}>
                            <Path d="M95 131 C98 128, 102 123, 105 123 C107.5 123, 109 127, 108 133 C107 137, 102 138, 96 136 Z" fill="#F9C9A7" />
                            <Path d="M104 126 Q106.5 131 104 135" stroke="#E5A982" strokeWidth={1} strokeLinecap="round" opacity={0.7} />
                            <Rect x={97.5} y={121.5} width={9.5} height={3.4} rx={1.7} transform="rotate(-10 102 123)" fill="#F9C9A7" stroke="#D4946C" strokeWidth={0.6} />
                            <Rect x={97} y={125} width={10.2} height={3.5} rx={1.75} transform="rotate(-10 102 126.7)" fill="#F9C9A7" stroke="#D4946C" strokeWidth={0.6} />
                            <Rect x={97.5} y={128.5} width={9.6} height={3.4} rx={1.7} transform="rotate(-10 102 130.2)" fill="#F9C9A7" stroke="#D4946C" strokeWidth={0.6} />
                            <Rect x={98} y={132} width={8.4} height={3.2} rx={1.6} transform="rotate(-10 102 133.6)" fill="#F9C9A7" stroke="#D4946C" strokeWidth={0.6} />
                        </AnimatedG>
                    </AnimatedG>
                </G>
            <AnimatedG animatedProps={arrowFloatAnimatedProps}>
                    <AnimatedPath d="M 127 114 C 127 84, 144 74, 165 76" stroke="#000000" strokeWidth={2.2} strokeLinecap="round" fill="none" animatedProps={arrowLineAnimatedProps} strokeDasharray={90} />
                    <AnimatedPath d="M 160 71 L 167 76 L 160 81" stroke="#000000" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" animatedProps={arrowHeadAnimatedProps} />
                </AnimatedG>
            <G>
                    <Rect x={179} y={46} width={150} height={186} rx={14} fill="#FFFFFF" stroke="#E1E4EA" strokeWidth={1.2} />
                    <Rect x={179} y={46} width={150} height={22} rx={14} fill="#FAFBFC" />
                    <Rect x={179} y={58} width={150} height={10} fill="#FAFBFC" />
                    <Line x1={179} y1={68} x2={329} y2={68} stroke="#E1E4EA" strokeWidth={0.8} />
            <SvgText x={189} y={60.5} fill="#252A40" fontSize={8} fontWeight={700} fontFamily="Inter, sans-serif">
                        Manual To-Do List
                    </SvgText>
                    <Circle cx={316} cy={57} r={2.8} fill="#A12E2E" opacity={0.85} />
            <G>
                        <Rect x={185} y={73} width={138} height={22} rx={5.5} fill="#FAFBFC" stroke="#E1E4EA" strokeWidth={0.9} />
                        <Rect x={189.5} y={79} width={9.5} height={9.5} rx={2.6} fill="#000000" />
                        <Path d="M192 83.8 L193.7 85.5 L196.7 82" stroke="#FFFFFF" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
            <SvgText x={203.5} y={86.2} fill="#697284" fontSize={6.6} fontWeight={500} fontFamily="Inter, sans-serif">
                            Call client on pending invoice
                        </SvgText>
                    </G>
            <G>
                        <Rect x={185} y={99} width={138} height={22} rx={5.5} fill="#FFFFFF" stroke="#E1E4EA" strokeWidth={0.9} />
                        <Rect x={189.5} y={105} width={9.5} height={9.5} rx={2.6} fill="#FAFBFC" stroke="#D5D9E1" strokeWidth={1.1} />
            <SvgText x={203.5} y={112.2} fill="#252A40" fontSize={6.6} fontWeight={500} fontFamily="Inter, sans-serif">
                            Send weekly report before Friday
                        </SvgText>
                    </G>
            <G>
                        <Rect x={185} y={125} width={138} height={22} rx={5.5} fill="#FFFFFF" stroke="#E1E4EA" strokeWidth={0.9} />
                        <Rect x={189.5} y={131} width={9.5} height={9.5} rx={2.6} fill="#FAFBFC" stroke="#D5D9E1" strokeWidth={1.1} />
            <SvgText x={203.5} y={138.2} fill="#252A40" fontSize={6.6} fontWeight={500} fontFamily="Inter, sans-serif">
                            Prepare slides for morning sync
                        </SvgText>
                    </G>
            <G>
                        <Rect x={185} y={152} width={138} height={36} rx={6.5} fill="#FFFFFF" stroke="#000000" strokeWidth={1.4} />
                        <Rect x={189.5} y={160} width={9.5} height={9.5} rx={2.6} fill="#FAFBFC" stroke="#000000" strokeWidth={1.1} />
                    </G>
            <G>
                        <Rect x={185} y={193} width={138} height={31} rx={6} fill="#E1E4EA" />
                        <Rect x={188} y={214} width={21} height={6.8} rx={1.6} fill="#D5D9E1" />
                        <Rect x={292} y={214} width={28} height={6.8} rx={1.6} fill="#000000" />
                    </G>
                </G>
        </Svg>
    );
});

interface TypingOverlayProps {
    isActive: boolean;
    line1: string;
    line2: string;
    cursorX: number;
    cursorY: number;
    pressedKeys: Record<string, number>;
}

const TypingOverlay = React.memo(({
    isActive,
    line1,
    line2,
    cursorX,
    cursorY,
    pressedKeys,
}: TypingOverlayProps) => {
    const cursorClock = useSharedValue(0);

    useEffect(() => {
        cancelAnimation(cursorClock);
        cursorClock.value = 0;
        if (!isActive) {
            return;
        }

        cursorClock.value = withRepeat(
            withTiming(750, { duration: 750, easing: Easing.linear }),
            -1,
        );

        return () => cancelAnimation(cursorClock);
    }, [isActive, cursorClock]);

    const cursorOpacity = useDerivedValue(() => (cursorClock.value < 375 ? 1 : 0));
    const cursorAnimatedProps = useAnimatedProps(() => ({
        opacity: cursorOpacity.value,
    }));

    return (
        <Svg
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.typingOverlay]}
            viewBox="0 0 335 294"
        >
            <SvgText
                x={203.5}
                y={166}
                fill="#252A40"
                fontSize={7}
                fontWeight={500}
                fontFamily="Inter, sans-serif"
            >
                {line1}
            </SvgText>
            <SvgText
                x={203.5}
                y={177}
                fill="#252A40"
                fontSize={7}
                fontWeight={500}
                fontFamily="Inter, sans-serif"
            >
                {line2}
            </SvgText>
            <AnimatedRect
                x={cursorX}
                y={cursorY}
                width={1.5}
                height={9}
                rx={0.75}
                fill="#000000"
                animatedProps={cursorAnimatedProps}
            />
            {KEYBOARD_KEYS.map(({ key, x, y, width }) => (
                <Rect
                    key={key}
                    x={x}
                    y={y}
                    width={width}
                    height={key === ' ' ? 6.8 : 7}
                    rx={1.6}
                    fill={pressedKeys[key] ? '#000000' : '#FFFFFF'}
                />
            ))}
        </Svg>
    );
});

interface OnboardingHeroIllustrationProps {
    isActive: boolean;
}

const OnboardingHeroIllustration = ({ isActive }: OnboardingHeroIllustrationProps) => {
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [characterCount, setCharacterCount] = useState(0);
    const [pressedKeys, setPressedKeys] = useState<Record<string, number>>({});
    const [line1Width, setLine1Width] = useState(0);
    const [line2Width, setLine2Width] = useState(0);
    const nextFlashId = useRef(0);

    useEffect(() => {
        if (!isActive) {
            setCharacterCount(0);
            setPressedKeys({});
            return;
        }

        const timers = new Set<ReturnType<typeof setTimeout>>();
        const schedule = (callback: () => void, delay: number) => {
            const timer = setTimeout(() => {
                timers.delete(timer);
                callback();
            }, delay);
            timers.add(timer);
        };
        const flashKey = (key: string) => {
            const flashId = ++nextFlashId.current;
            setPressedKeys(current => ({ ...current, [key]: flashId }));
            schedule(() => {
                setPressedKeys(current => {
                    if (current[key] !== flashId) {
                        return current;
                    }
                    const next = { ...current };
                    delete next[key];
                    return next;
                });
            }, KEY_FLASH_MS);
        };
        const startCycle = () => {
            setCharacterCount(0);
            setPressedKeys({});
            TYPE_KEY_TIMES.forEach((time, index) => {
                schedule(() => {
                    setCharacterCount(index + 1);
                    flashKey(FULL_TEXT[index].toLowerCase());
                }, time);
            });
            schedule(startCycle, LOOP_MS);
        };

        startCycle();
        return () => {
            timers.forEach(clearTimeout);
        };
    }, [isActive]);

    const line1 = FULL_TEXT.slice(0, Math.min(characterCount, LINE_1.length));
    const line2 = characterCount > LINE_1.length
        ? FULL_TEXT.slice(LINE_1.length + 1, characterCount)
        : '';
    const scale = size.width / 335;
    const activeLineWidth = line2 ? line2Width : line1Width;
    const cursorX = 203.5 + (scale > 0 ? activeLineWidth / scale : 0) + 0.8;
    const cursorY = characterCount > LINE_1.length ? 169.5 : 158.5;

    const onLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setSize(current => (
            current.width === width && current.height === height
                ? current
                : { width, height }
        ));
    };
    const onLine1TextLayout = (event: { nativeEvent: { lines: Array<{ width: number }> } }) => {
        setLine1Width(event.nativeEvent.lines[0]?.width ?? 0);
    };
    const onLine2TextLayout = (event: { nativeEvent: { lines: Array<{ width: number }> } }) => {
        setLine2Width(event.nativeEvent.lines[0]?.width ?? 0);
    };

    return (
        <View onLayout={onLayout} style={styles.container}>
            <View
                pointerEvents="none"
                style={[
                    styles.cardShadow,
                    size.width > 0 && {
                        left: 179 * scale,
                        top: 46 * scale,
                        width: 150 * scale,
                        height: 186 * scale,
                        borderRadius: 14 * scale,
                        shadowOffset: { width: 0, height: 8 * scale },
                        shadowRadius: 8 * scale,
                        elevation: 5 * scale,
                    },
                ]}
            />
            <AnimatedArtwork isActive={isActive} />
            <TypingOverlay
                isActive={isActive}
                line1={line1}
                line2={line2}
                cursorX={cursorX}
                cursorY={cursorY}
                pressedKeys={pressedKeys}
            />
            <View
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={styles.textMeasurement}
            >
                <NativeText
                    onTextLayout={onLine1TextLayout}
                    numberOfLines={1}
                    style={[styles.measurementText, { fontSize: 7 * scale }]}
                >
                    {line1}
                </NativeText>
                <NativeText
                    onTextLayout={onLine2TextLayout}
                    numberOfLines={1}
                    style={[styles.measurementText, { fontSize: 7 * scale }]}
                >
                    {line2}
                </NativeText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        aspectRatio: 335 / 294,
        overflow: 'visible',
    },
    artwork: {
        position: 'relative',
        zIndex: 1,
    },
    typingOverlay: {
        zIndex: 2,
    },
    cardShadow: {
        position: 'absolute',
        zIndex: 0,
        backgroundColor: '#FFFFFF',
        shadowColor: '#15171C',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.09,
        shadowRadius: 8,
        elevation: 5,
    },
    textMeasurement: {
        position: 'absolute',
        left: -1000,
        top: -1000,
        opacity: 0,
        alignItems: 'flex-start',
    },
    measurementText: {
        color: '#252A40',
        fontFamily: 'Inter',
        fontWeight: '500',
        includeFontPadding: false,
        alignSelf: 'flex-start',
    },
});

export default OnboardingHeroIllustration;
