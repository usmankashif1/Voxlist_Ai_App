import type { CurrentDateTimeContext } from '../utils/dateTime';
import { getSupabaseClient } from '../auth/supabase';
import { getFunctionErrorMessage } from './edgeFunctionError';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const parseTaskArray = (value: unknown): unknown[] | null => {
    if (Array.isArray(value)) return value;
    if (!isRecord(value)) return null;
    if (Array.isArray(value.tasks)) return value.tasks;
    if (!Array.isArray(value.candidates)) return null;

    const candidate = value.candidates[0];
    if (!isRecord(candidate) || !isRecord(candidate.content)) return null;
    if (!Array.isArray(candidate.content.parts)) return null;

    const text = candidate.content.parts
        .filter(isRecord)
        .map((part) => part.text)
        .filter((part): part is string => typeof part === 'string')
        .join('')
        .trim();
    if (!text) return null;

    const unfencedText = text.replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, '$1').trim();
    try {
        const tasks: unknown = JSON.parse(unfencedText);
        return Array.isArray(tasks) ? tasks : null;
    } catch {
        return null;
    }
};

const logUnexpectedResponse = (value: unknown, error: Error): void => {
    const candidate = isRecord(value) && Array.isArray(value.candidates)
        ? value.candidates[0]
        : undefined;
    const content = isRecord(candidate) && isRecord(candidate.content)
        ? candidate.content
        : undefined;
    const parts = content && Array.isArray(content.parts) ? content.parts : undefined;

    console.error('AI task response did not contain a task array.', error, {
        responseType: Array.isArray(value) ? 'array' : typeof value,
        responseKeys: isRecord(value) ? Object.keys(value) : [],
        candidateCount: isRecord(value) && Array.isArray(value.candidates)
            ? value.candidates.length
            : null,
        finishReason: isRecord(candidate) ? candidate.finishReason ?? null : null,
        parts: parts?.map((part) => ({
            type: typeof part,
            keys: isRecord(part) ? Object.keys(part) : [],
            textLength: isRecord(part) && typeof part.text === 'string' ? part.text.length : null,
        })) ?? null,
    });
};

export const generateTaskCandidates = async (
    transcription: string,
    currentDateTime: CurrentDateTimeContext,
    signal?: AbortSignal,
): Promise<unknown> => {
    if (!transcription.trim()) {
        throw new Error('Record or enter a note before creating tasks.');
    }

    const { data, error } = await getSupabaseClient().functions.invoke<unknown>(
        'ai-proxy',
        {
            body: {
                action: 'extract-tasks',
                transcription: transcription.trim(),
                currentDateTime,
            },
            signal,
        },
    );

    if (error) {
        if (signal?.aborted) throw error;
        throw new Error(await getFunctionErrorMessage(error, 'Gemini could not extract tasks.'));
    }
    if (!data) throw new Error('Gemini returned an empty response.');

    const tasks = parseTaskArray(data);
    if (!tasks) {
        const responseError = new Error(
            'AI returned tasks in an unexpected format. Check the device logs for response details.',
        );
        logUnexpectedResponse(data, responseError);
        throw responseError;
    }
    return tasks;
};
