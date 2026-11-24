import React, { useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';
import { taskTheme } from '../../../core/theme/taskTheme';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import { clearAuthMessages, selectAuth } from '../../../store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { requestPasswordReset } from '../../../store/authThunks';
import AuthScreenLayout from '../components/AuthScreenLayout';
import type { HomeStackParamList } from '../../home/navigation/HomeNavigator';

const ForgotPasswordScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
    const dispatch = useAppDispatch();
    const { isSubmitting } = useAppSelector(selectAuth);
    const [email, setEmail] = useState('');

    const handleSubmit = async () => {
        const normalizedEmail = email.trim();
        if (!normalizedEmail || isSubmitting) return;
        Keyboard.dismiss();
        dispatch(clearAuthMessages());
        const result = await dispatch(requestPasswordReset(normalizedEmail));
        if (requestPasswordReset.fulfilled.match(result)) {
            navigation.navigate('VerifyResetCode', { email: normalizedEmail });
        }
    };

    return (
        <AuthScreenLayout
            title="Forgot password?"
            subtitle="Enter the email address linked to your account to reset your password."
            onBack={() => navigation.goBack()}
        >
            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    placeholderTextColor={taskTheme.colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    accessibilityLabel="Email"
                    editable={!isSubmitting}
                    returnKeyType="done"
                    onSubmitEditing={() => void handleSubmit()}
                />

                <AppButton
                    style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
                    onPress={() => void handleSubmit()}
                    disabled={isSubmitting || !email.trim()}
                    accessibilityRole="button"
                >
                    {isSubmitting
                        ? <ActivityIndicator color={taskTheme.colors.white} />
                        : <AppText style={styles.primaryButtonText}>Send reset code</AppText>}
                </AppButton>
                <AppButton
                    style={styles.backToLoginButton}
                    onPress={() => navigation.goBack()}
                    disabled={isSubmitting}
                    accessibilityRole="button"
                >
                    <AppText style={styles.backToLoginText}>Back to log in</AppText>
                </AppButton>
            </View>
        </AuthScreenLayout>
    );
};

const styles = StyleSheet.create({
    form: {
        gap: RH(taskTheme.spacing.md),
    },
    input: {
        minHeight: RH(54),
        borderColor: taskTheme.colors.border,
        borderWidth: 1,
        borderRadius: RS(taskTheme.radius.md),
        backgroundColor: taskTheme.colors.surface,
        color: taskTheme.colors.text,
        fontSize: RF(15),
        paddingHorizontal: RW(taskTheme.spacing.lg),
    },
    primaryButton: {
        minHeight: RH(52),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(taskTheme.radius.md),
        backgroundColor: taskTheme.colors.primary,
    },
    disabledButton: {
        opacity: 0.6,
    },
    primaryButtonText: {
        color: taskTheme.colors.white,
        fontSize: RF(15),
        fontWeight: '700',
    },
    backToLoginButton: {
        minHeight: RH(48),
        alignItems: 'center',
        justifyContent: 'center',
    },
    backToLoginText: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(14),
        fontWeight: '600',
    },
});

export default ForgotPasswordScreen;
