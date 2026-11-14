import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';
import { taskTheme } from '../../../core/theme/taskTheme';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import BackButton from '../../../components/BackButton';
import ConfirmationModal from '../../home/components/ConfirmationModal';
import { deleteAccount, signOut } from '../../../store/authThunks';
import { selectAuth } from '../../../store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileScreen = () => {
    const navigation = useNavigation<NavigationProp<ParamListBase>>();
    const dispatch = useAppDispatch();
    const { session, error, isSubmitting } = useAppSelector(selectAuth);
    const isGuest = session?.user.is_anonymous === true;
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const isDeletingAccount = useRef(false);

    const handleSignOut = () => {
        dispatch(signOut());
    };

    const handleDeleteAccount = () => setIsConfirmingDelete(true);

    const confirmDeleteAccount = async () => {
        if (isDeletingAccount.current) return;
        isDeletingAccount.current = true;
        setIsConfirmingDelete(false);
        try {
            const wasDeleted = await dispatch(deleteAccount());
            if (wasDeleted) {
                Alert.alert('Account deleted', 'Your account has been removed successfully.');
            }
        } finally {
            isDeletingAccount.current = false;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <BackButton
                    label="Back"
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                />
                <AppText style={styles.title}>Settings</AppText>
                <View style={styles.card}>
                    <AppText style={styles.sectionTitle}>Account details</AppText>
                    <View style={styles.detailRow}>
                        <AppText style={styles.label}>Account type</AppText>
                        <AppText style={styles.value}>
                            {isGuest ? 'Guest' : session ? 'Account' : 'Not signed in'}
                        </AppText>
                    </View>
                    <View style={styles.detailRow}>
                        <AppText style={styles.label}>Email</AppText>
                        <AppText style={styles.value}>{session?.user.email ?? 'Not added'}</AppText>
                    </View>
                    {isGuest ? (
                        <AppText style={styles.description}>
                            You are using the app as a guest. Create an account to sign in on this device.
                        </AppText>
                    ) : null}
                </View>

                {error ? <AppText style={styles.error}>{error}</AppText> : null}

                {isGuest ? (
                    <>
                        <AppButton
                            style={styles.primaryButton}
                            onPress={() => navigation.navigate('SignUp')}
                            accessibilityRole="button"
                        >
                            <AppText style={styles.primaryButtonText}>Create an account</AppText>
                        </AppButton>
                        <AppButton
                            style={styles.secondaryButton}
                            onPress={() => navigation.navigate('Login')}
                            accessibilityRole="button"
                        >
                            <AppText style={styles.secondaryButtonText}>Log in to an account</AppText>
                        </AppButton>
                    </>
                ) : !session ? (
                    <>
                        <AppButton
                            style={styles.primaryButton}
                            onPress={() => navigation.navigate('Login')}
                            accessibilityRole="button"
                        >
                            <AppText style={styles.primaryButtonText}>Log in</AppText>
                        </AppButton>
                        <AppButton
                            style={styles.secondaryButton}
                            onPress={() => navigation.navigate('SignUp')}
                            accessibilityRole="button"
                        >
                            <AppText style={styles.secondaryButtonText}>Create an account</AppText>
                        </AppButton>
                    </>
                ) : (
                    <>
                        <AppButton
                            style={styles.primaryButton}
                            onPress={handleSignOut}
                            disabled={isSubmitting}
                            accessibilityRole="button"
                        >
                            {isSubmitting
                                ? <ActivityIndicator color={taskTheme.colors.white} />
                                : <AppText style={styles.primaryButtonText}>Log out</AppText>}
                        </AppButton>

                        <AppButton
                            style={styles.secondaryButton}
                            onPress={() => navigation.navigate('ReportAiContent')}
                            accessibilityRole="button"
                        >
                            <AppText style={styles.secondaryButtonText}>Report AI issue</AppText>
                        </AppButton>

                        <AppButton
                            style={styles.deleteButton}
                            onPress={handleDeleteAccount}
                            disabled={isSubmitting}
                            accessibilityRole="button"
                        >
                            <AppText style={styles.deleteButtonText}>Delete account</AppText>
                        </AppButton>
                    </>
                )}
            </View>
            <ConfirmationModal
                visible={isConfirmingDelete}
                title="Delete your account?"
                message="This permanently removes your account, synced tasks, and access to the app."
                confirmText="Delete"
                confirmVariant="danger"
                onCancel={() => setIsConfirmingDelete(false)}
                onConfirm={() => void confirmDeleteAccount()}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: taskTheme.colors.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: RW(taskTheme.spacing.xl),
        // paddingTop: RH(taskTheme.spacing.xl),
    },
    title: {
        color: taskTheme.colors.text,
        fontSize: RF(27),
        fontWeight: '800',
        marginBottom: RH(taskTheme.spacing.xl),
    },
    backButton: {
        marginBottom: RH(taskTheme.spacing.md),
    },
    card: {
        padding: RW(taskTheme.spacing.lg),
        borderRadius: RS(taskTheme.radius.lg),
        backgroundColor: taskTheme.colors.surface,
        borderColor: taskTheme.colors.border,
        borderWidth: 1,
    },
    sectionTitle: {
        color: taskTheme.colors.text,
        fontSize: RF(17),
        fontWeight: '700',
        marginBottom: RH(taskTheme.spacing.lg),
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: RW(taskTheme.spacing.md),
        paddingVertical: RH(taskTheme.spacing.sm),
    },
    label: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(14),
    },
    value: {
        flexShrink: 1,
        color: taskTheme.colors.text,
        fontSize: RF(14),
        fontWeight: '600',
        textAlign: 'right',
    },
    description: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(13),
        lineHeight: RF(19),
        marginTop: RH(taskTheme.spacing.md),
    },
    primaryButton: {
        minHeight: RH(50),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(taskTheme.radius.md),
        backgroundColor: taskTheme.colors.primary,
        marginTop: RH(taskTheme.spacing.lg),
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
        marginTop: RH(taskTheme.spacing.sm),
    },
    secondaryButtonText: {
        color: taskTheme.colors.text,
        fontSize: RF(14),
        fontWeight: '600',
    },
    deleteButton: {
        minHeight: RH(48),
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: RH(taskTheme.spacing.sm),
        backgroundColor: taskTheme.colors.danger,
        borderRadius: RS(taskTheme.radius.md),
    },
    deleteButtonText: {
        color: taskTheme.colors.white,
        fontSize: RF(14),
        fontWeight: '700',
    },
    error: {
        color: taskTheme.colors.danger,
        fontSize: RF(13),
        lineHeight: RF(19),
        marginTop: RH(taskTheme.spacing.md),
    },
});

export default ProfileScreen;
