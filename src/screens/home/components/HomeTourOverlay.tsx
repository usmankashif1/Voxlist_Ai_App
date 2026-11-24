import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Pressable,
    StyleSheet,
    View,
    type LayoutChangeEvent,
} from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Svg, { Circle, Defs, Mask, Rect } from 'react-native-svg';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import { taskTheme } from '../../../core/theme/taskTheme';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface HomeTourTarget {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface HomeTourOverlayProps {
    step: 1 | 2;
    microphoneTarget: HomeTourTarget;
    createTaskTarget: HomeTourTarget;
    isCompleting: boolean;
    onNext: () => void;
    onDismiss: () => void;
}

const clamp = (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max);

const HomeTourOverlay = ({
    step,
    microphoneTarget,
    createTaskTarget,
    isCompleting,
    onNext,
    onDismiss,
}: HomeTourOverlayProps) => {
    const insets = useSafeAreaInsets();
    const [viewport, setViewport] = useState({ width: 0, height: 0 });
    const [windowOrigin, setWindowOrigin] = useState<{ x: number; y: number } | null>(null);
    const [originStep, setOriginStep] = useState<1 | 2 | null>(null);
    const overlayRef = useRef<React.ElementRef<typeof View>>(null);
    const target = step === 1 ? microphoneTarget : createTaskTarget;

    const measureOverlayOrigin = useCallback((measuredStep: 1 | 2) => {
        overlayRef.current?.measureInWindow((x, y) => {
            setWindowOrigin(current => (
                current?.x === x && current.y === y
                    ? current
                    : { x, y }
            ));
            setOriginStep(measuredStep);
        });
    }, []);

    useEffect(() => {
        setOriginStep(null);
        const frame = requestAnimationFrame(() => measureOverlayOrigin(step));
        return () => cancelAnimationFrame(frame);
    }, [measureOverlayOrigin, step, viewport.width, viewport.height]);

    const handleLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setViewport(current => (
            current.width === width && current.height === height
                ? current
                : { width, height }
        ));
    };

    const localTarget = windowOrigin
        ? {
            ...target,
            x: target.x - windowOrigin.x,
            y: target.y - windowOrigin.y,
        }
        : target;
    const padding = RW(step === 2 ? taskTheme.spacing.md : taskTheme.spacing.sm);
    const spotlightDiameter = Math.min(
        Math.max(localTarget.width, localTarget.height) + padding * 2,
        viewport.width,
        viewport.height,
    );
    const spotlightRadius = spotlightDiameter / 2;
    const spotlightCenterX = clamp(
        localTarget.x + localTarget.width / 2,
        spotlightRadius,
        viewport.width - spotlightRadius,
    );
    const spotlightCenterY = clamp(
        localTarget.y + localTarget.height / 2,
        spotlightRadius,
        viewport.height - spotlightRadius,
    );
    const spotlight = {
        left: spotlightCenterX - spotlightRadius,
        top: spotlightCenterY - spotlightRadius,
        right: spotlightCenterX + spotlightRadius,
        bottom: spotlightCenterY + spotlightRadius,
    };
    const cardWidth = Math.min(RW(340), viewport.width - RW(taskTheme.spacing.xl) * 2);
    const cardLeft = clamp(
        localTarget.x + localTarget.width / 2 - cardWidth / 2,
        RW(taskTheme.spacing.md),
        viewport.width - cardWidth - RW(taskTheme.spacing.md),
    );
    const cardTop = step === 1
        ? clamp(
            spotlight.top - RH(190),
            insets.top + RH(taskTheme.spacing.lg),
            viewport.height - RH(190),
        )
        : clamp(
            spotlight.bottom + RH(taskTheme.spacing.lg),
            insets.top + RH(taskTheme.spacing.lg) + RH(60),
            viewport.height - RH(190),
        );
    return (
        <View
            ref={overlayRef}
            collapsable={false}
            style={styles.overlay}
            onLayout={handleLayout}
        >
            {viewport.width > 0
                && viewport.height > 0
                && windowOrigin
                && originStep === step ? (
                <>
                    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                        <Svg
                            width={viewport.width}
                            height={viewport.height}
                            style={StyleSheet.absoluteFill}
                        >
                            <Defs>
                                <Mask
                                    id="homeTourSpotlightMask"
                                    maskUnits="userSpaceOnUse"
                                    x="0"
                                    y="0"
                                    width={viewport.width}
                                    height={viewport.height}
                                >
                                    <Rect
                                        x="0"
                                        y="0"
                                        width={viewport.width}
                                        height={viewport.height}
                                        fill="white"
                                    />
                                    <Circle
                                        cx={spotlightCenterX}
                                        cy={spotlightCenterY}
                                        r={spotlightRadius}
                                        fill="black"
                                    />
                                </Mask>
                            </Defs>
                            <Rect
                                x="0"
                                y="0"
                                width={viewport.width}
                                height={viewport.height}
                                fill="#000000"
                                opacity={0.75}
                                mask="url(#homeTourSpotlightMask)"
                            />
                            <Circle
                                cx={spotlightCenterX}
                                cy={spotlightCenterY}
                                r={spotlightRadius}
                                fill="transparent"
                                stroke={taskTheme.colors.white}
                                strokeWidth={RS(2)}
                            />
                        </Svg>
                    </View>
                    <Pressable
                        style={StyleSheet.absoluteFill}
                        onPress={() => undefined}
                        accessibilityLabel="Home tour"
                    />
                    <View
                        pointerEvents="box-none"
                        style={[
                            styles.cardPosition,
                            {
                                left: cardLeft,
                                top: cardTop,
                                width: cardWidth,
                            },
                        ]}
                    >
                        <View style={styles.card}>
                            <View style={styles.cardHeading}>
                                <AppText style={styles.stepLabel}>
                                    STEP {step} OF 2
                                </AppText>
                                <FontAwesome5
                                    name={step === 1 ? 'arrow-down' : 'arrow-up'}
                                    size={RS(15)}
                                    color={taskTheme.colors.primary}
                                />
                            </View>
                            <AppText style={styles.title}>
                                {step === 1 ? 'Speak to add tasks' : 'Create a task manually'}
                            </AppText>
                            <AppText style={styles.message}>
                                {step === 1
                                    ? 'Tap the mic to turn speech into tasks.'
                                    : 'Tap + to type a task instead.'}
                            </AppText>
                            <View style={styles.actions}>
                                <AppButton
                                    style={styles.skipButton}
                                    onPress={onDismiss}
                                    disabled={isCompleting}
                                >
                                    <AppText style={styles.skipText}>Skip</AppText>
                                </AppButton>
                                <AppButton
                                    style={styles.nextButton}
                                    onPress={step === 1 ? onNext : onDismiss}
                                    disabled={isCompleting}
                                >
                                    <AppText style={styles.nextText}>
                                        {step === 1 ? 'Next' : 'Done'}
                                    </AppText>
                                </AppButton>
                            </View>
                        </View>
                    </View>
                </>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 1000,
        elevation: 1000,
        backgroundColor: 'transparent',
    },
    cardPosition: {
        position: 'absolute',
    },
    card: {
        borderRadius: RS(taskTheme.radius.lg),
        padding: RW(taskTheme.spacing.lg),
        backgroundColor: taskTheme.colors.surface,
        elevation: 12,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
    },
    cardHeading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    stepLabel: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(11),
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    title: {
        color: taskTheme.colors.text,
        fontSize: RF(17),
        fontWeight: '800',
        marginTop: RH(taskTheme.spacing.sm),
    },
    message: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(14),
        lineHeight: RF(20),
        marginTop: RH(taskTheme.spacing.xs),
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: RW(taskTheme.spacing.sm),
        marginTop: RH(taskTheme.spacing.md),
    },
    skipButton: {
        minHeight: RH(40),
        justifyContent: 'center',
        paddingHorizontal: RW(taskTheme.spacing.md),
    },
    skipText: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(14),
        fontWeight: '600',
    },
    nextButton: {
        minHeight: RH(40),
        minWidth: RW(88),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(taskTheme.radius.sm),
        paddingHorizontal: RW(taskTheme.spacing.md),
        backgroundColor: taskTheme.colors.primary,
    },
    nextText: {
        color: taskTheme.colors.white,
        fontSize: RF(14),
        fontWeight: '700',
    },
});

export default HomeTourOverlay;
