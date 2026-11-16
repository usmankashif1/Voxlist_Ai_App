import { generateTaskCandidates } from '../../core/api/geminiClient';
import { getCurrentDateTimeContext } from '../../core/utils/dateTime';
import type { ExtractedTask } from './home.types';
import { validateExtractedTasks } from './taskValidation';

export const extractTasksFromText = async (
    transcription: string,
    reservationId: string,
    signal?: AbortSignal,
): Promise<ExtractedTask[]> => {
    const currentDateTime = getCurrentDateTimeContext();
    const candidates = await generateTaskCandidates(
        transcription,
        currentDateTime,
        reservationId,
        signal,
    );
    return validateExtractedTasks(candidates);
};
