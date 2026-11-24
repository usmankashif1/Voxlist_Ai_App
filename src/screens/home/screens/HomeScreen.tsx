import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    LayoutAnimation,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    SectionList,
    StyleSheet,
    Image,
    UIManager,
    View,
} from 'react-native';
import * as Network from 'expo-network';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';
import { getLocalDueDate, getTaskDateLabel } from '../../../core/utils/dateTime';
import { taskTheme } from '../../../core/theme/taskTheme';
import { getErrorMessage } from '../../../core/utils/errorMessage';
import TaskCard from '../components/TaskCard';
import TaskActionsSheet from '../components/TaskActionsSheet';
import TaskCategoryTabs from '../components/TaskCategoryTabs';
import TaskEditorModal from '../components/TaskEditorModal';
import MoveOverdueTasksModal from '../components/MoveOverdueTasksModal';
import ConfirmationModal from '../components/ConfirmationModal';
import VoiceTaskReviewModal from '../components/VoiceTaskReviewModal';
import InternetRequiredSheet from '../components/InternetRequiredSheet';
import HomeTourOverlay, { type HomeTourTarget } from '../components/HomeTourOverlay';
import BatteryOptimizationPrompt from '../components/BatteryOptimizationPrompt';
import type { ExtractedTask, Task, TaskCategory, TaskDateLabel, TaskSection } from '../home.types';
import useTasks from '../hooks/useTasks';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import { ensureVoiceSession } from '../../../store/authThunks';
import { useAppDispatch } from '../../../store/hooks';
import {
    getVoiceUsageLimitNotice,
    reserveVoiceRequest,
    type VoiceUsageDecision,
} from '../../../core/api/voiceUsageService';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { HomeStackParamList } from '../navigation/HomeNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    claimBatteryOptimizationPrompt,
    getHasSeenHomeTour as readHasSeenHomeTour,
    setHasSeenHomeTour as persistHomeTourCompletion,
} from '../../../core/storage/onboardingStorage';
import {
    isIgnoringBatteryOptimizations,
    requestBatteryOptimizationExemption,
} from '../../../core/notifications/reminderStatus';
import { subscribeToReminderEligibleTaskSaves } from '../../../core/notifications/taskReminderService';

const sectionOrder: TaskDateLabel[] = ['Overdue', 'Today', 'Tomorrow', 'Upcoming', 'No Date'];
const categories: TaskCategory[] = [...sectionOrder, 'Completed'];

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}


const getCategorySections = (
    tasks: Task[],
    category: TaskCategory,
    currentDate: Date,
    delayedCompletedTaskIds: ReadonlySet<string>,
): TaskSection[] => {
    if (category === 'Completed') {
        const completedTasks = tasks.filter(
            task => task.isCompleted && !delayedCompletedTaskIds.has(task.id),
        );
        return completedTasks.length
            ? [{ title: 'Completed', data: completedTasks }]
            : [];
    }

    const categoryTasks = tasks.filter(
        task => getTaskDateLabel(task.dueDate, currentDate) === category,
    );
    const activeTasks = categoryTasks.filter(
        task => !task.isCompleted || delayedCompletedTaskIds.has(task.id),
    );
    const completedTasks = categoryTasks.filter(
        task => task.isCompleted && !delayedCompletedTaskIds.has(task.id),
    );

    return [
        ...(activeTasks.length
            ? [{ title: category, data: activeTasks, dateLabel: category }]
            : []),
        ...(completedTasks.length
            ? [{ title: 'Completed' as const, data: completedTasks, dateLabel: category }]
            : []),
    ];
};


const HomeScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const [isBatteryPromptQueued, setIsBatteryPromptQueued] = useState(false);
    const [isBatteryOptimizationPromptOpen, setIsBatteryOptimizationPromptOpen] = useState(false);
    const batteryPromptCheckInProgress = useRef(false);
    const {
        items,
        loading,
        error,
        reload,
        addTasks,
        updateTask,
        updateTasks,
        toggleTaskCompletion,
        deleteTask,
    } = useTasks();
    const [currentDate, setCurrentDate] = useState(() => new Date());
    const [delayedCompletedTaskIds, setDelayedCompletedTaskIds] = useState<Set<string>>(
        () => new Set(),
    );
    const completionTransitionTimers = useRef(
        new Map<string, ReturnType<typeof setTimeout>>(),
    );


    useFocusEffect(useCallback(() => {
        setCurrentDate(new Date());
        void reload();
    }, [reload]));



    useEffect(() => {
        const now = new Date();
        const nextMidnight = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1,
        );
        const timeout = setTimeout(
            () => setCurrentDate(new Date()),
            nextMidnight.getTime() - now.getTime(),
        );

        return () => clearTimeout(timeout);
    }, [currentDate]);



    useEffect(() => () => {
        completionTransitionTimers.current.forEach(timer => clearTimeout(timer));
        completionTransitionTimers.current.clear();
    }, []);


    
    const handleCompleteTask = useCallback((task: Task) => {
        const existingTimer = completionTransitionTimers.current.get(task.id);
        if (existingTimer) {
            clearTimeout(existingTimer);
            completionTransitionTimers.current.delete(task.id);
        }

        if (task.isCompleted) {
            setDelayedCompletedTaskIds(current => {
                const next = new Set(current);
                next.delete(task.id);
                return next;
            });
        } else {
            setDelayedCompletedTaskIds(current => new Set(current).add(task.id));
            const timer = setTimeout(() => {
                completionTransitionTimers.current.delete(task.id);
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setDelayedCompletedTaskIds(current => {
                    const next = new Set(current);
                    next.delete(task.id);
                    return next;
                });
            }, 1000);
            completionTransitionTimers.current.set(task.id, timer);
        }

        void toggleTaskCompletion(task);
    }, [toggleTaskCompletion]);


    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [taskActionTask, setTaskActionTask] = useState<Task | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [isSavingTask, setIsSavingTask] = useState(false);
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    const [voiceReservationId, setVoiceReservationId] = useState<string | null>(null);
    const [voiceQuotaNotice, setVoiceQuotaNotice] = useState<{
        title: string;
        message: string;
    } | null>(null);
    const [isPreparingVoice, setIsPreparingVoice] = useState(false);
    const [isInternetSheetOpen, setIsInternetSheetOpen] = useState(false);
    const [isOffline, setIsOffline] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('Today');
    const [isSelectingOverdueTasks, setIsSelectingOverdueTasks] = useState(false);
    const [selectedOverdueTaskIds, setSelectedOverdueTaskIds] = useState<string[]>([]);
    const [isMoveOverdueModalOpen, setIsMoveOverdueModalOpen] = useState(false);
    const [isMovingOverdueTasks, setIsMovingOverdueTasks] = useState(false);
    const [hasSeenHomeTour, setHasSeenHomeTour] = useState<boolean | null>(null);
    const [homeTourStep, setHomeTourStep] = useState<1 | 2 | null>(null);
    const [isCompletingHomeTour, setIsCompletingHomeTour] = useState(false);
    const [tourTargets, setTourTargets] = useState<{
        microphone: HomeTourTarget | null;
        createTask: HomeTourTarget | null;
    }>({
        microphone: null,
        createTask: null,
    });
    const microphoneTargetRef = useRef<React.ElementRef<typeof View>>(null);
    const createTaskTargetRef = useRef<React.ElementRef<typeof View>>(null);
    const isPreparingVoiceRef = useRef(false);

    const measureTourTarget = useCallback((
        target: 'microphone' | 'createTask',
    ): Promise<HomeTourTarget | null> => new Promise(resolve => {
        const targetRef = target === 'microphone' ? microphoneTargetRef : createTaskTargetRef;
        const targetView = targetRef.current;
        if (!targetView) {
            resolve(null);
            return;
        }

        targetView.measureInWindow((x, y, width, height) => {
            if (width <= 0 || height <= 0) {
                resolve(null);
                return;
            }
            const measuredTarget = { x, y, width, height };
            setTourTargets(current => {
                const previous = current[target];
                if (
                    previous
                    && previous.x === x
                    && previous.y === y
                    && previous.width === width
                    && previous.height === height
                ) return current;

                return {
                    ...current,
                    [target]: measuredTarget,
                };
            });
            resolve(measuredTarget);
        });
    }), []);

    const handleHomeTourNext = useCallback(() => {
        void measureTourTarget('createTask').then(target => {
            if (!target) {
                console.error('Could not measure the create-task button before advancing the Home tour.');
                return;
            }
            setHomeTourStep(2);
        });
    }, [measureTourTarget]);

    // useEffect(() => {
    //     let isMounted = true;
    //     const updateNetworkState = (
    //         state: Network.NetworkState,
    //         source: 'initial' | 'listener',
    //     ) => {
    //         if (!isMounted) return;
    //         console.log(`[NETWORK_DEBUG] HomeScreen ${source} state: ${JSON.stringify(state)}`);
    //         setIsOffline(
    //             state.isConnected === false || state.isInternetReachable === false,
    //         );
    //     };


    //     const subscription = Network.addNetworkStateListener(
    //         state => updateNetworkState(state, 'listener'),
    //     );
    //     void Network.getNetworkStateAsync()
    //         .then(state => updateNetworkState(state, 'initial'))
    //         .catch(error => {
    //             console.error('Could not determine network availability for voice tasks.', error);
    //         });

    //     return () => {
    //         isMounted = false;
    //         subscription.remove();
    //     };
    // }, []);



    useEffect(() => {
        let isMounted = true;
        let offlineTimer: ReturnType<typeof setTimeout> | null = null;
        let reachabilityController: AbortController | null = null;

        const clearOfflineTimer = () => {
            if (offlineTimer) {
                clearTimeout(offlineTimer);
                offlineTimer = null;
            }
            if (reachabilityController) {
                reachabilityController.abort();
                reachabilityController = null;
            }
        };

        const updateNetworkState = (
            state: Network.NetworkState,
            source: 'initial' | 'listener',
        ) => {
            if (!isMounted) return;
            console.log(`[NETWORK_DEBUG] HomeScreen ${source} state: ${JSON.stringify(state)}`);

            // Hard offline: no connection at all — trust this immediately.
            if (state.isConnected === false) {
                clearOfflineTimer();
                setIsOffline(true);
                return;
            }

            // Connected, but reachability says false or is still unknown:
            // on cellular this is often a transient validation delay, not a
            // real outage. Don't flip to offline immediately — wait a few
            // seconds in case a newer event clears it first.
            if (state.isConnected === true && state.isInternetReachable === false) {
                clearOfflineTimer();
                offlineTimer = setTimeout(async () => {
                    offlineTimer = null;
                    if (!isMounted) return;

                    reachabilityController = new AbortController();
                    const controller = reachabilityController;
                    const timeout = setTimeout(() => controller.abort(), 4000);

                    try {
                        const response = await fetch(
                            'https://clients3.google.com/generate_204',
                            {
                                cache: 'no-store',
                                signal: controller.signal,
                            },
                        );
                        if (!isMounted || reachabilityController !== controller) return;
                        setIsOffline(!response.ok);
                    } catch (error) {
                        if (isMounted && reachabilityController === controller) {
                            console.warn(
                                '[NETWORK_DEBUG] HomeScreen manual reachability check failed.',
                                error,
                            );
                            setIsOffline(true);
                        }
                    } finally {
                        clearTimeout(timeout);
                        if (reachabilityController === controller) {
                            reachabilityController = null;
                        }
                    }
                }, 4000);
                return;
            }

            // Connected and reachable (or reachability unknown/null) — treat as online.
            clearOfflineTimer();
            setIsOffline(false);
        };

        const subscription = Network.addNetworkStateListener(
            state => updateNetworkState(state, 'listener'),
        );
        void Network.getNetworkStateAsync()
            .then(state => updateNetworkState(state, 'initial'))
            .catch(error => {
                console.error('Could not determine network availability for voice tasks.', error);
            });

        return () => {
            isMounted = false;
            clearOfflineTimer();
            subscription.remove();
        };
    }, []);






    useEffect(() => {
        let isMounted = true;
        void readHasSeenHomeTour()
            .then(seen => {
                if (isMounted) setHasSeenHomeTour(seen);
            })
            .catch(error => {
                console.error('Could not read the Home tour completion state.', error);
                if (isMounted) setHasSeenHomeTour(true);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => subscribeToReminderEligibleTaskSaves(() => {
        setIsBatteryPromptQueued(true);
    }), []);

    useEffect(() => {
        if (
            hasSeenHomeTour === false
            && tourTargets.microphone
            && tourTargets.createTask
        ) {
            setHomeTourStep(currentStep => currentStep ?? 1);
        }
    }, [hasSeenHomeTour, tourTargets]);

    useEffect(() => {
        const hasOtherModalOpen = editingTask !== null
            || isCreateTaskOpen
            || isVoiceModalOpen
            || isInternetSheetOpen
            || isMoveOverdueModalOpen
            || isMovingOverdueTasks
            || taskActionTask !== null
            || taskToDelete !== null
            || voiceQuotaNotice !== null
            || homeTourStep !== null;
        if (
            !isBatteryPromptQueued
            || Platform.OS !== 'android'
            || hasOtherModalOpen
            || batteryPromptCheckInProgress.current
        ) return;

        batteryPromptCheckInProgress.current = true;
        void (async () => {
            try {
                const alreadyExempt = await isIgnoringBatteryOptimizations();
                const claimed = await claimBatteryOptimizationPrompt();
                if (claimed && !alreadyExempt) {
                    setIsBatteryOptimizationPromptOpen(true);
                }
            } catch (error) {
                console.error('Could not prepare the battery optimization prompt.', error);
            } finally {
                batteryPromptCheckInProgress.current = false;
                setIsBatteryPromptQueued(false);
            }
        })();
    }, [
        editingTask,
        homeTourStep,
        isBatteryPromptQueued,
        isCreateTaskOpen,
        isInternetSheetOpen,
        isMoveOverdueModalOpen,
        isMovingOverdueTasks,
        isVoiceModalOpen,
        taskActionTask,
        taskToDelete,
        voiceQuotaNotice,
    ]);



    const categoryCounts = useMemo(() => {
        const counts = new Map<TaskCategory, number>(
            categories.map(category => [category, 0]),
        );
        for (const task of items) {
            const category = getTaskDateLabel(task.dueDate, currentDate);
            counts.set(category, (counts.get(category) ?? 0) + 1);
            if (task.isCompleted && !delayedCompletedTaskIds.has(task.id)) {
                counts.set('Completed', (counts.get('Completed') ?? 0) + 1);
            }
        }
        return counts;
    }, [currentDate, delayedCompletedTaskIds, items]);

    const sections = useMemo(
        () => getCategorySections(items, selectedCategory, currentDate, delayedCompletedTaskIds),
        [currentDate, delayedCompletedTaskIds, items, selectedCategory],
    );
    const selectedOverdueTasks = useMemo(
        () => items.filter(task => (
            selectedOverdueTaskIds.includes(task.id)
            && getTaskDateLabel(task.dueDate, currentDate) === 'Overdue'
        )),
        [currentDate, items, selectedOverdueTaskIds],
    );

    const handleCategorySelect = (category: TaskCategory) => {
        setSelectedCategory(category);
        setIsSelectingOverdueTasks(false);
        setSelectedOverdueTaskIds([]);
    };

    const toggleOverdueTaskSelection = (taskId: string) => {
        setSelectedOverdueTaskIds(current => current.includes(taskId)
            ? current.filter(id => id !== taskId)
            : [...current, taskId]);
    };

    const cancelOverdueTaskSelection = () => {
        setIsSelectingOverdueTasks(false);
        setSelectedOverdueTaskIds([]);
    };

    const handleMoveSelectedTasks = async (dueDate: string | null): Promise<boolean> => {
        if (isMovingOverdueTasks) return false;
        const selectedTasks = selectedOverdueTasks;
        if (!selectedTasks.length) return false;

        setIsMovingOverdueTasks(true);
        try {
            const tasksToMove = selectedTasks.map(task => ({
                ...task,
                dueDate,
                dueTime: dueDate ? task.dueTime : null,
                reminderEnabled: Boolean(
                    dueDate
                    && task.reminderEnabled
                    && task.dueTime
                    && getLocalDueDate(dueDate, task.dueTime).getTime() > Date.now(),
                ),
                dateAmbiguous: false,
                ambiguityNote: undefined,
                notificationId: null,
            }));

            if (!await updateTasks(tasksToMove)) return false;

            setIsMoveOverdueModalOpen(false);
            cancelOverdueTaskSelection();
            return true;
        } finally {
            setIsMovingOverdueTasks(false);
        }
    };

    const handleSaveTask = async (changes: ExtractedTask): Promise<boolean> => {
        try {
            setIsSavingTask(true);
            const isSaved = editingTask
                ? await updateTask({ ...editingTask, ...changes })
                : await addTasks([changes]);
            if (!isSaved) return false;
            setEditingTask(null);
            setIsCreateTaskOpen(false);
            return true;
        } finally {
            setIsSavingTask(false);
        }
    };

    const handleCompleteHomeTour = async () => {
        if (isCompletingHomeTour) return;
        setIsCompletingHomeTour(true);
        try {
            await persistHomeTourCompletion();
            setHasSeenHomeTour(true);
            setHomeTourStep(null);
        } catch (error) {
            console.error('Could not save the Home tour completion state.', error);
            Alert.alert('Could not save progress', 'Please try again to close the tour.');
        } finally {
            setIsCompletingHomeTour(false);
        }
    };



    const reserveVoiceUse = useCallback(async (): Promise<VoiceUsageDecision | null> => {
        if (isOffline) {
            setIsInternetSheetOpen(true);
            return null;
        }
        return reserveVoiceRequest();
    }, [isOffline]);

    const handleConfirmVoiceTasks = async (tasks: ExtractedTask[]) => addTasks(tasks);
    const handleVoicePress = async () => {
        if (isOffline) {
            setIsInternetSheetOpen(true);
            return;
        }
        if (isPreparingVoiceRef.current) return;

        isPreparingVoiceRef.current = true;
        setIsPreparingVoice(true);
        try {
            await dispatch(ensureVoiceSession());
            const decision = await reserveVoiceUse();
            if (!decision) return;
            if (!decision.allowed) {
                setVoiceQuotaNotice(getVoiceUsageLimitNotice(decision));
                return;
            }
            if (!decision.reservationId) {
                throw new Error('The voice request reservation was missing.');
            }
            setVoiceReservationId(decision.reservationId);
            setIsVoiceModalOpen(true);
        } catch (error) {
            console.error('Could not prepare a reserved voice request.', error);
            Alert.alert('Could not start voice input', getErrorMessage(error));
        } finally {
            isPreparingVoiceRef.current = false;
            setIsPreparingVoice(false);
        }
    };




    const renderListHeader = () => (
        <View>
            <View style={styles.titleRow}>
                <View style={styles.brand}>
                    <Image
                        source={require('../../../assets/images/Logo.png')}
                        style={styles.brandLogo}
                        accessibilityLabel="VoxList Ai logo"
                    />
                    <View style={styles.brandCopy}>
                        <AppText style={styles.title}>Voxlist AI</AppText>
                        <AppText style={styles.subtitle}>Turn your thoughts into tasks</AppText>
                    </View>
                </View>
                <View style={styles.headerActions}>
                    <AppButton
                        style={styles.settingsButton}
                        onPress={() => navigation.navigate('Settings')}
                        accessibilityRole="button"
                        accessibilityLabel="Open settings"
                    >
                        <FontAwesome5 name="cog" size={RS(19)} color={taskTheme.colors.text} />
                    </AppButton>
                    <View
                        ref={createTaskTargetRef}
                        collapsable={false}
                        onLayout={() => { void measureTourTarget('createTask'); }}
                    >
                        <AppButton
                            style={styles.addButton}
                            onPress={() => setIsCreateTaskOpen(true)}
                            accessibilityRole="button"
                            accessibilityLabel="Create a task"
                        >
                            <AppText style={styles.addButtonText}>+</AppText>
                        </AppButton>
                    </View>
                </View>
            </View>

            <View style={styles.listHeading}>
                <AppText style={styles.listTitle}>Your tasks</AppText>
                <AppText style={styles.taskCount}>{items.length}</AppText>
            </View>

            <TaskCategoryTabs
                categories={categories}
                counts={categoryCounts}
                selectedCategory={selectedCategory}
                onSelect={handleCategorySelect}
            />

            {error ? (
                <View style={styles.errorNotice}>
                    <AppText style={styles.errorText}>{error}</AppText>
                    <AppButton onPress={() => void reload()} accessibilityRole="button">
                        <AppText style={styles.retryText}>Try again</AppText>
                    </AppButton>
                </View>
            ) : null}
        </View>
    );




    return (
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <SectionList
                    sections={sections}
                    extraData={{ items, isSelectingOverdueTasks, selectedOverdueTaskIds }}
                    keyExtractor={task => `${task.id}-${task.isCompleted ? 'completed' : 'active'}`}
                    renderItem={({ item, section }) => (
                        <TaskCard
                            task={item}
                            dateLabel={section.dateLabel ?? getTaskDateLabel(item.dueDate, currentDate)}
                            onPress={task => navigation.navigate('TaskDetails', { taskId: task.id })}
                            onLongPress={setTaskActionTask}
                            onComplete={handleCompleteTask}
                            selectionMode={isSelectingOverdueTasks && !item.isCompleted}
                            selected={selectedOverdueTaskIds.includes(item.id)}
                            onSelect={() => toggleOverdueTaskSelection(item.id)}
                        />
                    )}
                    renderSectionHeader={({ section }) => section.title === 'Overdue' ? (
                        <View style={styles.overdueSectionHeader}>
                            {isSelectingOverdueTasks ? (
                                <>
                                    <AppText style={styles.selectionCount}>
                                        {selectedOverdueTasks.length} selected
                                    </AppText>
                                    <AppButton
                                        style={styles.selectionCancelButton}
                                        onPress={cancelOverdueTaskSelection}
                                    >
                                        <AppText style={styles.selectionCancelText}>Cancel</AppText>
                                    </AppButton>
                                    <AppButton
                                        style={[
                                            styles.selectionMoveButton,
                                            selectedOverdueTasks.length === 0 && styles.selectionMoveDisabled,
                                        ]}
                                        onPress={() => setIsMoveOverdueModalOpen(true)}
                                        disabled={selectedOverdueTasks.length === 0}
                                    >
                                        <AppText style={styles.selectionMoveText}>Move selected</AppText>
                                    </AppButton>
                                </>
                            ) : (
                                <View style={{ justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                                    <AppText
                                        style={[styles.sectionTitle, styles.overdueSectionTitle]}
                                    >
                                        {section.title}
                                    </AppText>
                                    <AppButton
                                        style={styles.moveOverdueButton}
                                        onPress={() => setIsSelectingOverdueTasks(true)}
                                        accessibilityRole="button"
                                    >
                                        <AppText style={styles.moveOverdueButtonText}>Move tasks</AppText>
                                    </AppButton>
                                </View>
                            )}
                        </View>
                    ) : (
                        <AppText style={styles.sectionTitle}>{section.title}</AppText>
                    )}
                    ListHeaderComponent={renderListHeader()}
                    ListEmptyComponent={
                        loading ? undefined : (
                            <View style={styles.emptyState}>
                                <AppText style={styles.emptyText}>
                                    No {selectedCategory.toLowerCase()} tasks.
                                </AppText>
                            </View>
                        )
                    }

                    contentContainerStyle={styles.content}
                    stickySectionHeadersEnabled={false}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={
                        <RefreshControl
                            refreshing={false}
                            onRefresh={() => void reload()}
                            tintColor={taskTheme.colors.primary}
                        />
                    }
                />

            </KeyboardAvoidingView>

            <TaskActionsSheet
                task={taskActionTask}
                onClose={() => setTaskActionTask(null)}
                onEdit={task => {
                    setTaskActionTask(null);
                    setEditingTask(task);
                }}
                onDelete={task => {
                    setTaskActionTask(null);
                    setTaskToDelete(task);
                }}
            />
            <ConfirmationModal
                visible={taskToDelete !== null}
                title="Delete this task?"
                message={taskToDelete?.title ?? ''}
                confirmText="Delete"
                confirmVariant="danger"
                onCancel={() => setTaskToDelete(null)}
                onConfirm={() => {
                    const task = taskToDelete;
                    setTaskToDelete(null);
                    if (task) void deleteTask(task);
                }}
            />

            <View
                ref={microphoneTargetRef}
                collapsable={false}
                onLayout={() => { void measureTourTarget('microphone'); }}
                style={[
                    styles.floatingVoiceButtonTarget,
                    { bottom: insets.bottom + RH(taskTheme.spacing.xl) },
                ]}
            >
                <AppButton
                    style={styles.floatingVoiceButton}
                    onPress={handleVoicePress}
                    disabled={isPreparingVoice}
                    accessibilityRole="button"
                    accessibilityLabel={isPreparingVoice
                        ? 'Preparing voice input'
                        : 'Create tasks by voice'}
                >
                    {isPreparingVoice
                        ? <ActivityIndicator size={RS(30)} color="white" />
                        : <FontAwesome5 name="microphone" size={RS(26)} color="white" />}
                </AppButton>
            </View>

            <TaskEditorModal
                key={editingTask?.id ?? (isCreateTaskOpen ? 'create' : 'closed')}
                task={editingTask}
                visible={editingTask !== null || isCreateTaskOpen}
                saving={isSavingTask}
                modalTitle={editingTask ? 'Edit task' : 'Create a task'}
                onCancel={() => {
                    setEditingTask(null);
                    setIsCreateTaskOpen(false);
                }}
                onSave={handleSaveTask}
            />
            <MoveOverdueTasksModal
                visible={isMoveOverdueModalOpen}
                selectedCount={selectedOverdueTasks.length}
                moving={isMovingOverdueTasks}
                onCancel={() => setIsMoveOverdueModalOpen(false)}
                onMove={handleMoveSelectedTasks}
            />
            <VoiceTaskReviewModal
                key={voiceReservationId ?? 'voice-no-reservation'}
                visible={isVoiceModalOpen}
                initialReservationId={voiceReservationId}
                onReserveVoiceRequest={reserveVoiceUse}
                onQuotaReached={decision => {
                    setVoiceQuotaNotice(getVoiceUsageLimitNotice(decision));
                }}
                onClose={() => setIsVoiceModalOpen(false)}
                onConfirm={handleConfirmVoiceTasks}
            />
            <ConfirmationModal
                visible={voiceQuotaNotice !== null}
                title={voiceQuotaNotice?.title ?? ''}
                message={voiceQuotaNotice?.message ?? ''}
                confirmText="Got it"
                onConfirm={() => setVoiceQuotaNotice(null)}
            />
            <InternetRequiredSheet
                visible={isInternetSheetOpen}
                onClose={() => setIsInternetSheetOpen(false)}
            />
            {homeTourStep && tourTargets.microphone && tourTargets.createTask ? (
                <HomeTourOverlay
                    step={homeTourStep}
                    microphoneTarget={tourTargets.microphone}
                    createTaskTarget={tourTargets.createTask}
                    isCompleting={isCompletingHomeTour}
                    onNext={handleHomeTourNext}
                    onDismiss={() => void handleCompleteHomeTour()}
                />
            ) : null}
            <BatteryOptimizationPrompt
                visible={isBatteryOptimizationPromptOpen}
                onDismiss={() => setIsBatteryOptimizationPromptOpen(false)}
                onAllow={requestBatteryOptimizationExemption}
            />
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: taskTheme.colors.background,
    },
    flex: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: RW(taskTheme.spacing.xl),
        paddingTop: RH(20),
        paddingBottom: RH(100),
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: "space-between",
        gap: RW(taskTheme.spacing.md),
    },
    brand: {
        flex: 1,
        minWidth: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: RW(taskTheme.spacing.sm),
    },
    brandLogo: {
        width: RS(42),
        height: RS(42),
        // borderRadius: RS(12),
    },
    brandCopy: {
        flex: 1,
        minWidth: 0,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RW(taskTheme.spacing.sm),
    },
    settingsButton: {
        width: RS(44),
        height: RS(44),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(22),
        backgroundColor: taskTheme.colors.surface,
        borderWidth: 1,
        borderColor: taskTheme.colors.border,
    },
    title: {
        color: taskTheme.colors.text,
        fontSize: RF(20),
        fontWeight: 'bold',
        lineHeight: RF(20),

    },
    subtitle: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(11),
        letterSpacing: -0.5,
        lineHeight: RF(16),
    },
    addButton: {
        width: RS(44),
        height: RS(44),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(22),
        backgroundColor: taskTheme.colors.primary,
    },
    addButtonText: {
        color: taskTheme.colors.white,
        fontSize: RF(28),
        lineHeight: RF(31),
        fontWeight: '400',
    },
    listHeading: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RW(taskTheme.spacing.sm),
        marginTop: RH(taskTheme.spacing.xxl),
        marginBottom: RH(taskTheme.spacing.md),
    },
    overdueSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RW(taskTheme.spacing.sm),
        marginTop: RH(taskTheme.spacing.lg),
        marginBottom: RH(taskTheme.spacing.sm),
    },
    overdueSectionTitle: {
        marginTop: 0,
        marginBottom: 0,
    },
    moveOverdueButton: {
        minHeight: RH(36),
        justifyContent: 'center',
        paddingHorizontal: RW(taskTheme.spacing.sm),
    },
    moveOverdueButtonText: {
        color: taskTheme.colors.danger,
        fontSize: RF(15),
        fontWeight: '700',
    },
    selectionCount: {
        flex: 1,
        color: taskTheme.colors.textSecondary,
        fontSize: RF(15),
        fontWeight: '600',
    },
    selectionCancelButton: {
        minHeight: RH(40),
        justifyContent: 'center',
        paddingHorizontal: RW(taskTheme.spacing.sm),
    },
    selectionCancelText: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(15),
        fontWeight: '600',
    },
    selectionMoveButton: {
        minHeight: RH(40),
        justifyContent: 'center',
        paddingHorizontal: RW(taskTheme.spacing.sm),
    },
    selectionMoveDisabled: {
        opacity: 0.5,
    },
    selectionMoveText: {
        color: taskTheme.colors.danger,
        fontSize: RF(15),
        fontWeight: '700',
    },
    listTitle: {
        color: taskTheme.colors.text,
        fontSize: RF(20),
        fontWeight: '800',

    },
    taskCount: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(13),
        fontWeight: '600',
    },
    sectionTitle: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(13),
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginTop: RH(taskTheme.spacing.lg),
        marginBottom: RH(taskTheme.spacing.sm),
    },
    emptyText: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(14),
        lineHeight: RF(20),
        textAlign: 'center',
    },
    errorNotice: {
        marginTop: RH(taskTheme.spacing.md),
        gap: RH(taskTheme.spacing.xs),
    },
    errorText: {
        color: taskTheme.colors.danger,
        fontSize: RF(13),
        lineHeight: RF(19),
    },
    retryText: {
        color: taskTheme.colors.primary,
        fontSize: RF(13),
        fontWeight: '700',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: RW(taskTheme.spacing.lg),
    },
    floatingVoiceButtonTarget: {
        position: 'absolute',
        right: RW(taskTheme.spacing.xl),
        width: RS(60),
        height: RS(60),
    },
    floatingVoiceButton: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(30),
        backgroundColor: taskTheme.colors.primary,
        elevation: 6,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    floatingVoiceIcon: {
        color: taskTheme.colors.white,
        fontSize: RF(25),
    },
});

export default HomeScreen;
