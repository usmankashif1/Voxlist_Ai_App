import {
    getAllScheduledNotificationsAsync,
    getExactAlarmPermissionsAsync,
    getPermissionsAsync,
} from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { selectAuth } from '../../../store/slices/authSlice';
import { useAppSelector } from '../../../store/hooks';
import { cancelTaskReminder, scheduleTaskReminder } from '../../../core/notifications/taskReminderService';
import { ANDROID_CHANNEL_ID } from '../../../core/permissions/permissionService';
import {
    deleteStoredTask,
    getStoredTasks,
    insertTasks,
    updateStoredTask,
    updateStoredTasks,
    updateStoredSubtaskCompletion,
    updateStoredTaskNotificationId,
} from '../../../core/storage/taskStorage';
import {
    subscribeToTaskSync,
    syncTasksForUser,
} from '../../../core/storage/taskSyncService';
import { getLocalDueDate } from '../../../core/utils/dateTime';
import type { ExtractedTask, Task } from '../home.types';

// Expo persists requests separately from AlarmManager, so restore alarms after Android restarts the process.
const restoredAndroidAlarmOwners = new Set<string | null>();
let reminderReconciliationQueue: Promise<void> = Promise.resolve();
let startupSplashHidden = false;

const hideStartupSplash = (): void => {
    if (startupSplashHidden) return;
    startupSplashHidden = true;
    void SplashScreen.hideAsync().catch(error => {
        startupSplashHidden = false;
        console.error('Could not hide the splash screen after local task loading.', error);
    });
};

const scheduleAndStoreReminder = async (task: Task) => {
    const scheduledReminder = await scheduleTaskReminder(task);
    if (!scheduledReminder) return null;

    try {
        const saved = await updateStoredTaskNotificationId(
            task,
            scheduledReminder.notificationId,
        );
        if (saved) return scheduledReminder;
    } catch (error) {
        await cancelTaskReminder(scheduledReminder.notificationId);
        throw error;
    }
    await cancelTaskReminder(scheduledReminder.notificationId);
    return null;
};

const cancelScheduledTaskReminders = async (
    scheduledIds: string[],
): Promise<void> => {
    const ids = new Set(scheduledIds);
    for (const id of ids) {
        await cancelTaskReminder(id);
    }
};

interface ReminderReconciliationResult {
    tasks: Task[];
    error: string | null;
}

