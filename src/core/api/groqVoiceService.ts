import { File } from 'expo-file-system';
import { getSupabaseClient } from '../auth/supabase';
import { ensureInternetAvailable } from '../network/internetAccess';
import { getFunctionErrorMessage } from './edgeFunctionError';

interface TranscriptionResponse {
    text?: string;
    error?: {
        message?: string;
    } | string;
}

export const transcribeAudioWithGroq = async (
    audioUri: string,
    reservationId: string,
    signal?: AbortSignal,
): Promise<string> => {
    await ensureInternetAvailable();
    const formData = new FormData();
    formData.append('action', 'transcribe-audio');
    formData.append('reservationId', reservationId);
    formData.append('file', new File(audioUri), 'recording.m4a');

    const { data, error } = await getSupabaseClient().functions.invoke<TranscriptionResponse>(
        'ai-proxy',
        {
            body: formData,
            signal,
        },
    );

    if (error) {
        if (signal?.aborted) throw error;
        throw new Error(await getFunctionErrorMessage(
            error,
            'Could not transcribe the recording.',
        ));
    }
    if (!data) throw new Error('The transcription service returned an empty response.');

    if (typeof data.text !== 'string' || !data.text.trim()) {
        if (typeof data.error === 'string') throw new Error(data.error);
        if (data.error?.message) throw new Error(data.error.message);
        throw new Error('The transcription service returned an invalid response.');
    }

    return data.text;
};
