import { getSupabaseClient } from '../auth/supabase';
import { ensureInternetAvailable } from '../network/internetAccess';
import { getFunctionErrorMessage } from './edgeFunctionError';

export type VoiceUsageReason = 'daily_global' | 'daily_user' | 'per_minute';

export interface VoiceUsageDecision {
    allowed: boolean;
    reason: VoiceUsageReason | null;
    reservationId: string | null;
    dailyCount: number;
    dailyLimit: number;
    minuteCount: number;
    minuteLimit: number;
    globalCount: number;
    globalLimit: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isVoiceUsageReason = (value: unknown): value is VoiceUsageReason =>
    value === 'daily_global' || value === 'daily_user' || value === 'per_minute';

const isUuid = (value: unknown): value is string =>
    typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const isVoiceUsageDecision = (value: unknown): value is VoiceUsageDecision =>
    isRecord(value)
    && typeof value.allowed === 'boolean'
    && (value.reason === null || isVoiceUsageReason(value.reason))
    && (value.reservationId === null || isUuid(value.reservationId))
    && typeof value.dailyCount === 'number'
    && Number.isInteger(value.dailyCount)
    && typeof value.dailyLimit === 'number'
    && Number.isInteger(value.dailyLimit)
    && typeof value.minuteCount === 'number'
    && Number.isInteger(value.minuteCount)
    && typeof value.minuteLimit === 'number'
    && Number.isInteger(value.minuteLimit)
    && typeof value.globalCount === 'number'
    && Number.isInteger(value.globalCount)
    && typeof value.globalLimit === 'number'
    && Number.isInteger(value.globalLimit)
    && (value.allowed
        ? isUuid(value.reservationId) && value.reason === null
        : value.reservationId === null && isVoiceUsageReason(value.reason));

export const reserveVoiceRequest = async (): Promise<VoiceUsageDecision> => {
    await ensureInternetAvailable();
    const { data, error } = await getSupabaseClient().functions.invoke<unknown>(
        'ai-proxy',
        { body: { action: 'reserve-voice-request' } },
    );

    if (error) {
        throw new Error(await getFunctionErrorMessage(
            error,
            'Could not verify voice request limits.',
        ));
    }

    if (!isVoiceUsageDecision(data)) {
        console.error('Voice usage reservation returned an invalid response.', data);
        throw new Error('Could not verify voice request limits. Please try again shortly.');
    }

    return data;
};

export const getVoiceUsageLimitNotice = (
    decision: VoiceUsageDecision,
): { title: string; message: string } => {
    switch (decision.reason) {
        case 'daily_global':
            return {
                title: "Today's voice limit is used",
                message: `${decision.globalCount}/${decision.globalLimit} requests used today across the app. Please try again tomorrow.`,
            };
        case 'daily_user':
            return {
                title: "Today's voice limit is used",
                message: `${decision.dailyCount}/${decision.dailyLimit} requests used today. Please try again tomorrow.`,
            };
        case 'per_minute':
            return {
                title: 'Please wait a moment',
                message: `${decision.minuteCount}/${decision.minuteLimit} requests used this minute. Try again in a minute.`,
            };
        default:
            throw new Error('A voice usage limit notice requires a denied decision.');
    }
};
