import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    ScrollView,
    SectionList,
    StyleSheet,
    Image,
    View,
} from 'react-native';
import * as Network from 'expo-network';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';
import { getTaskDateLabel } from '../../../core/utils/dateTime';
import { taskTheme } from '../../../core/theme/taskTheme';
import TaskCard from '../components/TaskCard';
import TaskEditorModal from '../components/TaskEditorModal';
import VoiceTaskReviewModal from '../components/VoiceTaskReviewModal';
import InternetRequiredSheet from '../components/InternetRequiredSheet';
import type { ExtractedTask, Task, TaskDateLabel, TaskSection } from '../home.types';
import useTasks from '../hooks/useTasks';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import * as SecureStore from 'expo-secure-store';
import {
    requestMicrophonePermission,
    requestNotificationPermission,
} from '../../../core/permissions/permissionService';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { HomeStackParamList } from '../navigation/HomeNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';


const sectionOrder: TaskDateLabel[] = ['Overdue', 'Today', 'Tomorrow', 'Upcoming', 'No Date'];
const HOME_PERMISSIONS_PROMPTED_KEY = 'home-permissions-prompted-v2';


const groupTasks = (tasks: Task[]): TaskSection[] => {
    const groups = new Map<TaskDateLabel, Task[]>(
        sectionOrder.map(label => [label, []]),
    );

    for (const task of tasks) {
        const label = getTaskDateLabel(task.dueDate);
        groups.get(label)?.push(task);
    }

    return sectionOrder.flatMap(title => {
        const data = groups.get(title) ?? [];
        return data.length ? [{ title, data }] : [];
    });
};


const HomeScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
    const insets = useSafeAreaInsets();
    const {
        items,
        loading,
        error,
        reload,
        addTasks,
        updateTask,
        toggleTaskCompletion,
        deleteTask,
    } = useTasks();


    useFocusEffect(useCallback(() => {
        void reload();
    }, [reload]));


    const handleCompleteTask = useCallback((task: Task) => {
        void toggleTaskCompletion(task);
    }, [toggleTaskCompletion]);


    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isSavingTask, setIsSavingTask] = useState(false);
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    const [isInternetSheetOpen, setIsInternetSheetOpen] = useState(false);
    const [isOffline, setIsOffline] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<TaskDateLabel>('Today');
    const hasStartedPermissionCheck = useRef(false);

    useEffect(() => {
        let isMounted = true;
        const updateNetworkState = (state: Network.NetworkState) => {
            if (!isMounted) return;
            setIsOffline(
                state.isConnected === false || state.isInternetReachable === false,
            );
        };


        const subscription = Network.addNetworkStateListener(updateNetworkState);
        void Network.getNetworkStateAsync()
            .then(updateNetworkState)
            .catch(error => {
                console.error('Could not determine network availability for voice tasks.', error);
            });

        return () => {
            isMounted = false;
            subscription.remove();
        };
    }, []);


    

    useEffect(() => {
        if (hasStartedPermissionCheck.current) return;
        hasStartedPermissionCheck.current = true;

        void (async () => {
            try {
                if (await SecureStore.getItemAsync(HOME_PERMISSIONS_PROMPTED_KEY)) return;

                try {
                    await requestMicrophonePermission();
                } catch (permissionError) {
                    console.error('Could not request microphone permission on Home.', permissionError);
                }

                try {
                    await requestNotificationPermission();
                } catch (permissionError) {
                    console.error('Could not request notification permission on Home.', permissionError);
                }

                await SecureStore.setItemAsync(HOME_PERMISSIONS_PROMPTED_KEY, 'true');
            } catch (error) {
                console.error('Could not initialize Home permission requests.', error);
            }
        })();
    }, []);



    const categoryCounts = useMemo(() => {
        const counts = new Map<TaskDateLabel, number>(
            sectionOrder.map(category => [category, 0]),
        );
        for (const task of items) {
            const category = getTaskDateLabel(task.dueDate);
            counts.set(category, (counts.get(category) ?? 0) + 1);
        }
        return counts;
    }, [items]);




    const sections = useMemo(
        () => groupTasks(items.filter(task => getTaskDateLabel(task.dueDate) === selectedCategory)),
        [items, selectedCategory],
    );
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



    const handleConfirmVoiceTasks = async (tasks: ExtractedTask[]) => addTasks(tasks);
    const handleVoicePress = () => {
        if (isOffline) {
            setIsInternetSheetOpen(true);
            return;
        }
        setIsVoiceModalOpen(true);
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

            <View style={styles.listHeading}>
                <AppText style={styles.listTitle}>Your tasks</AppText>
                <AppText style={styles.taskCount}>{items.length}</AppText>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryRow}
            >
                {sectionOrder.map(category => {
                    const isSelected = selectedCategory === category;
                    return (
                        <AppButton
                            key={category}
                            style={[styles.categoryButton, isSelected && styles.selectedCategoryButton]}
                            onPress={() => setSelectedCategory(category)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected }}
                        >
                            <AppText style={[styles.categoryText, isSelected && styles.selectedCategoryText]}>
                                {category} ({categoryCounts.get(category) ?? 0})
                            </AppText>
                        </AppButton>
                    );
                })}
            </ScrollView>

            {loading ? <AppText style={styles.emptyText}>Loading tasks…</AppText> : null}
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
                    extraData={items}
                    keyExtractor={task => `${task.id}-${task.isCompleted ? 'completed' : 'active'}`}
                    renderItem={({ item, section }) => (
                        <TaskCard
                            task={item}
                            dateLabel={section.title}
                            onPress={task => navigation.navigate('TaskDetails', { taskId: task.id })}
                            onComplete={handleCompleteTask}
                            onEdit={setEditingTask}
                            onDelete={task => void deleteTask(task)}
                        />
                    )}
                    renderSectionHeader={({ section }) => (
                        <AppText style={styles.sectionTitle}>{section.title}</AppText>
                    )}
                    ListHeaderComponent={renderListHeader()}
                    ListEmptyComponent={
                        loading ? <View /> : (
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


            <AppButton
                style={[
                    styles.floatingVoiceButton,
                    { bottom: insets.bottom + RH(taskTheme.spacing.xl) },
                ]}
                onPress={handleVoicePress}
                accessibilityRole="button"
                accessibilityLabel="Create tasks by voice"
            >
                <FontAwesome5 name="microphone" size={RS(26)} color="white" />
            </AppButton>

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
            <VoiceTaskReviewModal
                visible={isVoiceModalOpen}
                onClose={() => setIsVoiceModalOpen(false)}
                onConfirm={handleConfirmVoiceTasks}
            />
            <InternetRequiredSheet
                visible={isInternetSheetOpen}
                onClose={() => setIsInternetSheetOpen(false)}
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
    categoryScroll: {
        marginHorizontal: -RW(taskTheme.spacing.xl),
    },
    categoryRow: {
        gap: RW(taskTheme.spacing.sm),
        paddingBottom: RH(taskTheme.spacing.sm),
        paddingHorizontal: RW(taskTheme.spacing.xl),
        flexGrow: 1,
        alignItems: 'center',
    },
    categoryButton: {
        minHeight: RH(40),
        justifyContent: 'center',
        borderColor: taskTheme.colors.border,
        borderWidth: 1,
        borderRadius: RS(taskTheme.radius.lg),
        backgroundColor: taskTheme.colors.surface,
        paddingHorizontal: RW(taskTheme.spacing.md),
    },
    selectedCategoryButton: {
        borderColor: taskTheme.colors.primary,
        backgroundColor: taskTheme.colors.primary,
    },
    categoryText: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(12),
        fontWeight: '600',
    },
    selectedCategoryText: {
        color: taskTheme.colors.white,
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
    floatingVoiceButton: {
        position: 'absolute',
        right: RW(taskTheme.spacing.xl),
        width: RS(60),
        height: RS(60),
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
