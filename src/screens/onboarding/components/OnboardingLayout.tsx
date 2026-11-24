import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import { taskTheme } from '../../../core/theme/taskTheme';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';

interface OnboardingLayoutProps {
    step: 1 | 2 | 3 | 4 | 5;
    progressSteps?: number;
    icon?: React.ComponentProps<typeof Ionicons>['name'];
    title: string;
    description: string;
    buttonLabel: string;
    loading?: boolean;
    message?: string;
    note?: string;
    hero?: React.ReactNode;
    onReplay?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
    heroAnimationStyle?: AnimatedStyle<ViewStyle>;
    titleAnimationStyle?: AnimatedStyle<ViewStyle>;
    descriptionAnimationStyle?: AnimatedStyle<ViewStyle>;
    footerAnimationStyle?: AnimatedStyle<ViewStyle>;
    titleTextStyle?: StyleProp<TextStyle>;
    descriptionTextStyle?: StyleProp<TextStyle>;
    onContinue: () => void;
}

const OnboardingLayout = ({
    step,
    progressSteps = 5,
    icon,
    title,
    description,
    buttonLabel,
    loading = false,
    message,
    note,
    hero,
    onReplay,
    secondaryActionLabel,
    onSecondaryAction,
    heroAnimationStyle,
    titleAnimationStyle,
    descriptionAnimationStyle,
    footerAnimationStyle,
    titleTextStyle,
    descriptionTextStyle,
    onContinue,
}: OnboardingLayoutProps) => (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
            <View style={styles.topBar}>
                <AppText style={styles.brand}>VOXLIST AI</AppText>
                {onReplay ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Replay animation"
                        hitSlop={10}
                        onPress={onReplay}
                        style={styles.replayButton}
                    >
                        <Ionicons
                            name="refresh"
                            size={RS(16)}
                            color={taskTheme.colors.textSecondary}
                        />
                    </Pressable>
                ) : null}
            </View>
            <View style={[styles.content, hero ? styles.heroContent : undefined]}>
                {hero ? (
                    <>
                        <View style={styles.heroStage}>
                            <Animated.View style={[styles.hero, heroAnimationStyle]}>
                                {hero}
                            </Animated.View>
                        </View>
                        <View style={styles.copyBlock}>
                            <Animated.View style={titleAnimationStyle}>
                                <AppText style={[styles.title, titleTextStyle]}>{title}</AppText>
                            </Animated.View>
                            <Animated.View style={descriptionAnimationStyle}>
                                <AppText style={[styles.description, descriptionTextStyle]}>
                                    {description}
                                </AppText>
                            </Animated.View>
                            {note ? <AppText style={styles.note}>{note}</AppText> : null}
                            {message ? <AppText style={styles.message}>{message}</AppText> : null}
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.iconCircle}>
                            {icon ? (
                                <Ionicons name={icon} size={RS(54)} color={taskTheme.colors.primary} />
                            ) : null}
                        </View>
                        <AppText style={[styles.title, titleTextStyle]}>{title}</AppText>
                        <AppText style={[styles.description, descriptionTextStyle]}>
                            {description}
                        </AppText>
                        {note ? <AppText style={styles.note}>{note}</AppText> : null}
                        {message ? <AppText style={styles.message}>{message}</AppText> : null}
                    </>
                )}
            </View>
            <Animated.View style={[styles.footer, footerAnimationStyle]}>
                <View style={styles.progress}>
                    {Array.from({ length: progressSteps }, (_, index) => index + 1).map(value => (
                        <View
                            key={value}
                            style={[
                                styles.progressDot,
                                value === step && (step <= 3
                                    ? styles.activeProgressDot
                                    : styles.permissionActiveProgressDot),
                            ]}
                        />
                    ))}
                </View>
                <AppButton
                    style={[
                        styles.button,
                        step > 3 && styles.permissionButton,
                        loading && styles.disabledButton,
                        step <= 3 && styles.onboardingButtonShadow,
                    ]}
                    onPress={onContinue}
                    disabled={loading}
                    accessibilityRole="button"
                >
                    {loading
                        ? <ActivityIndicator color={taskTheme.colors.white} />
                        : <AppText style={styles.buttonText}>{buttonLabel}</AppText>}
                </AppButton>
                {secondaryActionLabel && onSecondaryAction ? (
                    <Pressable
                        accessibilityRole="button"
                        disabled={loading}
                        onPress={onSecondaryAction}
                        style={styles.secondaryAction}
                    >
                        <AppText style={styles.secondaryActionText}>
                            {secondaryActionLabel}
                        </AppText>
                    </Pressable>
                ) : null}
            </Animated.View>
        </View>
    </SafeAreaView>
);

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: taskTheme.colors.background,
    },
    container: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: RW(taskTheme.spacing.xl),
        paddingTop: RH(taskTheme.spacing.lg),
        paddingBottom: RH(taskTheme.spacing.lg),
    },
    topBar: {
        minHeight: RH(24),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    brand: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(12),
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    replayButton: {
        width: RS(30),
        height: RS(30),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(15),
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: RW(taskTheme.spacing.sm),
    },
    heroContent: {
        flex: 1,
        minHeight: 0,
        justifyContent: 'space-between',
        paddingHorizontal: 0,
    },
    heroStage: {
        flex: 1,
        width: '100%',
        minHeight: 0,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: RH(4),
    },
    hero: {
        width: '100%',
        aspectRatio: 335 / 294,
        maxWidth: RW(335),
        maxHeight: '100%',
        alignSelf: 'center',
    },
    copyBlock: {
        width: '100%',
        paddingHorizontal: RW(4),
        paddingBottom: RH(16),
    },
    iconCircle: {
        width: RS(132),
        height: RS(132),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(66),
        backgroundColor: taskTheme.colors.surface,
        borderWidth: 1,
        borderColor: taskTheme.colors.border,
        marginBottom: RH(taskTheme.spacing.xxl),
    },
    title: {
        color: taskTheme.colors.text,
        fontSize: RF(28),
        lineHeight: RF(34),
        fontWeight: '800',
        textAlign: 'center',
    },
    description: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(16),
        lineHeight: RF(24),
        textAlign: 'center',
        marginTop: RH(taskTheme.spacing.md),
    },
    note: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(13),
        lineHeight: RF(18),
        textAlign: 'center',
        marginTop: RH(6),
    },
    message: {
        color: taskTheme.colors.warning,
        fontSize: RF(13),
        lineHeight: RF(19),
        textAlign: 'center',
        marginTop: RH(taskTheme.spacing.md),
    },
    footer: {
        gap: RH(taskTheme.spacing.lg),
    },
    progress: {
        flexDirection: 'row',
        alignSelf: 'center',
        gap: RW(taskTheme.spacing.sm),
    },
    progressDot: {
        width: RS(7),
        height: RS(7),
        borderRadius: RS(4),
        backgroundColor: taskTheme.colors.borderStrong,
    },
    activeProgressDot: {
        width: RS(22),
        backgroundColor: taskTheme.colors.primary,
    },
    permissionActiveProgressDot: {
        width: RS(22),
        backgroundColor: taskTheme.colors.primary,
    },
    button: {
        minHeight: RH(54),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(taskTheme.radius.md),
        backgroundColor: taskTheme.colors.primary,
    },
    permissionButton: {
        backgroundColor: taskTheme.colors.primary,
    },
    onboardingButtonShadow: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 11,
        elevation: 5,
    },
    disabledButton: {
        opacity: 0.6,
    },
    buttonText: {
        color: taskTheme.colors.white,
        fontSize: RF(16),
        fontWeight: '700',
    },
    secondaryAction: {
        minHeight: RH(36),
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryActionText: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(14.5),
        fontWeight: '600',
    },
});

export default OnboardingLayout;
