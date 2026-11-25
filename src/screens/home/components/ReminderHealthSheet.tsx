import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    AppState,
    Animated,
    Modal,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import useSheetTransition from '../../../components/useSheetTransition';
import {
    getReminderHealthStatus,
    type ReminderHealthStatus,
    type ReminderStepState,
} from '../../../core/reminderHealth/reminderHealth';
import { getBrandGuide } from '../../../core/reminderHealth/brandGuides';
import {
    openAppNotificationSettings,
    openBatteryOptimizationSettings,
    openExactAlarmSettings,
    openOemAutostartSettings,
} from '../../../core/notifications/reminderStatus';
import {
    getHasReviewedBrandGuidance,
    setHasReviewedBrandGuidance,
} from '../../../core/storage/onboardingStorage';
import { taskTheme } from '../../../core/theme/taskTheme';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';

interface ReminderHealthSheetProps {
    visible: boolean;
    onClose: () => void;
    onDontRemindAgain: () => void;
}

interface HealthCardProps {
    title: string;
    detail: string;
    state: ReminderStepState;
    statusLabel: string;
    actionLabel?: string;
    actionBusy?: boolean;
    onAction?: () => void;
    children?: React.ReactNode;
}

const stateIcon = (state: ReminderStepState): keyof typeof Ionicons.glyphMap => {
    if (state === 'on') return 'checkmark-circle';
    if (state === 'off') return 'alert-circle';
    return 'help-circle';
};

const HealthCard = ({
    title,
    detail,
    state,
    statusLabel,
    actionLabel,
    actionBusy = false,
    onAction,
    children,
}: HealthCardProps) => {
    const [expanded, setExpanded] = useState(state !== 'on');

    return (
        <View style={[styles.card, state === 'on' && styles.cardReady]}>
            <AppButton
                style={styles.cardHeading}
                onPress={() => setExpanded(current => !current)}
                accessibilityRole="button"
                accessibilityLabel={`${title}, ${statusLabel}`}
                accessibilityState={{ expanded }}
            >
                <View style={styles.cardTitleGroup}>
                    <Ionicons
                        name={stateIcon(state)}
                        size={RS(21)}
                        color={state === 'on'
                            ? taskTheme.colors.success
                            : taskTheme.colors.warning}
                    />
                    <AppText style={styles.cardTitle}>{title}</AppText>
                </View>
                <View style={styles.statusGroup}>
                    <AppText
                        style={[
                            styles.status,
                            state === 'on' && styles.statusReady,
                            state !== 'on' && styles.statusAttention,
                        ]}
                    >
                        {statusLabel}
                    </AppText>
                    <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={RS(17)}
                        color={taskTheme.colors.textSecondary}
                    />
                </View>
            </AppButton>
            {expanded ? (
                <View style={styles.cardBody}>
                    <AppText style={styles.detail}>{detail}</AppText>
                    {children}
                    {actionLabel && onAction && state !== 'on' ? (
                        <AppButton
                            style={styles.actionButton}
                            onPress={onAction}
                            disabled={actionBusy}
                            accessibilityRole="button"
                        >
                            {actionBusy
                                ? <ActivityIndicator size="small" color={taskTheme.colors.primary} />
                                : <AppText style={styles.actionText}>{actionLabel}</AppText>}
                        </AppButton>
                    ) : null}
                </View>
            ) : null}
        </View>
    );
};

const getStatusLabel = (state: ReminderStepState, readyLabel = 'Ready'): string => {
    if (state === 'on') return readyLabel;
    if (state === 'off') return 'Needs attention';
    return "Can't check";
};

const getDetail = (state: ReminderStepState, readyDetail: string, offDetail: string): string => {
    if (state === 'on') return readyDetail;
    if (state === 'off') return offDetail;
    return 'We couldn’t check this setting. Open your device settings to review it.';
};

