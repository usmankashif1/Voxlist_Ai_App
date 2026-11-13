import React from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, View } from 'react-native';
import { RF, RH, RW } from '../../../core/utils/responsive';
import { taskTheme } from '../../../core/theme/taskTheme';
import AppText from '../../../components/AppText';

interface AuthScreenLayoutProps extends React.PropsWithChildren {
    title: string;
    subtitle: string;
}

const AuthScreenLayout = ({ title, subtitle, children }: AuthScreenLayoutProps) => (
    <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.content}>
                <View style={styles.heading}>
                    <AppText style={styles.brand}>VoxList Ai</AppText>
                    <AppText style={styles.title}>{title}</AppText>
                    <AppText style={styles.subtitle}>{subtitle}</AppText>
                </View>
                {children}
            </View>
        </KeyboardAvoidingView>
    </SafeAreaView>
);

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: taskTheme.colors.background,
    },
    flex: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: RW(taskTheme.spacing.xl),
        paddingVertical: RH(taskTheme.spacing.xxl),
    },
    heading: {
        marginBottom: RH(taskTheme.spacing.xxl),
    },
    brand: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(14),
        fontWeight: '700',
        marginBottom: RH(taskTheme.spacing.lg),
    },
    title: {
        color: taskTheme.colors.text,
        fontSize: RF(30),
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    subtitle: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(15),
        lineHeight: RF(22),
        marginTop: RH(taskTheme.spacing.sm),
    },
});

export default AuthScreenLayout;
