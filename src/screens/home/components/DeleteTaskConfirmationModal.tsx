import React from 'react';
import { Animated, Modal, StyleSheet, View } from 'react-native';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import useSheetTransition from '../../../components/useSheetTransition';
import { taskTheme } from '../../../core/theme/taskTheme';
import { RF, RS } from '../../../core/utils/responsive';

interface DeleteTaskConfirmationModalProps {
    visible: boolean;
    taskTitle: string;
    onCancel: () => void;
    onConfirm: () => void;
}

const DeleteTaskConfirmationModal = ({
    visible,
    taskTitle,
    onCancel,
    onConfirm,
}: DeleteTaskConfirmationModalProps) => {
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
            onRequestClose={onCancel}
        >
            <View style={styles.backdrop}>
                <Animated.View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, styles.dimmer, backdropStyle]}
                />
                <Animated.View style={[styles.card, sheetStyle]}>
                    <AppText style={styles.title}>Delete this task?</AppText>
                    <AppText style={styles.message}>{taskTitle}</AppText>
                    <View style={styles.actions}>
                        <AppButton style={styles.cancelButton} onPress={onCancel}>
                            <AppText style={styles.cancelText}>Cancel</AppText>
                        </AppButton>
                        <AppButton style={styles.deleteButton} onPress={onConfirm}>
                            <AppText style={styles.deleteText}>Delete</AppText>
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
    deleteButton: {
        minHeight: RS(44),
        justifyContent: 'center',
        borderRadius: RS(taskTheme.radius.sm),
        backgroundColor: taskTheme.colors.danger,
        paddingHorizontal: RS(taskTheme.spacing.lg),
    },
    deleteText: {
        color: taskTheme.colors.white,
        fontSize: RF(14),
        fontWeight: '700',
    },
});

export default DeleteTaskConfirmationModal;
