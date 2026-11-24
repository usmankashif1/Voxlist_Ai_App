import React, { useRef, useState } from 'react';
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
import { signUp } from '../../../store/authThunks';
import { clearAuthMessages, selectAuth } from '../../../store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { taskTheme } from '../../../core/theme/taskTheme';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import AuthScreenLayout from '../components/AuthScreenLayout';
import type { HomeStackParamList } from '../../home/navigation/HomeNavigator';

const SignUpScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
    const dispatch = useAppDispatch();
    const { isSubmitting } = useAppSelector(selectAuth);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const passwordInput = useRef<React.ElementRef<typeof TextInput>>(null);

    const handleSignUp = async () => {
        Keyboard.dismiss();
        dispatch(clearAuthMessages());
        const result = await dispatch(signUp({ email, password }));
        if (result) navigation.popTo('Settings');
    };

    return (
        <AuthScreenLayout
            title="Create your account"
            subtitle="Your tasks stay on this device and sync to your account when you’re online."
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
                    editable={!isSubmitting}
                    accessibilityLabel="Email"
                    onSubmitEditing={() => passwordInput.current?.focus()}
                    returnKeyType="next"
                    blurOnSubmit={false}
                />
                <TextInput
                    ref={passwordInput}
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

                <AppButton
                    style={styles.loginLink}
                    onPress={() => navigation.navigate('Login')}
                    disabled={isSubmitting}
                    accessibilityRole="button"
                >
                    <AppText style={styles.loginLinkText}>Already have an account? Log in</AppText>
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
    loginLink: {
        minHeight: RH(48),
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginLinkText: {
        color: taskTheme.colors.text,
        fontSize: RF(14),
        fontWeight: '600',
    },
});

export default SignUpScreen;
