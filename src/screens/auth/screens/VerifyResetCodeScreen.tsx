import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    View,
} from 'react-native';
import { OtpInput, type OtpInputRef } from 'react-native-otp-entry';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';
import { taskTheme } from '../../../core/theme/taskTheme';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import { clearAuthMessages, selectAuth } from '../../../store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { requestPasswordReset, verifyResetCode } from '../../../store/authThunks';
import AuthScreenLayout from '../components/AuthScreenLayout';
import type { HomeStackParamList } from '../../home/navigation/HomeNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'VerifyResetCode'>;

const RESEND_COOLDOWN_SECONDS = 30;

const VerifyResetCodeScreen = ({ navigation, route }: Props) => {
    const { email } = route.params;
    const dispatch = useAppDispatch();
    const { isSubmitting } = useAppSelector(selectAuth);
    const otpInput = useRef<OtpInputRef>(null);
    const verificationInProgress = useRef(false);
    const [secondsRemaining, setSecondsRemaining] = useState(RESEND_COOLDOWN_SECONDS);

    useEffect(() => {
        if (secondsRemaining === 0) return undefined;

        const timer = setTimeout(() => {
            setSecondsRemaining(current => Math.max(0, current - 1));
        }, 1000);
        return () => clearTimeout(timer);
    }, [secondsRemaining]);

    const handleCodeFilled = async (code: string) => {
        if (verificationInProgress.current || isSubmitting) return;

        verificationInProgress.current = true;
        dispatch(clearAuthMessages());
        const result = await dispatch(verifyResetCode({ email, code }));
        verificationInProgress.current = false;

        if (verifyResetCode.fulfilled.match(result)) {
            navigation.navigate('ResetPassword');
        } else {
            otpInput.current?.clear();
        }
    };

    const handleResend = async () => {
        if (secondsRemaining > 0 || isSubmitting) return;

        dispatch(clearAuthMessages());
        const result = await dispatch(requestPasswordReset(email));
        if (requestPasswordReset.fulfilled.match(result)) {
            otpInput.current?.clear();
            setSecondsRemaining(RESEND_COOLDOWN_SECONDS);
        }
    };

    return (
        <AuthScreenLayout
            title="Check your email"
            subtitle={`Enter the 6-digit reset code sent to ${email}.`}
            onBack={() => navigation.goBack()}
        >
            <View style={styles.form}>
                <OtpInput
                    ref={otpInput}
                    numberOfDigits={6}
                    type="numeric"
                    autoFocus
                    onFilled={code => void handleCodeFilled(code)}
                    disabled={isSubmitting}
                    theme={{
                        containerStyle: styles.otpContainer,
                        pinCodeContainerStyle: styles.pinCodeContainer,
                        focusedPinCodeContainerStyle: styles.focusedPinCodeContainer,
                        filledPinCodeContainerStyle: styles.filledPinCodeContainer,
                        pinCodeTextStyle: styles.pinCodeText,
                    }}
                />

                {isSubmitting ? (
                    <ActivityIndicator
                        color={taskTheme.colors.primary}
                        accessibilityLabel="Verifying reset code"
                    />
                ) : null}
                <AppButton
                    style={styles.resendButton}
                    onPress={() => void handleResend()}
                    disabled={secondsRemaining > 0 || isSubmitting}
                    accessibilityRole="button"
                >
                    <AppText
                        style={[
                            styles.resendText,
                            (secondsRemaining > 0 || isSubmitting) && styles.resendTextDisabled,
                        ]}
                    >
                        {secondsRemaining > 0
                            ? `Resend code in ${secondsRemaining}s`
                            : 'Resend code'}
                    </AppText>
                </AppButton>
            </View>
        </AuthScreenLayout>
    );
};

const styles = StyleSheet.create({
    form: {
        gap: RH(taskTheme.spacing.lg),
    },
    otpContainer: {
        gap: RW(taskTheme.spacing.sm),
        justifyContent: 'center',
    },
    pinCodeContainer: {
        width: RW(42),
        height: RH(52),
        borderColor: taskTheme.colors.border,
        borderWidth: 1,
        borderRadius: RS(taskTheme.radius.md),
        backgroundColor: taskTheme.colors.surface,
    },
    focusedPinCodeContainer: {
        borderColor: taskTheme.colors.primary,
    },
    filledPinCodeContainer: {
        borderColor: taskTheme.colors.borderStrong,
        backgroundColor: taskTheme.colors.surfaceMuted,
    },
    pinCodeText: {
        color: taskTheme.colors.text,
        fontSize: RF(20),
        fontWeight: '700',
    },
    resendButton: {
        minHeight: RH(48),
        alignItems: 'center',
        justifyContent: 'center',
    },
    resendText: {
        color: taskTheme.colors.primary,
        fontSize: RF(14),
        fontWeight: '600',
    },
    resendTextDisabled: {
        color: taskTheme.colors.textSecondary,
    },
});

export default VerifyResetCodeScreen;
