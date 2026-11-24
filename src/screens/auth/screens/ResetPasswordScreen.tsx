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
import { updatePassword } from '../../../store/authThunks';
import AuthScreenLayout from '../components/AuthScreenLayout';
import type { HomeStackParamList } from '../../home/navigation/HomeNavigator';

const ResetPasswordScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
    const dispatch = useAppDispatch();
    const { isSubmitting } = useAppSelector(selectAuth);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [validationError, setValidationError] = useState('');

    const handleSubmit = async () => {
        if (isSubmitting) return;
        if (password.length < 8) {
            setValidationError('Password must be at least 8 characters long.');
            return;
        }
        if (password !== confirmPassword) {
            setValidationError('Passwords do not match.');
            return;
        }

        Keyboard.dismiss();
        setValidationError('');
        dispatch(clearAuthMessages());
        const result = await dispatch(updatePassword(password));
        if (updatePassword.fulfilled.match(result)) {
            navigation.popTo('Login');
        }
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        setValidationError('');
        dispatch(clearAuthMessages());
    };

    const handleConfirmPasswordChange = (value: string) => {
        setConfirmPassword(value);
        setValidationError('');
        dispatch(clearAuthMessages());
    };

    return (
        <AuthScreenLayout
            title="Create a new password"
            subtitle="Choose a password with at least 8 characters."
            onBack={() => navigation.goBack()}
        >
            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={handlePasswordChange}
                    placeholder="New password"
                    placeholderTextColor={taskTheme.colors.textSecondary}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="new-password"
                    textContentType="newPassword"
                    editable={!isSubmitting}
                    accessibilityLabel="New password"
                    returnKeyType="next"
                />
                <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={handleConfirmPasswordChange}
                    placeholder="Confirm new password"
                    placeholderTextColor={taskTheme.colors.textSecondary}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="new-password"
                    textContentType="newPassword"
                    editable={!isSubmitting}
                    accessibilityLabel="Confirm new password"
                    returnKeyType="go"
                    onSubmitEditing={() => void handleSubmit()}
                />

                {validationError ? <AppText style={styles.error}>{validationError}</AppText> : null}

                <AppButton
                    style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
                    onPress={() => void handleSubmit()}
                    disabled={
                        isSubmitting
                        || password.length < 8
                        || confirmPassword.length < 8
                    }
                    accessibilityRole="button"
                >
                    {isSubmitting
                        ? <ActivityIndicator color={taskTheme.colors.white} />
                        : <AppText style={styles.primaryButtonText}>Update password</AppText>}
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
        marginTop: RH(taskTheme.spacing.sm),
    },
    disabledButton: {
        opacity: 0.6,
    },
    primaryButtonText: {
        color: taskTheme.colors.white,
        fontSize: RF(15),
        fontWeight: '700',
    },
    error: {
        color: taskTheme.colors.danger,
        fontSize: RF(13),
        lineHeight: RF(19),
    },
});

export default ResetPasswordScreen;
