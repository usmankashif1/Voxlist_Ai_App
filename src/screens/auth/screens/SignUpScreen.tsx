import React, { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';
import { signUp } from '../../../store/authThunks';
import { clearAuthMessages, selectAuth } from '../../../store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { taskTheme } from '../../../core/theme/taskTheme';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import BackButton from '../../../components/BackButton';
import AuthScreenLayout from '../components/AuthScreenLayout';

const SignUpScreen = () => {
    const navigation = useNavigation<NavigationProp<ParamListBase>>();
    const dispatch = useAppDispatch();
    const { session, error, isSubmitting, notice } = useAppSelector(selectAuth);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignUp = async () => {
        dispatch(clearAuthMessages());
        const result = await dispatch(signUp({ email, password }));
        if (result && session?.user.is_anonymous) navigation.navigate('Home');
    };

    return (
        <AuthScreenLayout
            title="Create your account"
            subtitle="Your tasks stay on this device and sync to your account when you’re online."
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
                    editable={!isSubmitting}
                    accessibilityLabel="Email"
                />
                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password (at least 8 characters)"
                    placeholderTextColor={taskTheme.colors.textSecondary}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="new-password"
                    textContentType="newPassword"
                    editable={!isSubmitting}
                    accessibilityLabel="Password"
                    onSubmitEditing={handleSignUp}
                    returnKeyType="go"
                />

                {error ? <AppText style={styles.error}>{error}</AppText> : null}
                {notice ? <AppText style={styles.success}>{notice}</AppText> : null}

                <AppButton
                    style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
                    onPress={handleSignUp}
                    disabled={isSubmitting || !email.trim() || password.length < 8}
                    accessibilityRole="button"
                >
                    {isSubmitting
                        ? <ActivityIndicator color={taskTheme.colors.white} />
                        : <AppText style={styles.primaryButtonText}>Create account</AppText>}
                </AppButton>

                <BackButton
                    onPress={() => navigation.navigate('Login')}
                    disabled={isSubmitting}
                    label="Back to log in"
                />
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
    success: {
        color: taskTheme.colors.success,
        fontSize: RF(13),
        lineHeight: RF(19),
    },
});

export default SignUpScreen;
