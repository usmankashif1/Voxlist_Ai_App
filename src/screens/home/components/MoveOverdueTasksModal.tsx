import React, { useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import DateTimePicker, {
    DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import useSheetTransition from '../../../components/useSheetTransition';
import { taskTheme } from '../../../core/theme/taskTheme';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';

type Destination = 'today' | 'tomorrow' | 'upcoming' | 'custom-date';

interface MoveOverdueTasksModalProps {
    visible: boolean;
    selectedCount: number;
    moving: boolean;
    onCancel: () => void;
    onMove: (dueDate: string | null) => Promise<boolean>;
}

const getDateAfterDays = (days: number): Date => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return date;
};

const formatDateValue = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const formatDateLabel = (date: Date): string => date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});

const MoveOverdueTasksModal = ({
    visible,
    selectedCount,
    moving,
    onCancel,
    onMove,
}: MoveOverdueTasksModalProps) => {
    const insets = useSafeAreaInsets();
    const {
        mounted,
        backdropStyle,
        sheetStyle,
        startOpening,
    } = useSheetTransition(visible, 20);
    const [destination, setDestination] = useState<Destination>('today');
    const [upcomingDate, setUpcomingDate] = useState(() => getDateAfterDays(2));
    const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
    const [error, setError] = useState('');

    const handleShow = () => {
        setDestination('today');
        setUpcomingDate(getDateAfterDays(2));
        setIsDatePickerVisible(false);
        setError('');
        startOpening();
    };

    const handleDestinationPress = (nextDestination: Destination) => {
        setError('');
        setDestination(nextDestination);
        if (nextDestination !== 'custom-date') {
            setIsDatePickerVisible(false);
            return;
        }

        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value: upcomingDate,
                mode: 'date',
                minimumDate: getDateAfterDays(2),
                onValueChange: (_event, date) => setUpcomingDate(date),
            });
        } else {
            setIsDatePickerVisible(true);
        }
    };

    const handleCancel = () => {
        if (moving) return;
        setIsDatePickerVisible(false);
        setError('');
        onCancel();
    };

    const handleMove = async () => {
        if (moving || selectedCount === 0) return;
        setError('');
        const dueDate = destination === 'upcoming'
            ? null
            : destination === 'today'
                ? formatDateValue(new Date())
                : destination === 'tomorrow'
                    ? formatDateValue(getDateAfterDays(1))
                    : formatDateValue(upcomingDate);

        try {
            if (!await onMove(dueDate)) {
                setError('Could not move the selected tasks. Please try again.');
            }
        } catch (moveError) {
            console.error('Could not move selected overdue tasks.', moveError);
            setError('Could not move the selected tasks. Please try again.');
        }
    };

    const options: { value: Destination; label: string }[] = [
        { value: 'today', label: 'Today' },
        { value: 'tomorrow', label: 'Tomorrow' },
        { value: 'upcoming', label: 'Upcoming' },
        { value: 'custom-date', label: 'Custom date' },
    ];

    return (
        <Modal
            visible={mounted}
            transparent
            animationType="none"
            onShow={handleShow}
            onRequestClose={handleCancel}
        >
            <View style={styles.backdrop}>
                <Animated.View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, styles.dimmer, backdropStyle]}
                />
                <Animated.View
                    style={[
                        styles.card,
                        sheetStyle,
                        { paddingBottom: RS(taskTheme.spacing.xl) + insets.bottom },
                    ]}
                >
                    <AppText style={styles.title}>Move selected tasks</AppText>
                    <AppText style={styles.description}>
                        Choose where to move {selectedCount} overdue {selectedCount === 1 ? 'task' : 'tasks'}.
                    </AppText>

                    <ScrollView
                        style={styles.options}
                        contentContainerStyle={styles.optionList}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.optionRow}>
                            {options.map(option => {
                                const isSelected = destination === option.value;
                                return (
                                    <AppButton
                                        key={option.value}
                                        style={[
                                            styles.optionButton,
                                            isSelected && styles.selectedOptionButton,
                                        ]}
                                        onPress={() => handleDestinationPress(option.value)}
                                        disabled={moving}
                                        accessibilityRole="radio"
                                        accessibilityState={{ selected: isSelected }}
                                    >
                                        <AppText
                                            style={[
                                                styles.optionText,
                                                isSelected && styles.selectedOptionText,
                                            ]}
                                        >
                                            {option.label}
                                        </AppText>
                                        {option.value === 'upcoming' ? (
                                            <AppText
                                                style={[
                                                    styles.dateText,
                                                    isSelected && styles.selectedOptionText,
                                                ]}
                                            >
                                                No date yet
                                            </AppText>
                                        ) : null}
                                        {option.value === 'custom-date' && isSelected ? (
                                            <AppText
                                                style={[
                                                    styles.dateText,
                                                    styles.selectedOptionText,
                                                ]}
                                            >
                                                {formatDateLabel(upcomingDate)}
                                            </AppText>
                                        ) : null}
                                    </AppButton>
                                );
                            })}
                        </View>

                        {Platform.OS === 'ios'
                            && destination === 'custom-date'
                            && isDatePickerVisible ? (
                                <View style={styles.datePicker}>
                                    <DateTimePicker
                                        value={upcomingDate}
                                        mode="date"
                                        display="spinner"
                                        minimumDate={getDateAfterDays(2)}
                                        onValueChange={(_event, date) => setUpcomingDate(date)}
                                        themeVariant="light"
                                    />
                                    <AppButton
                                        style={styles.doneButton}
                                        onPress={() => setIsDatePickerVisible(false)}
                                    >
                                        <AppText style={styles.doneText}>Done</AppText>
                                    </AppButton>
                                </View>
                            ) : null}
                    </ScrollView>

                    {error ? <AppText style={styles.error}>{error}</AppText> : null}

                    <View style={styles.actions}>
                        <AppButton
                            style={styles.cancelButton}
                            onPress={handleCancel}
                            disabled={moving}
                        >
                            <AppText style={styles.cancelText}>Cancel</AppText>
                        </AppButton>
                        <AppButton
                            style={[styles.moveButton, moving && styles.disabledButton]}
                            onPress={() => void handleMove()}
                            disabled={moving || selectedCount === 0}
                        >
                            {moving ? (
                                <ActivityIndicator color={taskTheme.colors.white} />
                            ) : (
                                <AppText style={styles.moveText}>Move tasks</AppText>
                            )}
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
        padding: RW(taskTheme.spacing.xl),
    },
    dimmer: {
        backgroundColor: 'rgba(24, 28, 38, 0.45)',
    },
    card: {
        width: '100%',
        maxWidth: RS(420),
        maxHeight: '85%',
        backgroundColor: taskTheme.colors.surface,
        borderRadius: RS(taskTheme.radius.lg),
        padding: RS(taskTheme.spacing.xl),
    },
    title: {
        color: taskTheme.colors.text,
        fontSize: RF(18),
        fontWeight: '700',
    },
    description: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(14),
        lineHeight: RF(20),
        marginTop: RH(taskTheme.spacing.sm),
    },
    options: {
        flexGrow: 0,
        marginTop: RH(taskTheme.spacing.lg),
    },
    optionList: {
        gap: RH(taskTheme.spacing.sm),
    },
    optionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: RW(taskTheme.spacing.sm),
    },
    optionButton: {
        minHeight: RH(48),
        flexGrow: 1,
        flexBasis: '46%',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: taskTheme.colors.border,
        borderRadius: RS(taskTheme.radius.md),
        paddingHorizontal: RW(taskTheme.spacing.md),
        paddingVertical: RH(taskTheme.spacing.sm),
    },
    selectedOptionButton: {
        borderColor: taskTheme.colors.primary,
        backgroundColor: taskTheme.colors.primary,
    },
    optionText: {
        color: taskTheme.colors.text,
        fontSize: RF(14),
        fontWeight: '600',
    },
    selectedOptionText: {
        color: taskTheme.colors.white,
    },
    dateText: {
        fontSize: RF(11),
        marginTop: RH(taskTheme.spacing.xs),
    },
    datePicker: {
        alignItems: 'center',
    },
    doneButton: {
        paddingHorizontal: RW(taskTheme.spacing.md),
        paddingVertical: RH(taskTheme.spacing.xs),
    },
    doneText: {
        color: taskTheme.colors.primary,
        fontSize: RF(14),
        fontWeight: '700',
    },
    error: {
        color: taskTheme.colors.danger,
        fontSize: RF(13),
        lineHeight: RF(19),
        marginTop: RH(taskTheme.spacing.md),
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: RW(taskTheme.spacing.sm),
        marginTop: RH(taskTheme.spacing.xl),
    },
    cancelButton: {
        minHeight: RH(44),
        justifyContent: 'center',
        paddingHorizontal: RW(taskTheme.spacing.md),
    },
    cancelText: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(14),
        fontWeight: '600',
    },
    moveButton: {
        minHeight: RH(44),
        minWidth: RW(112),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(taskTheme.radius.sm),
        backgroundColor: taskTheme.colors.primary,
        paddingHorizontal: RW(taskTheme.spacing.lg),
    },
    moveText: {
        color: taskTheme.colors.white,
        fontSize: RF(14),
        fontWeight: '700',
    },
    disabledButton: {
        opacity: 0.55,
    },
});

export default MoveOverdueTasksModal;
