import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import { requestNotificationPermission } from '../../../core/permissions/permissionService';
import { saveOnboardingPermissionResult } from '../../../core/storage/onboardingStorage';
import { getErrorMessage } from '../../../core/utils/errorMessage';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';
import { taskTheme } from '../../../core/theme/taskTheme';
import NotificationPermissionIllustration from '../components/NotificationPermissionIllustration';

interface NotificationPermissionScreenProps {
    onComplete: () => Promise<void>;
}

const NotificationPermissionScreen = ({
    onComplete,
}: NotificationPermissionScreenProps) => {
    const isFocused = useIsFocused();
    const [loading, setLoading] = useState(false);

    const handlePermissionChoice = async (shouldRequestPermission: boolean) => {
        if (loading) {
            return;
        }

        setLoading(true);
        try {
            const granted = shouldRequestPermission
                ? await requestNotificationPermission(true)
                : false;
            await saveOnboardingPermissionResult('notifications', granted);
            await onComplete();
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Could not finish setup',
                text2: getErrorMessage(error),
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEnableNotifications = () => {
        void handlePermissionChoice(true);
    };
    const handleNotNow = () => {
        void handlePermissionChoice(false);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <AppText style={styles.brand}>VOXLIST AI</AppText>
                </View>
                <View style={styles.main}>
                    <View style={styles.illustration}>
                        <NotificationPermissionIllustration isActive={isFocused} />
                    </View>
                    <View style={styles.copy}>
                        <View style={styles.copyIntro}>
                            <AppText style={styles.title}>Stay on top of your tasks</AppText>
                            <AppText style={styles.description}>
                                Get a gentle reminder right before something&apos;s due.
                            </AppText>
                        </View>
                        <AppText style={styles.note}>
                            You can change this anytime in Settings.
                        </AppText>
                    </View>
                </View>
                <View style={styles.footer}>
                    <View
                        accessibilityRole="progressbar"
                        accessibilityLabel="Onboarding progress, step 4 of 4"
                        style={styles.progress}
                    >
                        {[1, 2, 3, 4].map(step => (
                            <View
                                key={step}
                                style={[
                                    styles.progressDot,
                                    step === 4 && styles.activeProgressDot,
                                ]}
                            />
                        ))}
                    </View>
                    <AppButton
                        accessibilityRole="button"
                        style={[styles.enableButton, loading && styles.disabledButton]}
                        onPress={handleEnableNotifications}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color={taskTheme.colors.white} />
                            : <AppText style={styles.enableButtonText}>Enable Notifications</AppText>}
                    </AppButton>
                    <Pressable
                        accessibilityRole="button"
                        disabled={loading}
                        onPress={handleNotNow}
                        style={styles.notNowButton}
                    >
                        <AppText style={styles.notNowText}>Not now</AppText>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: taskTheme.colors.background,
    },
    container: {
        flex: 1,
    },
    header: {
        flexShrink: 0,
        paddingHorizontal: RW(24),
        paddingTop: RH(14),
    },
    brand: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(15),
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    main: {
        flex: 1,
        justifyContent: 'center',
        gap: RH(30),
        paddingHorizontal: RW(28),
    },
    illustration: {
        width: RW(270),
        height: RH(250),
        alignSelf: 'center',
    },
    copy: {
        alignItems: 'center',
        gap: RH(6),
    },
    copyIntro: {
        alignItems: 'center',
        gap: RH(12),
    },
    title: {
        color: taskTheme.colors.text,
        fontSize: RF(27),
        lineHeight: RF(34),
        fontWeight: '800',
        letterSpacing: -0.2,
        textAlign: 'center',
    },
    description: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(16),
        lineHeight: RF(24),
        textAlign: 'center',
        paddingHorizontal: RW(10),
    },
    note: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(13),
        lineHeight: RF(18),
        textAlign: 'center',
        marginTop: RH(6),
    },
    footer: {
        flexShrink: 0,
        alignItems: 'center',
        gap: RH(16),
        paddingHorizontal: RW(28),
        paddingBottom: RH(30),
    },
    progress: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RW(7),
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
    enableButton: {
        width: '100%',
        height: RH(56),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(16),
        backgroundColor: taskTheme.colors.primary,
    },
    disabledButton: {
        opacity: 0.6,
    },
    enableButtonText: {
        color: taskTheme.colors.white,
        fontSize: RF(17),
        fontWeight: '600',
    },
    notNowButton: {
        minHeight: RH(28),
        alignItems: 'center',
        justifyContent: 'center',
    },
    notNowText: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(14.5),
        fontWeight: '500',
    },
});

export default NotificationPermissionScreen;
