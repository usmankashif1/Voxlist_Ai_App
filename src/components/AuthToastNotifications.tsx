import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'react-native';
import Toast, {
    BaseToast,
    ErrorToast,
    InfoToast,
    type ToastConfig,
} from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RF, RH, RS, RW } from '../core/utils/responsive';
import { taskTheme } from '../core/theme/taskTheme';
import { useAppSelector } from '../store/hooks';
import { selectAuth } from '../store/slices/authSlice';

const toastConfig: ToastConfig = {
    success: props => (
        <BaseToast
            {...props}
            style={[styles.toast, styles.successToast]}
            contentContainerStyle={styles.content}
            text1Style={styles.title}
            text1NumberOfLines={1}
            text2Style={styles.message}
            text2NumberOfLines={2}
        />
    ),
    error: props => (
        <ErrorToast
            {...props}
            style={[styles.toast, styles.errorToast]}
            contentContainerStyle={styles.content}
            text1Style={styles.title}
            text1NumberOfLines={1}
            text2Style={styles.message}
            text2NumberOfLines={2}
        />
    ),
    info: props => (
        <InfoToast
            {...props}
            style={[styles.toast, styles.infoToast]}
            contentContainerStyle={styles.content}
            text1Style={styles.title}
            text1NumberOfLines={1}
            text2Style={styles.message}
            text2NumberOfLines={2}
        />
    ),
};

const getFriendlyAuthError = (message: string): string => {
    const normalizedMessage = message.toLowerCase();

    if (normalizedMessage.includes('error sending recovery email')) {
        return "Couldn't send a reset code. Try again shortly.";
    }
    if (
        normalizedMessage.includes('invalid login credentials')
        || normalizedMessage.includes('invalid credentials')
    ) {
        return 'Email or password is incorrect.';
    }
    if (
        normalizedMessage.includes('invalid otp')
        || normalizedMessage.includes('invalid token')
        || normalizedMessage.includes('otp_expired')
        || normalizedMessage.includes('token has expired')
    ) {
        return 'Code is invalid or expired. Request a new one.';
    }
    if (normalizedMessage.includes('invalid email')) {
        return 'Enter a valid email address.';
    }
    if (normalizedMessage.includes('email not confirmed')) {
        return 'Confirm your email before signing in.';
    }
    if (normalizedMessage.includes('weak password')) {
        return 'Choose a stronger password.';
    }
    if (
        normalizedMessage.includes('password should be at least')
        || normalizedMessage.includes('password must be at least')
    ) {
        return 'Password must be at least 8 characters.';
    }
    if (
        normalizedMessage.includes('user already registered')
        || normalizedMessage.includes('already been registered')
    ) {
        return 'This email already has an account. Log in instead.';
    }
    if (normalizedMessage.includes('rate limit') || normalizedMessage.includes('too many requests')) {
        return 'Too many attempts. Wait and try again.';
    }
    if (
        normalizedMessage.includes('network request failed')
        || normalizedMessage.includes('failed to fetch')
    ) {
        return 'Check your internet connection and try again.';
    }

    return 'Please try again.';
};

const getSuccessTitle = (message: string): string => {
    const normalizedMessage = message.toLowerCase();

    if (
        normalizedMessage.includes('reset code')
        || normalizedMessage.includes('6-digit code')
        || normalizedMessage.includes('confirm your account')
        || normalizedMessage.includes('check your email')
    ) {
        return 'Check your email';
    }
    if (normalizedMessage.includes('verified') || normalizedMessage.includes('set a new password')) {
        return 'Code verified';
    }
    if (
        normalizedMessage.includes('password updated')
        || normalizedMessage.includes('log in with your new password')
    ) {
        return 'Password updated';
    }

    return 'Success';
};

export const AuthToastListener = () => {
    const { error, initializationError, notice } = useAppSelector(selectAuth);
    const lastToastKey = useRef<string | null>(null);

    useEffect(() => {
        const feedback = error
            ? { type: 'error' as const, title: "Couldn't complete that request", message: getFriendlyAuthError(error) }
            : initializationError
                ? {
                    type: 'error' as const,
                    title: "Couldn't check your account",
                    message: getFriendlyAuthError(initializationError),
                }
                : notice
                    ? { type: 'success' as const, title: getSuccessTitle(notice), message: notice }
                    : null;

        if (!feedback) {
            lastToastKey.current = null;
            return;
        }

        const toastKey = `${feedback.type}:${feedback.title}:${feedback.message}`;
        if (lastToastKey.current === toastKey) return;
        lastToastKey.current = toastKey;

        Toast.show({
            type: feedback.type,
            text1: feedback.title,
            text2: feedback.message,
            position: 'top',
            visibilityTime: 4500,
        });
    }, [error, initializationError, notice]);

    return null;
};

export const AppToast = () => {
    const insets = useSafeAreaInsets();
    const topOffset = Math.max(insets.top, StatusBar.currentHeight ?? 0)
        + RH(taskTheme.spacing.lg);

    return <Toast config={toastConfig} topOffset={topOffset} />;
};

const styles = {
    toast: {
        width: '92%' as const,
        height: RH(72),
        borderRadius: RS(taskTheme.radius.md),
        borderWidth: 1,
        backgroundColor: taskTheme.colors.surface,
    },
    successToast: {
        borderLeftColor: taskTheme.colors.success,
        borderColor: taskTheme.colors.border,
    },
    errorToast: {
        borderLeftColor: taskTheme.colors.danger,
        borderColor: taskTheme.colors.border,
    },
    infoToast: {
        borderLeftColor: taskTheme.colors.primary,
        borderColor: taskTheme.colors.border,
    },
    content: {
        paddingHorizontal: RW(taskTheme.spacing.sm),
    },
    title: {
        color: taskTheme.colors.text,
        fontSize: RF(14),
        fontWeight: '700' as const,
    },
    message: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(12),
        lineHeight: RF(17),
    },
};
