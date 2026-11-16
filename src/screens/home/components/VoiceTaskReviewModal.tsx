import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Modal,
    ScrollView,
    StyleSheet,
    View,
    useWindowDimensions,
} from 'react-native';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';
import { taskTheme } from '../../../core/theme/taskTheme';
import {
    VoiceInputButton,
    type VoiceInputHandle,
} from '../../../components/VoiceInputButton';
import { extractTasksFromText } from '../taskExtractionService';
import type { ExtractedTask } from '../home.types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatTime12Hour } from '../../../core/utils/dateTime';
import { getErrorMessage } from '../../../core/utils/errorMessage';
import type { VoiceUsageDecision } from '../../../core/api/voiceUsageService';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import useSheetTransition from '../../../components/useSheetTransition';

interface VoiceTaskReviewModalProps {
    visible: boolean;
    initialReservationId: string | null;
    onReserveVoiceRequest: () => Promise<VoiceUsageDecision | null>;
    onQuotaReached: (decision: VoiceUsageDecision) => void;
    onClose: () => void;
    onConfirm: (tasks: ExtractedTask[]) => Promise<boolean>;
}


const VoiceTaskReviewModal = ({
    visible,
    initialReservationId,
    onReserveVoiceRequest,
    onQuotaReached,
    onClose,
    onConfirm,
}: VoiceTaskReviewModalProps) => {
    const insets = useSafeAreaInsets();
    const {
        mounted: modalVisible,
        backdropStyle,
        sheetStyle,
        startOpening,
    } = useSheetTransition(visible);
    const { height: windowHeight } = useWindowDimensions();
    const maxSheetHeight = Math.max(
        RH(320),
        windowHeight - insets.top - RH(taskTheme.spacing.md),
    );
    const maxTaskListHeight = Math.max(RH(120), maxSheetHeight * 0.42);
    const [tasks, setTasks] = useState<ExtractedTask[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [noActionableTasks, setNoActionableTasks] = useState(false);
    const [recordingAttempt, setRecordingAttempt] = useState(0);
    const [manualStartRequired, setManualStartRequired] = useState(false);
    const busy = isStarting || isRecording || isProcessing || isSaving;
    const voiceInput = useRef<VoiceInputHandle>(null);
    const initialReservation = useRef(initialReservationId);
    const isClosing = useRef(false);
    const [waveValues] = useState(
        () => Array.from({ length: 7 }, () => new Animated.Value(0.25)),
    );



    useEffect(() => {
        if (!isRecording) {
            waveValues.forEach(value => value.setValue(0.25));
            return;
        }

        const animations = waveValues.map((value, index) => {
            const peak = 0.45 + ((index % 3) * 0.2);
            return Animated.loop(Animated.sequence([
                Animated.timing(value, {
                    toValue: peak,
                    duration: 180 + (index % 2) * 60,
                    useNativeDriver: true,
                }),
                Animated.timing(value, {
                    toValue: 0.2,
                    duration: 220 + (index % 3) * 45,
                    useNativeDriver: true,
                }),
            ]));
        });
        animations.forEach(animation => animation.start());

        return () => animations.forEach(animation => animation.stop());
    }, [isRecording, waveValues]);




    useEffect(() => {
        if (visible) isClosing.current = false;
    }, [visible]);




    const prepareVoiceRecording = async (): Promise<string | null> => {
        if (initialReservation.current) {
            const reservationId = initialReservation.current;
            initialReservation.current = null;
            return reservationId;
        }

        try {
            const decision = await onReserveVoiceRequest();
            if (!decision) return null;
            if (!decision.allowed) {
                onQuotaReached(decision);
                return null;
            }
            if (!decision.reservationId) {
                throw new Error('The voice request reservation was missing.');
            }
            return decision.reservationId;
        } catch (reservationError) {
            setError(getErrorMessage(reservationError));
            return null;
        }
    };

    const handleTranscription = async (
        transcription: string,
        signal: AbortSignal,
        reservationId: string,
    ) => {
        setError('');
        setNoActionableTasks(false);
        const extractedTasks = await extractTasksFromText(
            transcription,
            reservationId,
            signal,
        );
        if (signal.aborted) return;
        setTasks(extractedTasks);
        setNoActionableTasks(extractedTasks.length === 0);
    };



    const handleConfirm = async () => {
        if (!tasks.length || busy) return;
        setIsSaving(true);
        setError('');
        try {
            if (await onConfirm(tasks)) {
                setTasks([]);
                onClose();
            } else {
                setError('Could not save your tasks. Please try again.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveTask = (index: number) => {
        const remainingTasks = tasks.filter((_, taskIndex) => taskIndex !== index);
        setTasks(remainingTasks);
        if (remainingTasks.length === 0) {
            setError('');
            setManualStartRequired(true);
            setRecordingAttempt(attempt => attempt + 1);
        }
    };

    const handleRetryRecording = () => {
        setError('');
        setNoActionableTasks(false);
        setManualStartRequired(false);
        setRecordingAttempt(attempt => attempt + 1);
    };

    const handleVoiceError = (message: string) => {
        setNoActionableTasks(false);
        console.error('Could not process voice input.', message);
        if (/AI request limits could not be verified|Could not verify voice request limits/i.test(message)) {
            setError('Could not verify voice request limits. Please try again shortly.');
            return;
        }
        if (/HTTP (?:429|503)|providerStatus["'\s:]+(?:429|503)|high demand|high traffic|AI is busy|temporarily unavailable|too many requests|RESOURCE_EXHAUSTED|rate.?limit/i.test(message)) {
            setError('The AI is busy right now due to high demand. Please try again in a moment.');
            return;
        }
        const isUsageLimit = /AI usage limit reached|quota exceeded|daily_(user|global)|per_minute/i
            .test(message);
        setError(isUsageLimit
            ? 'AI usage limit reached. Please try again later.'
            : "We couldn't process your request. Please try again.");
    };



    const handleClose = async () => {
        if (isSaving || isClosing.current) return;
        isClosing.current = true;
        try {
            await voiceInput.current?.cancel();
        } catch (cancelError) {
            console.error('Could not stop voice recording while closing the modal.', cancelError);
        }
        setTasks([]);
        setError('');
        setNoActionableTasks(false);
        setManualStartRequired(false);
        setRecordingAttempt(0);
        onClose();
    };



    return (
        <Modal
            visible={modalVisible}
            transparent
            animationType="none"
            onShow={startOpening}
            onRequestClose={() => undefined}
        >
            <View style={styles.backdrop}>
                <View style={StyleSheet.absoluteFill} />
                <Animated.View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, styles.dimmer, backdropStyle]}
                />
                <Animated.View
                    style={[
                        styles.sheet,
                        sheetStyle,
                        {
                            maxHeight: maxSheetHeight,
                            paddingBottom: RH(
                                tasks.length ? 10 : taskTheme.spacing.xl,
                            ) + insets.bottom,
                        },
                    ]}
                >
                    <View style={styles.heading}>
                        <View style={styles.headingCopy}>
                            <AppText style={styles.title}>Create tasks by voice</AppText>
                            <AppText style={styles.subtitle}>
                                Speak naturally. Review the tasks before adding them.
                            </AppText>
                        </View>
                        <AppButton
                            style={[styles.closeButton, isSaving && styles.disabled]}
                            onPress={handleClose}
                            disabled={isSaving}
                            accessibilityRole="button"
                            accessibilityLabel="Close voice task creation"
                        >
                            <AppText style={styles.closeText}>×</AppText>
                        </AppButton>
                    </View>

                    {tasks.length ? (
                        <>
                            <AppText style={styles.reviewTitle}>Review tasks ({tasks.length})</AppText>
                            <ScrollView
                                style={[styles.taskList, { maxHeight: maxTaskListHeight }]}
                                contentContainerStyle={styles.taskListContent}
                                keyboardShouldPersistTaps="handled"
                            >
                                {tasks.map((task, index) => (
                                    <View key={`${task.title}-${index}`} style={styles.taskCard}>
                                        <View style={styles.taskCopy}>
                                            <AppText style={styles.taskTitle}>{task.title}</AppText>
                                            {task.subtasks.map((subtask, subtaskIndex) => (
                                                <AppText
                                                    key={`${subtaskIndex}-${subtask}`}
                                                    style={styles.taskSubtask}
                                                >
                                                    • {subtask}
                                                </AppText>
                                            ))}
                                            <AppText style={styles.taskDetails}>
                                                {[
                                                    task.dueDate,
                                                    task.dueTime ? formatTime12Hour(task.dueTime) : null,
                                                ].filter(Boolean).join(' · ')}
                                            </AppText>
                                        </View>
                                        <AppButton
                                            style={styles.removeButton}
                                            onPress={() => handleRemoveTask(index)}
                                            accessibilityRole="button"
                                            accessibilityLabel={`Remove ${task.title}`}
                                        >
                                            <AppText style={styles.removeText}>×</AppText>
                                        </AppButton>
                                    </View>
                                ))}
                            </ScrollView>

                            <View style={styles.footer}>
                                <AppButton
                                    style={styles.cancelButton}
                                    onPress={handleClose}
                                    disabled={busy}
                                >
                                    <AppText style={styles.cancelText}>Cancel</AppText>
                                </AppButton>
                                <AppButton
                                    style={[
                                        styles.confirmButton,
                                        (!tasks.length || busy) && styles.disabled,
                                    ]}
                                    onPress={() => void handleConfirm()}
                                    disabled={!tasks.length || busy}
                                >
                                    <AppText style={styles.confirmText}>
                                        {isSaving ? 'Saving…' : `Add ${tasks.length} tasks`}
                                    </AppText>
                                </AppButton>
                            </View>
                        </>
                    ) : null}

                    <View
                        style={[
                            styles.voiceAction,
                            tasks.length > 0 && styles.reviewVoiceAction,
                        ]}
                    >
                        {visible ? (
                            <>
                                {isRecording ? (
                                    <View
                                        style={styles.waveform}
                                        accessibilityRole="progressbar"
                                        accessibilityLabel="Recording voice note"
                                    >
                                        {waveValues.map((value, index) => (
                                            <Animated.View
                                                key={index}
                                                style={[
                                                    styles.waveBar,
                                                    { transform: [{ scaleY: value }] },
                                                ]}
                                            />
                                        ))}
                                    </View>
                                ) : null}
                                <VoiceInputButton
                                    ref={voiceInput}
                                    key={recordingAttempt}
                                    onPrepareRecording={prepareVoiceRecording}
                                    onTranscriptionComplete={handleTranscription}
                                    onError={handleVoiceError}
                                    onProcessingChange={setIsProcessing}
                                    onRecordingChange={setIsRecording}
                                    onStartingChange={setIsStarting}
                                    autoStart={!manualStartRequired && tasks.length === 0}
                                    hideIdleButton={!manualStartRequired || tasks.length > 0}
                                    disabled={busy && !isRecording}
                                />
                            </>
                        ) : null}
                    </View>

                    {isStarting ? (
                        <AppText style={styles.status}>Starting microphone…</AppText>
                    ) : null}
                    {isProcessing ? (
                        <AppText style={styles.status}>Transcribing and preparing tasks…</AppText>
                    ) : null}
                    {error ? <AppText style={styles.error}>{error}</AppText> : null}
                    {noActionableTasks ? (
                        <View style={styles.noTasksNotice} accessibilityLiveRegion="polite">
                            <AppText style={styles.noTasksTitle}>No task found in that note</AppText>
                            <AppText style={styles.noTasksDescription}>
                                Try describing one clear action, for example: Call the dentist tomorrow.
                            </AppText>
                        </View>
                    ) : null}
                    {(error || noActionableTasks) && !busy ? (
                        <AppButton
                            style={styles.retryButton}
                            onPress={handleRetryRecording}
                            accessibilityRole="button"
                        >
                            <AppText style={styles.retryText}>
                                {noActionableTasks ? 'Record another note' : 'Try recording again'}
                            </AppText>
                        </AppButton>
                    ) : null}

                    {!tasks.length ? (
                        <AppText style={styles.emptyHint}>
                            {isRecording
                                ? 'Tap Stop recording when you are finished.'
                                : isStarting
                                    ? 'Preparing microphone…'
                                    : ''}
                        </AppText>
                    ) : null}
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
        backgroundColor: 'rgba(20, 24, 34, 0.52)',
    },
    sheet: {
        flexShrink: 1,
        borderTopLeftRadius: RS(taskTheme.radius.lg),
        borderTopRightRadius: RS(taskTheme.radius.lg),
        backgroundColor: taskTheme.colors.background,
        paddingHorizontal: RW(taskTheme.spacing.xl),
        paddingTop: RH(taskTheme.spacing.xl),
        paddingBottom: RH(taskTheme.spacing.xl),
    },
    heading: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: RW(taskTheme.spacing.md),
    },
    headingCopy: {
        flex: 1,
    },
    title: {
        color: taskTheme.colors.text,
        fontSize: RF(21),
        fontWeight: '800',
    },
    subtitle: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(14),
        lineHeight: RF(20),
        marginTop: RH(taskTheme.spacing.xs),
    },
    closeButton: {
        width: RS(36),
        height: RS(36),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(18),
        backgroundColor: taskTheme.colors.surface,
    },
    closeText: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(25),
        lineHeight: RF(28),
    },
    voiceAction: {
        minHeight: RH(56),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: RH(taskTheme.spacing.lg),
    },
    reviewVoiceAction: {
        minHeight: 0,
        marginTop: 0,
    },
    waveform: {
        height: RH(48),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: RW(taskTheme.spacing.xs),
        paddingHorizontal: RW(taskTheme.spacing.md),
        borderRadius: RS(taskTheme.radius.lg),
        backgroundColor: taskTheme.colors.surface,
    },
    waveBar: {
        width: RW(4),
        height: RH(32),
        borderRadius: RS(2),
        backgroundColor: taskTheme.colors.primary,
    },
    status: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(14),
        marginTop: RH(taskTheme.spacing.md),
    },
    error: {
        color: taskTheme.colors.danger,
        fontSize: RF(13),
        marginTop: RH(taskTheme.spacing.md),
    },
    noTasksNotice: {
        marginTop: RH(taskTheme.spacing.md),
        padding: RS(taskTheme.spacing.md),
        borderRadius: RS(taskTheme.radius.md),
        borderWidth: 1,
        borderColor: taskTheme.colors.border,
        backgroundColor: taskTheme.colors.surface,
    },
    noTasksTitle: {
        color: taskTheme.colors.text,
        fontSize: RF(14),
        fontWeight: '700',
    },
    noTasksDescription: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(13),
        lineHeight: RF(19),
        marginTop: RH(taskTheme.spacing.xs),
    },
    retryButton: {
        alignSelf: 'flex-start',
        marginTop: RH(taskTheme.spacing.sm),
        paddingVertical: RH(taskTheme.spacing.sm),
        paddingHorizontal: RW(taskTheme.spacing.md),
        borderRadius: RS(taskTheme.radius.sm),
        backgroundColor: taskTheme.colors.primary,
    },
    retryText: {
        color: taskTheme.colors.white,
        fontSize: RF(13),
        fontWeight: '700',
    },
    emptyHint: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(14),
        marginTop: RH(taskTheme.spacing.lg),
    },
    reviewTitle: {
        color: taskTheme.colors.text,
        fontSize: RF(16),
        fontWeight: '700',
        marginTop: RH(taskTheme.spacing.xl),
    },
    taskList: {
        flexGrow: 0,
        flexShrink: 1,
        marginTop: RH(taskTheme.spacing.sm),
    },
    taskListContent: {
        gap: RH(taskTheme.spacing.sm),
        paddingBottom: RH(taskTheme.spacing.xs),
    },
    taskCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: RW(taskTheme.spacing.sm),
        borderWidth: 1,
        borderColor: taskTheme.colors.border,
        borderRadius: RS(taskTheme.radius.md),
        backgroundColor: taskTheme.colors.surface,
        padding: RS(taskTheme.spacing.md),
    },
    taskCopy: {
        flex: 1,
        gap: RH(taskTheme.spacing.xs),
    },
    taskTitle: {
        color: taskTheme.colors.text,
        fontSize: RF(15),
        fontWeight: '700',
    },
    taskSubtask: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(13),
        lineHeight: RF(18),
    },
    taskDetails: {
        color: taskTheme.colors.primary,
        fontSize: RF(12),
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    removeButton: {
        width: RS(32),
        height: RS(32),
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeText: {
        color: taskTheme.colors.danger,
        fontSize: RF(24),
        lineHeight: RF(27),
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: RW(taskTheme.spacing.sm),
        marginTop: RH(taskTheme.spacing.lg),
    },
    cancelButton: {
        minHeight: RH(48),
        justifyContent: 'center',
        paddingHorizontal: RW(taskTheme.spacing.lg),
    },
    cancelText: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(14),
        fontWeight: '600',
    },
    confirmButton: {
        minHeight: RH(48),
        justifyContent: 'center',
        borderRadius: RS(taskTheme.radius.sm),
        backgroundColor: taskTheme.colors.primary,
        paddingHorizontal: RW(taskTheme.spacing.lg),
    },
    confirmText: {
        color: taskTheme.colors.white,
        fontSize: RF(14),
        fontWeight: '700',
    },
    disabled: {
        opacity: 0.55,
    },
});

export default VoiceTaskReviewModal;
