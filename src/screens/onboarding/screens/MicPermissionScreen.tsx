import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import { getErrorMessage } from '../../../core/utils/errorMessage';
import { requestMicrophonePermission } from '../../../core/permissions/permissionService';
import { saveOnboardingPermissionResult } from '../../../core/storage/onboardingStorage';
import { taskTheme } from '../../../core/theme/taskTheme';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';
import MicrophonePermissionIllustration from '../components/MicrophonePermissionIllustration';
import type { OnboardingStackParamList } from '../navigation/OnboardingNavigator';

const MicPermissionScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
    const isFocused = useIsFocused();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handlePermissionChoice = async (shouldRequestPermission: boolean) => {
        if (loading) {
            return;
        }

        setLoading(true);
        setErrorMessage(null);
        let shouldContinue = false;

        try {
            const granted = shouldRequestPermission
                ? await requestMicrophonePermission()
                : false;
            await saveOnboardingPermissionResult('microphone', granted);
            shouldContinue = true;
        } catch (error) {
            console.error('Could not update microphone permission during onboarding.', error);
            setErrorMessage(
                `Could not update microphone access. ${getErrorMessage(error)}`,
            );
        } finally {
            setLoading(false);
        }

        if (shouldContinue) {
            navigation.navigate('NotificationPermission');
        }
    };

    const handleAllow = () => {
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
                        <MicrophonePermissionIllustration isActive={isFocused} />
                    </View>
                    <View style={styles.copy}>
                        <View style={styles.copyIntro}>
                            <AppText style={styles.title}>Allow microphone access</AppText>
                            <AppText style={styles.description}>
                                We only listen when you tap to record — never in the background.
                            </AppText>
                        </View>
                        <AppText style={styles.note}>
                            You can change this anytime in Settings.
                        </AppText>
                        {errorMessage ? (
                            <AppText accessibilityRole="alert" style={styles.error}>
                                {errorMessage}
                            </AppText>
                        ) : null}
                    </View>
                </View>
                <View style={styles.footer}>
                    <View
                        accessibilityRole="progressbar"
                        accessibilityLabel="Onboarding progress, step 3 of 4"
                        style={styles.progress}
                    >
                        {[1, 2, 3, 4].map(step => (
                            <View
                                key={step}
                                style={[
                                    styles.progressDot,
                                    step === 3 && styles.activeProgressDot,
                                ]}
                            />
                        ))}
                    </View>
                    <AppButton
                        accessibilityRole="button"
                        style={[styles.allowButton, loading && styles.disabledButton]}
                        onPress={handleAllow}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color={taskTheme.colors.white} />
                            : <AppText style={styles.allowButtonText}>Allow Microphone</AppText>}
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
    error: {
        color: taskTheme.colors.danger,
        fontSize: RF(13),
        lineHeight: RF(19),
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
    allowButton: {
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
    allowButtonText: {
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

export default MicPermissionScreen;
