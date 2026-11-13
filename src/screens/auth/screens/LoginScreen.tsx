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
import { continueAsGuest, signIn } from '../../../store/authThunks';
import { clearAuthMessages, selectAuth } from '../../../store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { taskTheme } from '../../../core/theme/taskTheme';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import AuthScreenLayout from '../components/AuthScreenLayout';
import type { HomeStackParamList } from '../../home/navigation/HomeNavigator';

const LoginScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
    const dispatch = useAppDispatch();
    const { session, error, initializationError, isSubmitting } = useAppSelector(selectAuth);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const passwordInput = useRef<React.ElementRef<typeof TextInput>>(null);

    const handleLogin = async () => {
        Keyboard.dismiss();
        dispatch(clearAuthMessages());
        const result = await dispatch(signIn({ email, password }));
        if (result) navigation.popTo('Settings');
    };

    const handleContinueAsGuest = () => {
        Keyboard.dismiss();
        dispatch(clearAuthMessages());
        dispatch(continueAsGuest());
    };

    return (
        <AuthScreenLayout
            title="Welcome back"
            subtitle="Sign in to your account, or continue without one."
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
                    placeholder="Password"
                    placeholderTextColor={taskTheme.colors.textSecondary}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password"
                    textContentType="password"
                    editable={!isSubmitting}
                    accessibilityLabel="Password"
                    onSubmitEditing={handleLogin}
                    returnKeyType="go"
                />

                {error || initializationError ? (
                    <AppText style={styles.error}>{error ?? initializationError}</AppText>
                ) : null}

                <AppButton
                    style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
                    onPress={handleLogin}
                    disabled={isSubmitting || !email.trim() || !password}
                    accessibilityRole="button"
                >
                    {isSubmitting
                        ? <ActivityIndicator color={taskTheme.colors.white} />
                        : <AppText style={styles.primaryButtonText}>Log in</AppText>}
                </AppButton>

                <AppButton
                    style={styles.secondaryButton}
                    onPress={() => navigation.navigate('SignUp')}
                    disabled={isSubmitting}
                    accessibilityRole="button"
                >
                    <AppText style={styles.secondaryButtonText}>Create an account</AppText>
                </AppButton>

                {!session ? (
                    <AppButton
                        style={styles.guestButton}
                        onPress={handleContinueAsGuest}
                        disabled={isSubmitting}
                        accessibilityRole="button"
                    >
                        <AppText style={styles.guestButtonText}>Continue as guest</AppText>
                    </AppButton>
                ) : null}
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
    secondaryButton: {
        minHeight: RH(48),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(taskTheme.radius.md),
        borderColor: taskTheme.colors.borderStrong,
        borderWidth: 1,
        backgroundColor: taskTheme.colors.surface,
    },
    secondaryButtonText: {
        color: taskTheme.colors.text,
        fontSize: RF(15),
        fontWeight: '600',
    },
    guestButton: {
        minHeight: RH(48),
        alignItems: 'center',
        justifyContent: 'center',
    },
    guestButtonText: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(14),
        fontWeight: '600',
    },
    error: {
        color: taskTheme.colors.danger,
        fontSize: RF(13),
        lineHeight: RF(19),
    },
});

export default LoginScreen;
