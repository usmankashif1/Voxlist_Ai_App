import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import { taskTheme } from '../../../core/theme/taskTheme';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';

interface BatteryOptimizationPromptProps {
    visible: boolean;
    onDismiss: () => void;
    onAllow: () => Promise<void>;
}

const BatteryOptimizationPrompt = ({
    visible,
    onDismiss,
    onAllow,
}: BatteryOptimizationPromptProps) => {
    const [allowing, setAllowing] = useState(false);
    const [error, setError] = useState('');

    const handleAllow = async () => {
        if (allowing) return;
        setAllowing(true);
        setError('');
        try {
            await onAllow();
            onDismiss();
        } catch (allowError) {
            console.error('Could not open battery optimization settings.', allowError);
            setError('Could not open settings. Try again or change battery use in system settings.');
        } finally {
            setAllowing(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onDismiss}
        >
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <View style={styles.iconCircle}>
                        <Ionicons
                            name="battery-charging-outline"
                            size={RS(30)}
                            color={taskTheme.colors.primary}
                        />
                    </View>
                    <AppText style={styles.title}>Keep reminders reliable</AppText>
                    <AppText style={styles.message}>
                        To help reminders arrive on time, allow Voxlist AI to run in the background.
                    </AppText>
                    {error ? <AppText style={styles.error}>{error}</AppText> : null}
                    <AppButton
                        style={[styles.allowButton, allowing && styles.disabledButton]}
                        onPress={() => void handleAllow()}
                        disabled={allowing}
                    >
                        {allowing
                            ? <ActivityIndicator color={taskTheme.colors.white} />
                            : <AppText style={styles.allowText}>Allow</AppText>}
                    </AppButton>
                    <AppButton
                        style={styles.dismissButton}
                        onPress={onDismiss}
                        disabled={allowing}
                    >
                        <AppText style={styles.dismissText}>Not now</AppText>
                    </AppButton>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: RW(taskTheme.spacing.xl),
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
    },
    card: {
        width: '100%',
        maxWidth: RS(420),
        alignItems: 'center',
        padding: RW(taskTheme.spacing.xl),
        borderRadius: RS(taskTheme.radius.lg),
        backgroundColor: taskTheme.colors.surface,
    },
    iconCircle: {
        width: RS(56),
        height: RS(56),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(28),
        backgroundColor: taskTheme.colors.surfaceMuted,
        marginBottom: RH(taskTheme.spacing.md),
    },
    title: {
        color: taskTheme.colors.text,
        fontSize: RF(18),
        fontWeight: '800',
        textAlign: 'center',
    },
    message: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(14),
        lineHeight: RF(21),
        textAlign: 'center',
        marginTop: RH(taskTheme.spacing.sm),
    },
    error: {
        color: taskTheme.colors.danger,
        fontSize: RF(13),
        lineHeight: RF(19),
        textAlign: 'center',
        marginTop: RH(taskTheme.spacing.sm),
    },
    allowButton: {
        minHeight: RH(48),
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(taskTheme.radius.md),
        backgroundColor: taskTheme.colors.primary,
        marginTop: RH(taskTheme.spacing.xl),
    },
    disabledButton: {
        opacity: 0.6,
    },
    allowText: {
        color: taskTheme.colors.white,
        fontSize: RF(15),
        fontWeight: '700',
    },
    dismissButton: {
        minHeight: RH(44),
        justifyContent: 'center',
        paddingHorizontal: RW(taskTheme.spacing.lg),
        marginTop: RH(taskTheme.spacing.xs),
    },
    dismissText: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(14),
        fontWeight: '600',
    },
});

export default BatteryOptimizationPrompt;
