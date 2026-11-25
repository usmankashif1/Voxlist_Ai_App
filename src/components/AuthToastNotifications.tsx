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
import { isNetworkError } from '../core/network/internetAccess';

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

interface AuthToastFeedback {
    title: string;
    message: string;
}

const getFriendlyAuthFeedback = (message: string): AuthToastFeedback => {
    const normalizedMessage = message.toLowerCase();

    if (isNetworkError(message)) {
        return {
            title: 'No internet connection',
            message: 'Check your connection and try again.',
        };
    }
    if (
        normalizedMessage.includes('invalid login credentials')
        || normalizedMessage.includes('invalid credentials')
    ) {
        return {
            title: 'Invalid email or password',
            message: 'Check your email and password, then try again.',
        };
    }
    if (normalizedMessage.includes('error sending recovery email')) {
        return {
            title: "Couldn't send reset code",
            message: 'Please try again in a few minutes.',
        };
    }
    if (
        normalizedMessage.includes('invalid otp')
        || normalizedMessage.includes('invalid token')
        || normalizedMessage.includes('otp_expired')
        || normalizedMessage.includes('token has expired')
    ) {
        return {
            title: 'Reset code expired or invalid',
            message: 'Check the latest code in your email or request a new one.',
        };
    }
    if (
        normalizedMessage.includes('invalid email')
        || normalizedMessage.includes('enter your email address')
        || (
            normalizedMessage.includes('email address')
            && normalizedMessage.includes('invalid')
        )
    ) {
        return {
            title: 'Check your email address',
            message: 'Enter a valid email address and try again.',
        };
    }
    if (
        normalizedMessage.includes('could not start password recovery')
        || normalizedMessage.includes('could not verify the reset code')
    ) {
        return {
            title: 'Could not verify reset code',
            message: 'Request a new reset code and try again.',
        };
    }
    if (normalizedMessage.includes('email not confirmed')) {
        return {
            title: 'Confirm your email',
            message: 'Check your inbox for the confirmation link, then try again.',
        };
    }
    if (
        normalizedMessage.includes('weak password')
        || normalizedMessage.includes('password should be at least')
        || normalizedMessage.includes('password must be at least')
    ) {
        return {
            title: 'Choose a stronger password',
            message: 'Use a password with at least 8 characters.',
        };
    }
    if (
        normalizedMessage.includes('user already registered')
        || normalizedMessage.includes('already been registered')
        || normalizedMessage.includes('already exists')
    ) {
        return {
            title: 'Account already exists',
            message: 'This email is already registered. Log in instead.',
        };
    }
    if (
        normalizedMessage.includes('anonymous sign-ins are disabled')
        || normalizedMessage.includes('anonymous sign in is disabled')
    ) {
        return {
            title: 'Guest sign-in is unavailable',
            message: 'Please create an account or try again later.',
        };
    }
    if (
        /rate.?limit|too many requests|too many attempts|over_email_send/.test(normalizedMessage)
    ) {
        return {
            title: 'Too many attempts',
            message: 'Wait a few minutes before trying again.',
        };
    }
    return {
        title: 'Something went wrong',
        message: 'Please try again. If the problem continues, contact support.',
    };
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
            ? {
                type: 'error' as const,
                ...getFriendlyAuthFeedback(error),
            }
            : initializationError
                ? {
                    type: 'error' as const,
                    title: isNetworkError(initializationError)
                        ? 'No internet connection'
                        : "Couldn't check your account",
                    message: isNetworkError(initializationError)
                        ? 'Check your connection and try again.'
                        : 'Please try again in a moment.',
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