const reconcileTaskRemindersNow = async (
    tasks: Task[],
    restoreAndroidAlarms: boolean,
): Promise<ReminderReconciliationResult> => {
    const [scheduledNotifications, notificationPermission] = await Promise.all([
        getAllScheduledNotificationsAsync(),
        getPermissionsAsync(),
    ]);
    const exactAlarmGranted = Platform.OS !== 'android'
        || (await getExactAlarmPermissionsAsync()).granted;
    const reconciledTasks: Task[] = [];
    let reminderError: string | null = null;
    const taskIds = new Set(tasks.map(task => task.id));

    await cancelScheduledTaskReminders(
        scheduledNotifications
            .filter(notification => {
                const taskId = notification.content.data?.taskId;
                return typeof taskId === 'string' && !taskIds.has(taskId);
            })
            .map(notification => notification.identifier),
    );

    for (const task of tasks) {
        const scheduledForTask = scheduledNotifications.filter(
            notification => notification.content.data?.taskId === task.id,
        );
        const dueAt = task.dueDate && task.dueTime
            ? getLocalDueDate(task.dueDate, task.dueTime)
            : null;
        const shouldSchedule = task.reminderEnabled
            && !task.isCompleted
            && dueAt !== null
            && dueAt.getTime() > Date.now();

        if (!shouldSchedule) {
            if (scheduledForTask.length || task.notificationId) {
                await cancelScheduledTaskReminders(
                    [
                        ...scheduledForTask.map(notification => notification.identifier),
                        ...(task.notificationId ? [task.notificationId] : []),
                    ],
                );
                const taskWithoutReminder = { ...task, notificationId: null };
                await updateStoredTaskNotificationId(task, null);
                reconciledTasks.push(taskWithoutReminder);
            } else {
                reconciledTasks.push(task);
            }

            continue;
        }

        const dueAtIso = dueAt.toISOString();
        const expectedBody = task.subtasks[0] || 'Your task is due now.';
        const currentNotification = scheduledForTask.find(
            notification => notification.content.data?.dueAt === dueAtIso
                && notification.content.title === task.title
                && notification.content.body === expectedBody
                && notification.content.data?.exactDelivery === exactAlarmGranted
                && (
                    Platform.OS !== 'android'
                    || notification.content.data?.notificationChannelId === ANDROID_CHANNEL_ID
                ),
        );
        if (currentNotification && !restoreAndroidAlarms) {
            if (
                !notificationPermission.granted
                && !reminderError
            ) {
                reminderError = 'Task notifications are turned off. Enable notifications in your device settings to receive reminders.';
            } else if (
                Platform.OS === 'android'
                && !exactAlarmGranted
                && !reminderError
            ) {
                reminderError = 'Allow exact alarms for Voxlist Ai to improve on-time task reminders.';
            }
            await cancelScheduledTaskReminders(
                scheduledForTask
                    .filter(notification => notification.identifier !== currentNotification.identifier)
                    .map(notification => notification.identifier),
            );
            const reconciledTask = {
                ...task,
                notificationId: currentNotification.identifier,
            };
            if (
                task.notificationId
                && task.notificationId !== currentNotification.identifier
            ) {
                await cancelTaskReminder(task.notificationId);
            }
            if (task.notificationId !== currentNotification.identifier) {
                await updateStoredTaskNotificationId(task, currentNotification.identifier);
            }
            reconciledTasks.push(reconciledTask);
            continue;
        }

        await cancelScheduledTaskReminders(
            [
                ...scheduledForTask.map(notification => notification.identifier),
                ...(task.notificationId ? [task.notificationId] : []),
            ],
        );
        const taskWithoutReminder = { ...task, notificationId: null };
        if (task.notificationId) await updateStoredTaskNotificationId(task, null);

        try {
            const scheduledReminder = await scheduleAndStoreReminder(taskWithoutReminder);
            if (!scheduledReminder) {
                reconciledTasks.push(taskWithoutReminder);
                continue;
            }

            reconciledTasks.push({
                ...taskWithoutReminder,
                notificationId: scheduledReminder.notificationId,
            });
            if (
                Platform.OS === 'android'
                && !scheduledReminder.exactDelivery
                && !reminderError
            ) {
                reminderError = 'Allow exact alarms for Voxlist Ai to improve on-time task reminders.';
            }
        } catch (scheduleError) {
            console.error(`Could not schedule a reminder for task ${task.id}.`, scheduleError);
            if (!reminderError) {
                reminderError = scheduleError instanceof Error
                    && /notification permission was not granted/i.test(scheduleError.message)
                    ? 'Task notifications are turned off. Enable notifications in your device settings to receive reminders.'
                    : "We couldn't set one or more task reminders. Your tasks are saved, but might not notify you.";
            }
            reconciledTasks.push(taskWithoutReminder);
        }
    }

    return { tasks: reconciledTasks, error: reminderError };
};

const reconcileTaskReminders = async (
    userId: string | null,
): Promise<ReminderReconciliationResult> => {
    const previousReconciliation = reminderReconciliationQueue;
    let releaseReconciliation!: () => void;
    reminderReconciliationQueue = new Promise<void>(resolve => {
        releaseReconciliation = resolve;
    });

    await previousReconciliation;
    try {
        const restoreAndroidAlarms = Platform.OS === 'android'
            && !restoredAndroidAlarmOwners.has(userId);
        const latestTasks = await getStoredTasks(userId);
        const result = await reconcileTaskRemindersNow(latestTasks, restoreAndroidAlarms);
        if (restoreAndroidAlarms) restoredAndroidAlarmOwners.add(userId);
        return result;
    } finally {
        releaseReconciliation();
    }
};

