import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import { taskTheme } from '../../../core/theme/taskTheme';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';

interface ReminderHealthBannerProps {
    onOpen: () => void;
}

const ReminderHealthBanner = ({ onOpen }: ReminderHealthBannerProps) => (
    <AppButton
        style={styles.container}
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
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RW(taskTheme.spacing.md),
        padding: RW(taskTheme.spacing.md),
        marginBottom: RH(taskTheme.spacing.md),
        borderWidth: 1,
        borderColor: taskTheme.colors.border,
        borderRadius: RS(taskTheme.radius.md),
        backgroundColor: taskTheme.colors.surface,
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
});

export default ReminderHealthBanner;
