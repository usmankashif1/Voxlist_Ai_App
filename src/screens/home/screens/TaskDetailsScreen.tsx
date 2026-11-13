import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import BackButton from '../../../components/BackButton';
import { taskTheme } from '../../../core/theme/taskTheme';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';
import DeleteTaskConfirmationModal from '../components/DeleteTaskConfirmationModal';
import TaskEditorModal from '../components/TaskEditorModal';
import useTasks from '../hooks/useTasks';
import type { ExtractedTask } from '../home.types';
import type { HomeStackParamList } from '../navigation/HomeNavigator';

type Props = NativeStackScreenProps<HomeStackParamList, 'TaskDetails'>;

const TaskDetailsScreen = ({ navigation, route }: Props) => {
    const { taskId } = route.params;
    const {
        items,
        loading,
        error,
        updateTask,
        toggleTaskCompletion,
        toggleSubtaskCompletion,
        deleteTask,
    } =
        useTasks();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [actionError, setActionError] = useState('');
    const task = items.find(item => item.id === taskId);
    const [visibleCompletedSubtasks, setVisibleCompletedSubtasks] = useState<boolean[]>([]);

    useEffect(() => {
        setVisibleCompletedSubtasks(task?.completedSubtasks ?? []);
    }, [task?.id, task?.completedSubtasks]);

    const handleToggleSubtask = (subtaskIndex: number) => {
        if (!task) return;
        setVisibleCompletedSubtasks(current => task.subtasks.map((_, index) => (
            index === subtaskIndex
                ? !(current[index] ?? false)
                : current[index] ?? false
        )));
        void toggleSubtaskCompletion(task, subtaskIndex);
    };

    const handleSave = async (changes: ExtractedTask): Promise<boolean> => {
        if (!task) return false;
        setSaving(true);
        setActionError('');
        try {
            const saved = await updateTask({ ...task, ...changes });
            if (saved) setEditing(false);
            else setActionError('Could not save your changes. Please try again.');
            return saved;
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = () => {
        if (!task) return;
        setIsConfirmingDelete(true);
    };

    const handleConfirmDelete = async () => {
        if (!task) return;
        setIsConfirmingDelete(false);
        const deleted = await deleteTask(task);
        if (deleted) navigation.goBack();
        else setActionError('Could not delete the task. Please try again.');
    };

    if (!task) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <View style={styles.container}>
                    <BackButton onPress={() => navigation.goBack()} label="Back" />
                    <AppText style={styles.emptyTitle}>
                        {loading ? 'Loading task…' : 'Task not found'}
                    </AppText>
                    {!loading ? (
                        <AppText style={styles.emptyCopy}>
                            This task may have been deleted.
                        </AppText>
                    ) : null}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                <BackButton onPress={() => navigation.goBack()} label="Back to tasks" />

                <View style={styles.titleSection}>
                    <AppText style={styles.eyebrow}>TASK DETAILS</AppText>
                    <AppText style={[styles.title, task.isCompleted && styles.completedTitle]}>
                        {task.title}
                    </AppText>
                </View>

                {task.subtasks.length ? (
                    <View style={styles.infoCard}>
                        <AppText style={styles.sectionTitle}>
                            Subtasks ({visibleCompletedSubtasks.filter(Boolean).length}/{task.subtasks.length})
                        </AppText>
                        <View style={styles.subtasks}>
                            {task.subtasks.map((subtask, index) => (
                                <View key={`${index}-${subtask}`} style={styles.subtaskRow}>
                                    <AppButton
                                        style={[
                                            styles.subtaskCheckbox,
                                            visibleCompletedSubtasks[index] && styles.subtaskCheckboxChecked,
                                        ]}
                                        hitSlop={8}
                                        onPress={() => handleToggleSubtask(index)}
                                        accessibilityRole="checkbox"
                                        accessibilityState={{
                                            checked: visibleCompletedSubtasks[index] ?? false,
                                        }}
                                        accessibilityLabel={
                                            visibleCompletedSubtasks[index]
                                                ? `Mark ${subtask} as active`
                                                : `Complete ${subtask}`
                                        }
                                    >
                                        {visibleCompletedSubtasks[index] ? (
                                            <FontAwesome5
                                                name="check"
                                                size={RS(11)}
                                                color={taskTheme.colors.white}
                                            />
                                        ) : null}
                                    </AppButton>
                                    <AppText
                                        style={[
                                            styles.subtaskText,
                                            visibleCompletedSubtasks[index] && styles.completedSubtaskText,
                                        ]}
                                    >
                                        {subtask}
                                    </AppText>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : (
                    <View style={styles.infoCard}>
                        <AppText style={styles.sectionTitle}>Subtasks</AppText>
                        <AppText style={styles.secondaryText}>No subtasks added.</AppText>
                    </View>
                )}

                {error || actionError ? (
                    <AppText style={styles.error}>{actionError || error}</AppText>
                ) : null}

                <View style={styles.actions}>
                    <AppButton
                        style={styles.primaryButton}
                        onPress={() => void toggleTaskCompletion(task)}
                        accessibilityRole="button"
                    >
                        <AppText style={styles.primaryButtonText}>
                            {task.isCompleted ? 'Mark as active' : 'Mark as complete'}
                        </AppText>
                    </AppButton>
                    <AppButton
                        style={styles.secondaryButton}
                        onPress={() => setEditing(true)}
                        accessibilityRole="button"
                    >
                        <AppText style={styles.secondaryButtonText}>Edit task</AppText>
                    </AppButton>
                    <AppButton
                        style={styles.deleteButton}
                        onPress={confirmDelete}
                        accessibilityRole="button"
                    >
                        <AppText style={styles.deleteButtonText}>Delete task</AppText>
                    </AppButton>
                </View>
            </ScrollView>

            <TaskEditorModal
                key={`${task.id}-${editing ? 'edit' : 'closed'}`}
                task={task}
                visible={editing}
                saving={saving}
                modalTitle="Edit task"
                onCancel={() => {
                    setEditing(false);
                    setActionError('');
                }}
                onSave={handleSave}
            />
            <DeleteTaskConfirmationModal
                visible={isConfirmingDelete}
                taskTitle={task.title}
                onCancel={() => setIsConfirmingDelete(false)}
                onConfirm={() => void handleConfirmDelete()}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: taskTheme.colors.background,
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: RW(taskTheme.spacing.xl),
        paddingTop: RH(taskTheme.spacing.md),
        paddingBottom: RH(40),
        gap: RH(taskTheme.spacing.md),
    },
    emptyTitle: {
        color: taskTheme.colors.text,
        fontSize: RF(22),
        fontWeight: '800',
        marginTop: RH(taskTheme.spacing.xl),
    },
    emptyCopy: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(15),
    },
    titleSection: {
        gap: RH(taskTheme.spacing.sm),
        paddingVertical: RH(taskTheme.spacing.md),
    },
    eyebrow: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(11),
        fontWeight: '800',
        letterSpacing: 1,
    },
    title: {
        color: taskTheme.colors.text,
        fontSize: RF(27),
        fontWeight: '800',
        lineHeight: RF(34),
    },
    completedTitle: {
        color: taskTheme.colors.textSecondary,
        textDecorationLine: 'line-through',
    },
    infoCard: {
        borderRadius: RS(taskTheme.radius.md),
        borderWidth: 1,
        borderColor: taskTheme.colors.border,
        backgroundColor: taskTheme.colors.surface,
        padding: RS(taskTheme.spacing.lg),
        gap: RH(taskTheme.spacing.lg),
    },
    sectionTitle: {
        color: taskTheme.colors.text,
        fontSize: RF(16),
        fontWeight: '800',
    },
    subtasks: {
        gap: RH(taskTheme.spacing.lg),
    },
    subtaskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RW(taskTheme.spacing.md),
    },
    subtaskCheckbox: {
        width: RS(20),
        height: RS(20),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(5),
        borderWidth: 1.5,
        borderColor: taskTheme.colors.borderStrong,
        backgroundColor: taskTheme.colors.surface,
    },
    subtaskCheckboxChecked: {
        borderColor: taskTheme.colors.primary,
        backgroundColor: taskTheme.colors.primary,
    },
    subtaskText: {
        flex: 1,
        color: taskTheme.colors.text,
        fontSize: RF(14),
        lineHeight: RF(20),
    },
    completedSubtaskText: {
        color: taskTheme.colors.textSecondary,
        textDecorationLine: 'line-through',
    },
    secondaryText: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(14),
        lineHeight: RF(20),
    },
    error: {
        color: taskTheme.colors.danger,
        fontSize: RF(13),
        lineHeight: RF(19),
    },
    actions: {
        gap: RH(taskTheme.spacing.sm),
        marginTop: RH(taskTheme.spacing.sm),
    },
    primaryButton: {
        minHeight: RH(50),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(taskTheme.radius.sm),
        backgroundColor: taskTheme.colors.primary,
    },
    primaryButtonText: {
        color: taskTheme.colors.white,
        fontSize: RF(15),
        fontWeight: '700',
    },
    secondaryButton: {
        minHeight: RH(50),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(taskTheme.radius.sm),
        borderWidth: 1,
        borderColor: taskTheme.colors.borderStrong,
        backgroundColor: taskTheme.colors.surface,
    },
    secondaryButtonText: {
        color: taskTheme.colors.text,
        fontSize: RF(15),
        fontWeight: '700',
    },
    deleteButton: {
        minHeight: RH(50),
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButtonText: {
        color: taskTheme.colors.danger,
        fontSize: RF(14),
        fontWeight: '700',
    },
});

export default TaskDetailsScreen;
