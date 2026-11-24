import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import { taskTheme } from '../../../core/theme/taskTheme';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';

interface OnboardingLayoutProps {
    step: 1 | 2 | 3;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    title: string;
    description: string;
    buttonLabel: string;
    loading?: boolean;
    message?: string;
    onContinue: () => void;
}

const OnboardingLayout = ({
    step,
    icon,
    title,
    description,
    buttonLabel,
    loading = false,
    message,
    onContinue,
}: OnboardingLayoutProps) => (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
            <AppText style={styles.brand}>VOXLIST AI</AppText>
            <View style={styles.content}>
                <View style={styles.iconCircle}>
                    <Ionicons name={icon} size={RS(54)} color={taskTheme.colors.primary} />
                </View>
                <AppText style={styles.title}>{title}</AppText>
                <AppText style={styles.description}>{description}</AppText>
                {message ? <AppText style={styles.message}>{message}</AppText> : null}
            </View>
            <View style={styles.footer}>
                <View style={styles.progress}>
                    {[1, 2, 3].map(value => (
                        <View
                            key={value}
                            style={[styles.progressDot, value === step && styles.activeProgressDot]}
                        />
                    ))}
                </View>
                <AppButton
                    style={[styles.button, loading && styles.disabledButton]}
                    onPress={onContinue}
                    disabled={loading}
                    accessibilityRole="button"
                >
                    {loading
                        ? <ActivityIndicator color={taskTheme.colors.white} />
                        : <AppText style={styles.buttonText}>{buttonLabel}</AppText>}
                </AppButton>
            </View>
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
    brand: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(12),
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: RW(taskTheme.spacing.sm),
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
    button: {
        minHeight: RH(54),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(taskTheme.radius.md),
        backgroundColor: taskTheme.colors.primary,
    },
    disabledButton: {
        opacity: 0.6,
    },
    buttonText: {
        color: taskTheme.colors.white,
        fontSize: RF(16),
        fontWeight: '700',
    },
});

export default OnboardingLayout;
