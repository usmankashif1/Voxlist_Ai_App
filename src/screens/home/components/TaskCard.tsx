import React from 'react';
import { StyleSheet, View } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import { taskTheme } from '../../../core/theme/taskTheme';
import { formatTime12Hour, formatUpcomingDate } from '../../../core/utils/dateTime';
import { RF, RS } from '../../../core/utils/responsive';
import type { Task } from '../home.types';

interface TaskCardProps {
    task: Task;
    dateLabel: string;
    onPress: (task: Task) => void;
    onLongPress: (task: Task) => void;
    onComplete: (task: Task) => void;
    selectionMode?: boolean;
    selected?: boolean;
    onSelect?: () => void;
}

const TaskCard = ({
    task,
    dateLabel,
    onPress,
    onLongPress,
    onComplete,
    selectionMode = false,
    selected = false,
    onSelect,
}: TaskCardProps) => {
    const displayDateLabel = dateLabel === 'Upcoming' && task.dueDate
        ? formatUpcomingDate(task.dueDate)
        : dateLabel;

    return (
        <View style={[styles.card, selectionMode && selected && styles.selectedCard]}>
            <AppButton
                style={[
                    styles.checkbox,
                    selectionMode ? selected && styles.checkboxCompleted : task.isCompleted && styles.checkboxCompleted,
                ]}
                hitSlop={10}
                onPress={() => {
                    if (selectionMode) onSelect?.();
                    else onComplete(task);
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selectionMode ? selected : task.isCompleted }}
                accessibilityLabel={selectionMode
                    ? `${selected ? 'Deselect' : 'Select'} task to move: ${task.title}`
                    : task.isCompleted ? 'Mark task active' : 'Complete task'}
            >
                {(selectionMode ? selected : task.isCompleted) ? (
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
                    onPress={() => {
                        if (selectionMode) onSelect?.();
                        else onPress(task);
                    }}
                    onLongPress={() => {
                        if (!selectionMode) onLongPress(task);
                    }}
                    delayLongPress={1700}
                    accessibilityRole={selectionMode ? 'checkbox' : 'button'}
                    accessibilityState={selectionMode ? { checked: selected } : undefined}
                    accessibilityLabel={selectionMode
                        ? `${selected ? 'Deselect' : 'Select'} task to move: ${task.title}`
                        : `View task: ${task.title}`}
                    accessibilityHint={
                        selectionMode ? undefined : 'Press and hold for Edit or Delete options.'
                    }
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
            </View>
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
    selectedCard: {
        borderColor: taskTheme.colors.primary,
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
});

export default TaskCard;