const useTasks = () => {
    const { session, isLoading: isAuthLoading } = useAppSelector(selectAuth);
    const userId = session && session.user.is_anonymous !== true
        ? session.user.id
        : null;
    const [items, setItems] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const reloadInFlight = useRef<Promise<void> | null>(null);
    const reloadRevision = useRef(0);
    const reloadRequested = useRef(false);

    const reload = useCallback(() => {
        if (isAuthLoading) return Promise.resolve();

        reloadRevision.current += 1;
        if (reloadInFlight.current) {
            reloadRequested.current = true;
            return reloadInFlight.current;
        }

        const operation = (async () => {
            do {
                reloadRequested.current = false;
                const revision = reloadRevision.current;
                try {
                    const storedTasks = await getStoredTasks(userId);
                    if (revision !== reloadRevision.current) continue;
                    setItems(storedTasks);
                    setLoading(false);
                    hideStartupSplash();

                    try {
                        const result = await reconcileTaskReminders(userId);
                        if (revision !== reloadRevision.current) continue;
                        setError(result.error);
                        setItems(result.tasks);
                    } catch (reconciliationError) {
                        if (revision !== reloadRevision.current) continue;
                        console.error('Could not reconcile task reminders.', reconciliationError);
                        setError("We couldn't restore your task reminders. Your tasks are saved, but reminders may not be scheduled. Please try again.");
                    }
                } catch (reconciliationError) {
                    if (revision !== reloadRevision.current) continue;
                    console.error('Could not load stored tasks.', reconciliationError);
                    setError("We couldn't load your tasks. Please try again.");
                    setLoading(false);
                    hideStartupSplash();
                } finally {
                    if (revision === reloadRevision.current) setLoading(false);
                }
            } while (reloadRequested.current);
        })();
        reloadInFlight.current = operation;
        return operation.finally(() => {
            if (reloadInFlight.current === operation) reloadInFlight.current = null;
        });
    }, [isAuthLoading, userId]);

    const invalidatePendingReload = useCallback(() => {
        if (!reloadInFlight.current) return;
        reloadRevision.current += 1;
        reloadRequested.current = true;
    }, []);

    const requestSync = useCallback(() => {
        if (!userId) return;
        void syncTasksForUser(userId).catch(syncError => {
            console.error('Task sync failed; local changes are still saved.', syncError);
        });
    }, [userId]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void reload();
    }, [reload]);

    useEffect(() => subscribeToTaskSync(() => {
        void reload();
    }), [reload]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', state => {
            if (state === 'active') void reload();
        });
        return () => subscription.remove();
    }, [reload]);

    const addTasks = useCallback(async (drafts: ExtractedTask[]) => {
        setError(null);
        try {
            const createdTasks = await insertTasks(drafts, userId);
            setItems(current => [...createdTasks, ...current]);
            requestSync();
            void reload();
            return true;
        } catch (saveError) {
            console.error('Could not create task.', saveError);
            setError("We couldn't create your task. Please try again.");
            return false;
        }
    }, [reload, requestSync, userId]);

    const updateTask = useCallback(async (updatedTask: Task) => {
        setError(null);
        const existingTask = items.find(task => task.id === updatedTask.id);
        const taskWithoutReminder: Task = {
            ...updatedTask,
            completedSubtasks: updatedTask.subtasks.map(
                (_, index) => updatedTask.completedSubtasks[index] ?? false,
            ),
            notificationId: null,
        };
        invalidatePendingReload();
        setItems(current => current.map(task => (
            task.id === updatedTask.id ? taskWithoutReminder : task
        )));
        try {
            await updateStoredTask(taskWithoutReminder);
        } catch (saveError) {
            if (existingTask) {
                setItems(current => current.map(task => (
                    task.id === existingTask.id ? existingTask : task
                )));
            }
            console.error('Could not save task changes.', saveError);
            setError("We couldn't save your changes. Please try again.");
            return false;
        }
        requestSync();
        void reload();
        return true;
    }, [items, invalidatePendingReload, reload, requestSync]);

    const updateTasks = useCallback(async (updatedTasks: Task[]) => {
        if (!updatedTasks.length) return true;
        setError(null);

        const previousTasks = new Map(
            items
                .filter(task => updatedTasks.some(updated => updated.id === task.id))
                .map(task => [task.id, task]),
        );
        const normalizedTasks = updatedTasks.map<Task>(task => ({
            ...task,
            completedSubtasks: task.subtasks.map(
                (_, index) => task.completedSubtasks[index] ?? false,
            ),
            notificationId: null,
        }));
        const updatedTasksById = new Map(normalizedTasks.map(task => [task.id, task]));

        invalidatePendingReload();
        setItems(current => current.map(task => updatedTasksById.get(task.id) ?? task));

        try {
            await updateStoredTasks(normalizedTasks);
        } catch (saveError) {
            setItems(current => current.map(task => previousTasks.get(task.id) ?? task));
            console.error('Could not save task changes.', saveError);
            setError("We couldn't move the selected tasks. Please try again.");
            return false;
        }

        requestSync();
        void reload();
        return true;
    }, [items, invalidatePendingReload, reload, requestSync]);

    const toggleTaskCompletion = useCallback(async (task: Task): Promise<void> => {
        setError(null);
        const updatedTask: Task = {
            ...task,
            isCompleted: !task.isCompleted,
            notificationId: null,
        };
        invalidatePendingReload();
        setItems(current => current.map(item => (
            item.id === task.id ? updatedTask : item
        )));

        try {
            await updateStoredTask(updatedTask);
        } catch (updateError) {
            setItems(current => current.map(item => (
                item.id === task.id ? task : item
            )));
            console.error('Could not update task completion.', updateError);
            setError("We couldn't update your task. Please try again.");
            return;
        }

        await reload();
        requestSync();
    }, [invalidatePendingReload, reload, requestSync]);

    const toggleSubtaskCompletion = useCallback(async (
        task: Task,
        subtaskIndex: number,
    ): Promise<void> => {
        if (subtaskIndex < 0 || subtaskIndex >= task.subtasks.length) return;

        setError(null);
        const completedSubtasks = task.subtasks.map((_, index) => (
            index === subtaskIndex
                ? !(task.completedSubtasks[index] ?? false)
                : task.completedSubtasks[index] ?? false
        ));
        const updatedTask = { ...task, completedSubtasks };
        invalidatePendingReload();
        setItems(current => current.map(item => (
            item.id === task.id ? updatedTask : item
        )));

        try {
            await updateStoredSubtaskCompletion(task, completedSubtasks);
        } catch (updateError) {
            setItems(current => current.map(item => {
                if (
                    item.id !== task.id
                    || item.completedSubtasks[subtaskIndex] !== completedSubtasks[subtaskIndex]
                ) {
                    return item;
                }
                const restoredSubtasks = [...item.completedSubtasks];
                restoredSubtasks[subtaskIndex] = task.completedSubtasks[subtaskIndex] ?? false;
                return { ...item, completedSubtasks: restoredSubtasks };
            }));
            console.error('Could not update subtask completion.', updateError);
            setError("We couldn't update the subtask. Please try again.");
            return;
        }

        requestSync();
    }, [invalidatePendingReload, requestSync]);

    const deleteTask = useCallback(async (task: Task) => {
        setError(null);
        invalidatePendingReload();
        setItems(current => current.filter(item => item.id !== task.id));
        try {
            await deleteStoredTask(task.id);
        } catch (deleteError) {
            setItems(current => current.some(item => item.id === task.id)
                ? current
                : [...current, task]);
            console.error('Could not delete task.', deleteError);
            setError("We couldn't delete your task. Please try again.");
            return false;
        }
        let cancellationError: string | null = null;
        if (task.notificationId) {
            try {
                await cancelTaskReminder(task.notificationId);
            } catch (cancelError) {
                console.error(`Could not cancel the reminder for deleted task ${task.id}.`, cancelError);
                cancellationError = 'The task was deleted, but its reminder may still go off.';
            }
        }
        await reload();
        requestSync();
        if (cancellationError) setError(cancellationError);
        return true;
    }, [invalidatePendingReload, reload, requestSync]);

    return {
        items,
        loading,
        error,
        reload,
        addTasks,
        updateTask,
        updateTasks,
        toggleTaskCompletion,
        toggleSubtaskCompletion,
        deleteTask,
    };
};

export default useTasks;
