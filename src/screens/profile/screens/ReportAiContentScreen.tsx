import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import BackButton from '../../../components/BackButton';
import { reportAiContent, type AiContentReportType } from '../../../core/api/aiContentReportService';
import { getErrorMessage } from '../../../core/utils/errorMessage';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';
import { taskTheme } from '../../../core/theme/taskTheme';

const reportTypes: { value: AiContentReportType; label: string }[] = [
    { value: 'inaccurate', label: 'Inaccurate' },
    { value: 'offensive', label: 'Offensive' },
    { value: 'unsafe', label: 'Unsafe' },
    { value: 'other', label: 'Other' },
];

const ReportAiContentScreen = () => {
    const navigation = useNavigation<NavigationProp<ParamListBase>>();
    const [reportType, setReportType] = useState<AiContentReportType>('inaccurate');
    const [summary, setSummary] = useState('');
    const [details, setDetails] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        const trimmedSummary = summary.trim();
        if (!trimmedSummary) {
            setError('Enter a short summary of the issue.');
            return;
        }

        setIsSubmitting(true);
        setError('');
        try {
            await reportAiContent({
                reportType,
                summary: trimmedSummary,
                details: details.trim(),
                source: 'app',
            });
            Alert.alert(
                'Report submitted',
                'Thank you. Your report has been saved for review.',
                [{ text: 'OK', onPress: () => navigation.goBack() }],
            );
        } catch (submitError) {
            setError(getErrorMessage(submitError));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoiding}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    <BackButton
                        label="Back"
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    />
                    <AppText style={styles.title}>Report AI content</AppText>
                    <AppText style={styles.description}>
                        Tell us about an AI-generated result that was inaccurate, offensive, unsafe, or otherwise problematic.
                    </AppText>

                    <AppText style={styles.label}>Report type</AppText>
                    <View style={styles.typeOptions}>
                        {reportTypes.map(option => {
                            const selected = reportType === option.value;
                            return (
                                <AppButton
                                    key={option.value}
                                    style={[styles.typeOption, selected && styles.selectedTypeOption]}
                                    onPress={() => setReportType(option.value)}
                                    disabled={isSubmitting}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected }}
                                >
                                    <AppText style={[
                                        styles.typeOptionText,
                                        selected && styles.selectedTypeOptionText,
                                    ]}>
                                        {option.label}
                                    </AppText>
                                </AppButton>
                            );
                        })}
                    </View>

                    <AppText style={styles.label}>Short summary</AppText>
                    <TextInput
                        style={styles.input}
                        value={summary}
                        onChangeText={setSummary}
                        placeholder="What went wrong?"
                        placeholderTextColor={taskTheme.colors.textSecondary}
                        maxLength={140}
                        editable={!isSubmitting}
                        accessibilityLabel="Short summary"
                        returnKeyType="next"
                    />

                    <AppText style={styles.label}>Details (optional)</AppText>
                    <TextInput
                        style={[styles.input, styles.detailsInput]}
                        value={details}
                        onChangeText={setDetails}
                        placeholder="Add context that will help us review the issue."
                        placeholderTextColor={taskTheme.colors.textSecondary}
                        maxLength={4000}
                        multiline
                        textAlignVertical="top"
                        editable={!isSubmitting}
                        accessibilityLabel="Report details"
                    />

                    {error ? <AppText style={styles.error}>{error}</AppText> : null}

                    <AppButton
                        style={[styles.submitButton, isSubmitting && styles.disabledButton]}
                        onPress={handleSubmit}
                        disabled={isSubmitting || !summary.trim()}
                        accessibilityRole="button"
                    >
                        {isSubmitting
                            ? <ActivityIndicator color={taskTheme.colors.white} />
                            : <AppText style={styles.submitButtonText}>Submit report</AppText>}
                    </AppButton>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: taskTheme.colors.background,
    },
    keyboardAvoiding: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: RW(taskTheme.spacing.xl),
        paddingBottom: RH(taskTheme.spacing.xxl),
    },
    backButton: {
        marginBottom: RH(taskTheme.spacing.md),
    },
    title: {
        color: taskTheme.colors.text,
        fontSize: RF(27),
        fontWeight: '800',
        marginBottom: RH(taskTheme.spacing.sm),
    },
    description: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(14),
        lineHeight: RF(20),
        marginBottom: RH(taskTheme.spacing.xl),
    },
    label: {
        color: taskTheme.colors.text,
        fontSize: RF(14),
        fontWeight: '700',
        marginBottom: RH(taskTheme.spacing.sm),
        marginTop: RH(taskTheme.spacing.md),
    },
    typeOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: RW(taskTheme.spacing.sm),
    },
    typeOption: {
        minHeight: RH(40),
        justifyContent: 'center',
        paddingHorizontal: RW(taskTheme.spacing.md),
        borderWidth: 1,
        borderColor: taskTheme.colors.border,
        borderRadius: RS(taskTheme.radius.md),
        backgroundColor: taskTheme.colors.surface,
    },
    selectedTypeOption: {
        borderColor: taskTheme.colors.primary,
        backgroundColor: taskTheme.colors.primary,
    },
    typeOptionText: {
        color: taskTheme.colors.text,
        fontSize: RF(13),
        fontWeight: '600',
    },
    selectedTypeOptionText: {
        color: taskTheme.colors.white,
    },
    input: {
        minHeight: RH(52),
        borderColor: taskTheme.colors.border,
        borderWidth: 1,
        borderRadius: RS(taskTheme.radius.md),
        backgroundColor: taskTheme.colors.surface,
        color: taskTheme.colors.text,
        fontSize: RF(15),
        paddingHorizontal: RW(taskTheme.spacing.lg),
    },
    detailsInput: {
        minHeight: RH(150),
        paddingTop: RH(taskTheme.spacing.md),
        paddingBottom: RH(taskTheme.spacing.md),
    },
    error: {
        color: taskTheme.colors.danger,
        fontSize: RF(13),
        lineHeight: RF(19),
        marginTop: RH(taskTheme.spacing.md),
    },
    submitButton: {
        minHeight: RH(52),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(taskTheme.radius.md),
        backgroundColor: taskTheme.colors.primary,
        marginTop: RH(taskTheme.spacing.xl),
    },
    disabledButton: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: taskTheme.colors.white,
        fontSize: RF(15),
        fontWeight: '700',
    },
});

export default ReportAiContentScreen;
