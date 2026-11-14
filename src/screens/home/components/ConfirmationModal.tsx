import React from 'react';
import { Animated, Modal, StyleSheet, View } from 'react-native';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import useSheetTransition from '../../../components/useSheetTransition';
import { taskTheme } from '../../../core/theme/taskTheme';
import { RF, RS } from '../../../core/utils/responsive';

interface ConfirmationModalProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmVariant?: 'danger' | 'primary';
    onCancel?: () => void;
    onConfirm: () => void;
}

const ConfirmationModal = ({
    visible,
    title,
    message,
    confirmText,
    confirmVariant = 'primary',
    onCancel,
    onConfirm,
}: ConfirmationModalProps) => {
    const {
        mounted,
        backdropStyle,
        sheetStyle,
        startOpening,
    } = useSheetTransition(visible, 20);

    return (
        <Modal
            visible={mounted}
            transparent
            animationType="none"
            onShow={startOpening}
            onRequestClose={onCancel ?? onConfirm}
        >
            <View style={styles.backdrop}>
                <Animated.View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, styles.dimmer, backdropStyle]}
                />
                <Animated.View style={[styles.card, sheetStyle]}>
                    <AppText style={styles.title}>{title}</AppText>
                    <AppText style={styles.message}>{message}</AppText>
                    <View style={styles.actions}>
                        {onCancel ? (
                            <AppButton style={styles.cancelButton} onPress={onCancel}>
                                <AppText style={styles.cancelText}>Cancel</AppText>
                            </AppButton>
                        ) : null}
                        <AppButton
                            style={[
                                styles.confirmButton,
                                confirmVariant === 'danger'
                                    ? styles.dangerButton
                                    : styles.primaryButton,
                            ]}
                            onPress={onConfirm}
                        >
                            <AppText
                                style={[
                                    styles.confirmText,
                                    confirmVariant === 'danger'
                                        ? styles.dangerText
                                        : styles.primaryText,
                                ]}
                            >
                                {confirmText}
                            </AppText>
                        </AppButton>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: RS(taskTheme.spacing.xl),
    },
    dimmer: {
        backgroundColor: 'rgba(24, 28, 38, 0.45)',
    },
    card: {
        width: '100%',
        maxWidth: RS(420),
        backgroundColor: taskTheme.colors.surface,
        borderRadius: RS(taskTheme.radius.lg),
        padding: RS(taskTheme.spacing.xl),
    },
    title: {
        color: taskTheme.colors.text,
        fontSize: RF(18),
        fontWeight: '700',
    },
    message: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(14),
        lineHeight: RF(20),
        marginTop: RS(taskTheme.spacing.sm),
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: RS(taskTheme.spacing.sm),
        marginTop: RS(taskTheme.spacing.xl),
    },
    cancelButton: {
        minHeight: RS(44),
        justifyContent: 'center',
        paddingHorizontal: RS(taskTheme.spacing.md),
    },
    cancelText: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(14),
        fontWeight: '600',
    },
    confirmButton: {
        minHeight: RS(44),
        justifyContent: 'center',
        borderRadius: RS(taskTheme.radius.sm),
        paddingHorizontal: RS(taskTheme.spacing.lg),
    },
    dangerButton: {
        backgroundColor: taskTheme.colors.danger,
    },
    primaryButton: {
        backgroundColor: taskTheme.colors.primary,
    },
    confirmText: {
        fontSize: RF(14),
        fontWeight: '700',
    },
    dangerText: {
        color: taskTheme.colors.white,
    },
    primaryText: {
        color: taskTheme.colors.white,
    },
});

export default ConfirmationModal;
