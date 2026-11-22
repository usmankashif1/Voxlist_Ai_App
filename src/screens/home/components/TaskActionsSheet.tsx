import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import useSheetTransition from '../../../components/useSheetTransition';
import { taskTheme } from '../../../core/theme/taskTheme';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';
import type { Task } from '../home.types';

interface TaskActionsSheetProps {
    task: Task | null;
    onClose: () => void;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
}

const ACTION_SHEET_CLOSE_DURATION = 220;

const TaskActionsSheet = ({
    task,
    onClose,
    onEdit,
    onDelete,
}: TaskActionsSheetProps) => {
    const insets = useSafeAreaInsets();
    const actionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const {
        mounted,
        backdropStyle,
        sheetStyle,
        startOpening,
    } = useSheetTransition(task !== null);

    useEffect(() => () => {
        if (actionTimer.current) clearTimeout(actionTimer.current);
    }, []);

    const handleAction = (action: 'edit' | 'delete') => {
        if (!task) return;
        const selectedTask = task;

        onClose();
        if (actionTimer.current) clearTimeout(actionTimer.current);
        actionTimer.current = setTimeout(() => {
            if (action === 'edit') onEdit(selectedTask);
            else onDelete(selectedTask);
        }, ACTION_SHEET_CLOSE_DURATION);
    };

    return (
        <Modal
            visible={mounted}
            transparent
            animationType="none"
            onShow={startOpening}
            onRequestClose={onClose}
        >
            <View style={styles.backdrop}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close task options"
                />
                <Animated.View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, styles.dimmer, backdropStyle]}
                />
                <Animated.View
                    style={[
                        styles.sheet,
                        sheetStyle,
                        { paddingBottom: RH(taskTheme.spacing.xl) + insets.bottom },
                    ]}
                >
                    <View style={styles.handle} />
                    <AppText style={styles.title}>Task options</AppText>
                    <AppButton
                        style={styles.option}
                        onPress={() => handleAction('edit')}
                        accessibilityRole="button"
                    >
                        <AppText style={styles.optionText}>Edit</AppText>
                    </AppButton>
                    <AppButton
                        style={[styles.option, styles.deleteOption]}
                        onPress={() => handleAction('delete')}
                        accessibilityRole="button"
                    >
                        <AppText style={[styles.optionText, styles.deleteText]}>Delete</AppText>
                    </AppButton>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    dimmer: {
        backgroundColor: 'rgba(24, 28, 38, 0.45)',
    },
    sheet: {
        paddingHorizontal: RW(taskTheme.spacing.xl),
        paddingTop: RH(taskTheme.spacing.md),
        backgroundColor: taskTheme.colors.surface,
        borderTopLeftRadius: RS(taskTheme.radius.lg),
        borderTopRightRadius: RS(taskTheme.radius.lg),
    },
    handle: {
        width: RW(38),
        height: RH(4),
        alignSelf: 'center',
        borderRadius: RS(2),
        backgroundColor: taskTheme.colors.borderStrong,
        marginBottom: RH(taskTheme.spacing.xl),
    },
    title: {
        color: taskTheme.colors.text,
        fontSize: RF(18),
        fontWeight: '700',
    },
    option: {
        minHeight: RH(48),
        justifyContent: 'center',
        borderRadius: RS(taskTheme.radius.md),
        marginTop: RH(taskTheme.spacing.sm),
        paddingHorizontal: RW(taskTheme.spacing.md),
        backgroundColor: taskTheme.colors.surfaceMuted,
    },
    deleteOption: {
        marginTop: RH(taskTheme.spacing.xs),
    },
    optionText: {
        color: taskTheme.colors.text,
        fontSize: RF(15),
        fontWeight: '600',
    },
    deleteText: {
        color: taskTheme.colors.danger,
    },
});

export default TaskActionsSheet;