const ReminderHealthSheet = ({
    visible,
    onClose,
    onDontRemindAgain,
}: ReminderHealthSheetProps) => {
    const insets = useSafeAreaInsets();
    const {
        mounted,
        backdropStyle,
        sheetStyle,
        startOpening,
    } = useSheetTransition(visible, 36);
    const [status, setStatus] = useState<ReminderHealthStatus | null>(null);
    const [brandGuidanceReviewed, setBrandGuidanceReviewed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [busyAction, setBusyAction] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const refresh = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [nextStatus, isBrandGuidanceReviewed] = await Promise.all([
                getReminderHealthStatus(),
                getHasReviewedBrandGuidance(),
            ]);
            setStatus(nextStatus);
            setBrandGuidanceReviewed(isBrandGuidanceReviewed);
        } catch (refreshError) {
            console.error('Could not read reminder health settings.', refreshError);
            setError('Could not check reminder settings. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!visible) return undefined;
        const frame = requestAnimationFrame(() => {
            void refresh();
        });
        return () => cancelAnimationFrame(frame);
    }, [refresh, visible]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', state => {
            if (visible && state === 'active') {
                void refresh();
            }
        });
        return () => subscription.remove();
    }, [refresh, visible]);

    const runAction = async (
        actionName: string,
        action: () => Promise<void | { opened: boolean }>,
    ) => {
        if (busyAction) return;
        setBusyAction(actionName);
        setError('');
        setMessage('');
        try {
            const result = await action();
            if (result && !result.opened) {
                setMessage('Could not open device settings. Open Settings and search for the option shown here.');
            }
            await refresh();
        } catch (actionError) {
            console.error(`Could not open ${actionName} settings.`, actionError);
            setError('Could not open settings. Try again from your device settings.');
        } finally {
            setBusyAction('');
        }
    };

    const markBrandGuidanceReviewed = async () => {
        try {
            await setHasReviewedBrandGuidance();
            setBrandGuidanceReviewed(true);
        } catch (saveError) {
            console.error('Could not save device settings review.', saveError);
            setError('Could not save your review. Please try again.');
        }
    };

    const brandGuide = status ? getBrandGuide(status.deviceInfo) : null;
    const checklistStates = status
        ? [
            ...(status.notificationsApplicable ? [status.notifications] : []),
            ...(status.exactAlarmsApplicable ? [status.exactAlarms] : []),
            status.batteryActivity,
            ...(brandGuide ? [brandGuidanceReviewed ? 'on' as const : 'unknown' as const] : []),
        ]
        : [];
    const completedCount = checklistStates.filter(state => state === 'on').length;
    const totalCount = checklistStates.length;
    const allSet = totalCount > 0 && completedCount === totalCount;

    return (
        <Modal
            visible={visible || mounted}
            transparent
            animationType="none"
            onShow={startOpening}
            onRequestClose={onClose}
        >
            <Animated.View style={[styles.backdrop, backdropStyle]}>
                <AppButton
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close task reminder settings"
                />
                <Animated.View
                    style={[
                        styles.sheet,
                        { paddingBottom: Math.max(insets.bottom, RH(taskTheme.spacing.md)) },
                        sheetStyle,
                    ]}
                >
                    <View style={styles.header}>
                        <View style={styles.headerCopy}>
                            <AppText style={styles.title}>Fix task reminder issues</AppText>
                            <AppText style={styles.subtitle}>
                                A quick check of settings that can affect when your reminders arrive.
                            </AppText>
                        </View>
                        <AppButton
                            style={styles.closeButton}
                            onPress={onClose}
                            accessibilityRole="button"
                            accessibilityLabel="Close"
                        >
                            <Ionicons name="close" size={RS(22)} color={taskTheme.colors.text} />
                        </AppButton>
                    </View>

                    {status ? (
                        <View style={styles.progress}>
                            <View style={styles.progressCopy}>
                                <AppText style={styles.progressTitle}>
                                    {allSet ? "You're all set" : 'Your reminder checklist'}
                                </AppText>
                                <AppText style={styles.progressDetail}>
                                    {allSet
                                        ? 'Your device settings look ready for reminders.'
                                        : `${completedCount} of ${totalCount} checks ready`}
                                </AppText>
                            </View>
                            <Ionicons
                                name={allSet ? 'checkmark-circle' : 'notifications-outline'}
                                size={RS(25)}
                                color={allSet
                                    ? taskTheme.colors.success
                                    : taskTheme.colors.primary}
                            />
                        </View>
                    ) : null}

                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={styles.cards}
                        keyboardShouldPersistTaps="handled"
                    >
                        {loading && !status ? (
                            <ActivityIndicator
                                style={styles.loader}
                                color={taskTheme.colors.primary}
                            />
                        ) : null}
                        {status?.notificationsApplicable ? (
                            <HealthCard
                                key={`notifications-${status.notifications}`}
                                title="Notifications"
                                detail={getDetail(
                                    status.notifications,
                                    'Notifications are ready for Voxlist AI.',
                                    'Allow notifications for Voxlist AI. If they are already on, check the Task reminders category.',
                                )}
                                state={status.notifications}
                                statusLabel={getStatusLabel(status.notifications)}
                                actionLabel="Open notification settings"
                                actionBusy={busyAction === 'notifications'}
                                onAction={() => void runAction(
                                    'notification',
                                    openAppNotificationSettings,
                                )}
                            />
                        ) : null}
                        {status?.exactAlarmsApplicable ? (
                            <HealthCard
                                key={`timing-${status.exactAlarms}`}
                                title="Reminder timing"
                                detail={getDetail(
                                    status.exactAlarms,
                                    'Android can show reminders close to the time you choose.',
                                    'Allow Voxlist AI to schedule reminders at their set time. Otherwise, Android may deliver them later.',
                                )}
                                state={status.exactAlarms}
                                statusLabel={getStatusLabel(status.exactAlarms)}
                                actionLabel="Open reminder timing settings"
                                actionBusy={busyAction === 'timing'}
                                onAction={() => void runAction(
                                    'reminder timing',
                                    openExactAlarmSettings,
                                )}
                            />
                        ) : null}
                        {status ? (
                            <HealthCard
                                key={`background-${status.batteryActivity}`}
                                title="Background activity"
                                detail={getDetail(
                                    status.batteryActivity,
                                    'Android is not restricting this app’s background activity.',
                                    'Android reports that background activity may be limited. Some devices also have a separate setting for this.',
                                )}
                                state={status.batteryActivity}
                                statusLabel={getStatusLabel(status.batteryActivity, 'Allowed')}
                                actionLabel="Open background settings"
                                actionBusy={busyAction === 'background'}
                                onAction={() => void runAction(
                                    'background activity',
                                    openBatteryOptimizationSettings,
                                )}
                            />
                        ) : null}
                        {brandGuide ? (
                            <HealthCard
                                key={`device-${brandGuidanceReviewed}`}
                                title="Device-specific settings"
                                detail={`${brandGuide.label}: menu names can vary by software version. Use Settings search if a step looks different.`}
                                state={brandGuidanceReviewed ? 'on' : 'unknown'}
                                statusLabel={brandGuidanceReviewed ? 'Reviewed' : 'Not reviewed'}
                                actionLabel="Open device settings"
                                actionBusy={busyAction === 'device'}
                                onAction={() => void runAction(
                                    'device background',
                                    openOemAutostartSettings,
                                )}
                            >
                                <View style={styles.guide}>
                                    {brandGuide.steps.map((step, index) => (
                                        <View key={step} style={styles.guideStep}>
                                            <AppText style={styles.guideNumber}>{index + 1}</AppText>
                                            <AppText style={styles.guideText}>{step}</AppText>
                                        </View>
                                    ))}
                                    <AppText style={styles.searchLabel}>
                                        Settings search: {brandGuide.settingsSearchKeywords.join(', ')}
                                    </AppText>
                                    {!brandGuidanceReviewed ? (
                                        <AppButton
                                            style={styles.reviewButton}
                                            onPress={() => void markBrandGuidanceReviewed()}
                                            accessibilityRole="button"
                                        >
                                            <AppText style={styles.reviewText}>
                                                I&apos;ve checked these settings
                                            </AppText>
                                        </AppButton>
                                    ) : null}
                                </View>
                            </HealthCard>
                        ) : null}
                        {error ? <AppText style={styles.error}>{error}</AppText> : null}
                        {message ? <AppText style={styles.message}>{message}</AppText> : null}
                    </ScrollView>

                    <View style={styles.footer}>
                        <AppButton
                            style={styles.remindButton}
                            onPress={() => {
                                onDontRemindAgain();
                                onClose();
                            }}
                            accessibilityRole="button"
                        >
                        </AppButton>
                        <AppButton
                            style={styles.doneButton}
                            onPress={onClose}
                            accessibilityRole="button"
                        >
                            <AppText style={styles.doneText}>Done</AppText>
                        </AppButton>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    sheet: {
        maxHeight: '92%',
        paddingTop: RH(taskTheme.spacing.lg),
        paddingHorizontal: RW(taskTheme.spacing.xl),
        borderTopLeftRadius: RS(taskTheme.radius.lg),
        borderTopRightRadius: RS(taskTheme.radius.lg),
        backgroundColor: taskTheme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: RW(taskTheme.spacing.md),
        marginBottom: RH(taskTheme.spacing.md),
    },
    headerCopy: {
        flex: 1,
    },
    title: {
        color: taskTheme.colors.text,
        fontSize: RF(20),
        fontWeight: '800',
    },
    subtitle: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(13),
        lineHeight: RF(19),
        marginTop: RH(taskTheme.spacing.xs),
    },
    closeButton: {
        width: RS(48),
        height: RS(48),
        alignItems: 'center',
        justifyContent: 'center',
    },
    progress: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: RW(taskTheme.spacing.md),
        marginBottom: RH(taskTheme.spacing.md),
        borderRadius: RS(taskTheme.radius.md),
        backgroundColor: taskTheme.colors.surface,
        borderWidth: 1,
        borderColor: taskTheme.colors.border,
    },
    progressCopy: {
        flex: 1,
        gap: RH(2),
    },
    progressTitle: {
        color: taskTheme.colors.text,
        fontSize: RF(14),
        fontWeight: '700',
    },
    progressDetail: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(12),
    },
    scroll: {
        flexShrink: 1,
    },
    cards: {
        gap: RH(taskTheme.spacing.sm),
        paddingBottom: RH(taskTheme.spacing.md),
    },
    loader: {
        marginVertical: RH(taskTheme.spacing.xl),
    },
    card: {
        borderRadius: RS(taskTheme.radius.md),
        borderWidth: 1,
        borderColor: taskTheme.colors.border,
        backgroundColor: taskTheme.colors.surface,
    },
    cardReady: {
        backgroundColor: taskTheme.colors.surfaceMuted,
    },
    cardHeading: {
        minHeight: RH(56),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: RW(taskTheme.spacing.sm),
        paddingHorizontal: RW(taskTheme.spacing.md),
    },
    cardTitleGroup: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: RW(taskTheme.spacing.sm),
    },
    cardTitle: {
        flex: 1,
        color: taskTheme.colors.text,
        fontSize: RF(14),
        fontWeight: '700',
    },
    statusGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: RW(taskTheme.spacing.xs),
    },
    status: {
        fontSize: RF(11),
        fontWeight: '700',
    },
    statusReady: {
        color: taskTheme.colors.success,
    },
    statusAttention: {
        color: taskTheme.colors.warning,
    },
    cardBody: {
        paddingHorizontal: RW(taskTheme.spacing.md),
        paddingBottom: RH(taskTheme.spacing.md),
    },
    detail: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(12),
        lineHeight: RF(18),
    },
    actionButton: {
        minHeight: RH(48),
        alignSelf: 'flex-start',
        justifyContent: 'center',
        paddingHorizontal: RW(taskTheme.spacing.md),
        marginTop: RH(taskTheme.spacing.sm),
        borderRadius: RS(taskTheme.radius.sm),
        backgroundColor: taskTheme.colors.surfaceMuted,
    },
    actionText: {
        color: taskTheme.colors.primary,
        fontSize: RF(12),
        fontWeight: '700',
    },
    guide: {
        gap: RH(taskTheme.spacing.sm),
        marginTop: RH(taskTheme.spacing.sm),
    },
    guideStep: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: RW(taskTheme.spacing.sm),
    },
    guideNumber: {
        width: RS(22),
        height: RS(22),
        overflow: 'hidden',
        textAlign: 'center',
        textAlignVertical: 'center',
        borderRadius: RS(11),
        color: taskTheme.colors.text,
        backgroundColor: taskTheme.colors.background,
        fontSize: RF(11),
        fontWeight: '700',
    },
    guideText: {
        flex: 1,
        color: taskTheme.colors.text,
        fontSize: RF(12),
        lineHeight: RF(18),
    },
    searchLabel: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(11),
        lineHeight: RF(16),
    },
    reviewButton: {
        minHeight: RH(48),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(taskTheme.radius.sm),
        borderWidth: 1,
        borderColor: taskTheme.colors.borderStrong,
    },
    reviewText: {
        color: taskTheme.colors.text,
        fontSize: RF(12),
        fontWeight: '700',
    },
    error: {
        color: taskTheme.colors.danger,
        fontSize: RF(13),
        lineHeight: RF(18),
    },
    message: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(12),
        lineHeight: RF(18),
    },
    footer: {
        gap: RH(taskTheme.spacing.xs),
        paddingTop: RH(taskTheme.spacing.sm),
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: taskTheme.colors.border,
    },
    remindButton: {
        minHeight: RH(48),
        alignItems: 'center',
        justifyContent: 'center',
    },
    remindText: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(12),
        fontWeight: '600',
    },
    doneButton: {
        minHeight: RH(48),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(taskTheme.radius.md),
        backgroundColor: taskTheme.colors.primary,
    },
    doneText: {
        color: taskTheme.colors.white,
        fontSize: RF(14),
        fontWeight: '700',
    },
});

export default ReminderHealthSheet;
