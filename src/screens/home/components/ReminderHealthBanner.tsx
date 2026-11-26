import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import { taskTheme } from '../../../core/theme/taskTheme';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';

interface ReminderHealthBannerProps {
    onOpen: () => void;
    onDismiss: () => void;
}

const ReminderHealthBanner = ({ onOpen, onDismiss }: ReminderHealthBannerProps) => (
    <View style={styles.container}>
        <AppButton
            style={styles.content}
            onPress={onOpen}
            accessibilityRole="button"
            accessibilityLabel="Task reminders may not arrive. Open settings to fix reminder delivery."
            accessibilityHint="Opens task reminder settings."
        >
            <Ionicons
                name="notifications-outline"
                size={RS(22)}
                color={taskTheme.colors.primary}
            />
            <View style={styles.copy}>
                <AppText style={styles.title}>Task reminders may not arrive</AppText>
                <AppText style={styles.description}>
                    Tap here to check notifications and other settings that can delay reminders.
                </AppText>
                <AppText style={styles.action}>Fix reminder settings</AppText>
            </View>
            <Ionicons
                name="chevron-forward"
                size={RS(18)}
                color={taskTheme.colors.textSecondary}
            />
        </AppButton>
        <AppButton
            style={styles.dismissButton}
            onPress={onDismiss}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Dismiss task reminder notice"
        >
            <Ionicons
                name="close"
                size={RS(18)}
                color={taskTheme.colors.textSecondary}
            />
        </AppButton>
    </View>
);

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        marginBottom: RH(taskTheme.spacing.md),
        borderWidth: 1,
        borderColor: taskTheme.colors.border,
        borderRadius: RS(taskTheme.radius.md),
        backgroundColor: taskTheme.colors.surface,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RW(taskTheme.spacing.md),
        padding: RW(taskTheme.spacing.md),
        paddingRight: RW(taskTheme.spacing.xl),
    },
    copy: {
        flex: 1,
    },
    title: {
        color: taskTheme.colors.text,
        fontSize: RF(14),
        fontWeight: '700',
    },
    description: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(12),
        lineHeight: RF(17),
        marginTop: RH(2),
    },
    action: {
        color: taskTheme.colors.primary,
        fontSize: RF(13),
        fontWeight: '700',
        marginTop: RH(taskTheme.spacing.xs),
    },
    dismissButton: {
        position: 'absolute',
        top: RH(taskTheme.spacing.xs),
        right: RW(taskTheme.spacing.xs),
        width: RS(28),
        height: RS(28),
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
});

export default ReminderHealthBanner;
