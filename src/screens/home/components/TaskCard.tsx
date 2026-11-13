import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import { taskTheme } from '../../../core/theme/taskTheme';
import { formatTime12Hour, formatUpcomingDate } from '../../../core/utils/dateTime';
import { RF, RS } from '../../../core/utils/responsive';
import type { Task } from '../home.types';
import DeleteTaskConfirmationModal from './DeleteTaskConfirmationModal';

interface TaskCardProps {
    task: Task;
    dateLabel: string;
    onPress: (task: Task) => void;
    onComplete: (task: Task) => void;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
}

const TaskCard = ({
    task,
    dateLabel,
    onPress,
    onComplete,
    onEdit,
    onDelete,
}: TaskCardProps) => {
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const displayDateLabel = dateLabel === 'Upcoming' && task.dueDate
        ? formatUpcomingDate(task.dueDate)
        : dateLabel;

    return (
        <View style={styles.card}>
            <AppButton
                style={[styles.checkbox, task.isCompleted && styles.checkboxCompleted]}
                hitSlop={10}
                onPress={() => onComplete(task)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: task.isCompleted }}
                accessibilityLabel={task.isCompleted ? 'Mark task active' : 'Complete task'}
            >
                {task.isCompleted ? (
                    <FontAwesome5
                        name="check"
                        size={RS(12)}
                        color={taskTheme.colors.white}
                    />
                ) : null}
            </AppButton>
            <View style={styles.details}>
                <AppButton
                    style={styles.summary}
                    onPress={() => onPress(task)}
                    accessibilityRole="button"
                    accessibilityLabel={`View task: ${task.title}`}
                >
                    <AppText style={[styles.title, task.isCompleted && styles.completedTitle]}>
                        {task.title}
                    </AppText>
                    {task.subtasks.length ? (
                        <AppText style={styles.subtasksSummary}>
                            Subtasks ({task.completedSubtasks.filter(Boolean).length}/{task.subtasks.length})
                        </AppText>
                    ) : null}
                    <View style={styles.metadata}>
                        <AppText style={styles.dateLabel}>
                            {displayDateLabel}{task.dueTime ? ` · ${formatTime12Hour(task.dueTime)}` : ''}
                        </AppText>
                    </View>
                </AppButton>
                {/*
                <View style={styles.actions}>
                    <AppButton onPress={() => onEdit(task)} accessibilityRole="button">
                        <AppText style={styles.action}>Edit / reschedule</AppText>
                    </AppButton>
                    <AppButton
                        onPress={() => setIsConfirmingDelete(true)}
                        accessibilityRole="button"
                    >
                        <AppText style={styles.deleteAction}>Delete</AppText>
                    </AppButton>
                </View>
                */}
            </View>

            <DeleteTaskConfirmationModal
                visible={isConfirmingDelete}
                taskTitle={task.title}
                onCancel={() => setIsConfirmingDelete(false)}
                onConfirm={() => {
                    setIsConfirmingDelete(false);
                    onDelete(task);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: taskTheme.colors.surface,
        borderColor: taskTheme.colors.border,
        borderWidth: 1,
        borderRadius: RS(taskTheme.radius.md),
        padding: RS(taskTheme.spacing.lg),
        marginBottom: RS(taskTheme.spacing.sm),
    },
    checkbox: {
        width: RS(24),
        height: RS(24),
        borderColor: taskTheme.colors.borderStrong,
        borderWidth: 1.5,
        borderRadius: RS(7),
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: RS(taskTheme.spacing.md),
        marginTop: RS(1),
    },
    checkboxCompleted: {
        borderColor: taskTheme.colors.primary,
        backgroundColor: taskTheme.colors.primary,
    },
    details: {
        flex: 1,
    },
    summary: {
        alignItems: 'stretch',
    },
    title: {
        color: taskTheme.colors.text,
        fontSize: RF(16),
        fontWeight: '700',
        lineHeight: RF(22),
    },
    completedTitle: {
        color: taskTheme.colors.textSecondary,
        textDecorationLine: 'line-through',
    },
    subtasksSummary: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(13),
        lineHeight: RF(18),
        marginTop: RS(taskTheme.spacing.sm),
    },
    metadata: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: RS(taskTheme.spacing.sm),
        marginTop: RS(taskTheme.spacing.sm),
    },
    dateLabel: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(12),
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: RS(taskTheme.spacing.lg),
        marginTop: RS(taskTheme.spacing.md),
    },
    action: {
        color: taskTheme.colors.primary,
        fontSize: RF(13),
        fontWeight: '600',
    },
    deleteAction: {
        color: taskTheme.colors.danger,
        fontSize: RF(13),
        fontWeight: '600',
    },
});

export default TaskCard;
