import { getSupabaseClient } from '../auth/supabase';
import { ensureInternetAvailable } from '../network/internetAccess';
import { getFunctionErrorMessage } from './edgeFunctionError';

export type AiContentReportType = 'offensive' | 'inaccurate' | 'unsafe' | 'other';

export interface AiContentReportInput {
    reportType: AiContentReportType;
    summary: string;
    details?: string;
    taskId?: string | null;
    taskTitle?: string | null;
    aiOutput?: string | null;
    source?: 'app' | 'support';
    appVersion?: string | null;
    userEmail?: string | null;
}

export interface AiContentReportResponse {
    id: string;
    success: boolean;
    createdAt: string;
}

export const reportAiContent = async (
    payload: AiContentReportInput,
): Promise<AiContentReportResponse> => {
    await ensureInternetAvailable();
    const { data, error } = await getSupabaseClient().functions.invoke<AiContentReportResponse>(
        'report-ai-content',
        {
            body: {
                reportType: payload.reportType,
                summary: payload.summary.trim(),
                details: payload.details?.trim() ?? '',
                taskId: payload.taskId ?? null,
                taskTitle: payload.taskTitle ?? null,
                aiOutput: payload.aiOutput ?? null,
                source: payload.source ?? 'app',
                appVersion: payload.appVersion ?? null,
                userEmail: payload.userEmail ?? null,
            },
        },
    );

    if (error) {
        throw new Error(await getFunctionErrorMessage(
            error,
            'We could not submit that AI content report. Please try again later.',
        ));
    }

    if (!data || !data.id) {
        throw new Error('AI content report was submitted but no confirmation was returned.');
    }

    return data;
};
