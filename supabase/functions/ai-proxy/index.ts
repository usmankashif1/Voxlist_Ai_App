import { withSupabase } from 'npm:@supabase/server@1';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

const GEMINI_ENDPOINT =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/audio/transcriptions';
const MAX_JSON_BODY_BYTES = 512_000;
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const MAX_AUDIO_REQUEST_BYTES = MAX_AUDIO_BYTES + 256_000;
const MAX_TRANSCRIPTION_LENGTH = 20_000;
const TASK_EXTRACTION_SYSTEM_PROMPT = [
    'You are a task-extraction engine. Your only job is to read a messy, informal voice transcription and output the discrete, actionable tasks it contains. You do not chat, explain, or ask questions back to the user — you only return structured data.',
    'The transcription may contain filler words, false starts, repetition, or rambling. Ignore disfluencies such as "um", "uh", "like", "you know", and ignore any sentence that is not an actionable request (e.g. "okay let me think" or "so yeah" is not a task).',
    'A task has a title and, optionally, subtasks. There is no description field — never return one.',
    'Decide task boundaries by goal, not by sentence: if the speaker mentions multiple separate, unrelated requests, return multiple top-level tasks, one per request. If the speaker spends several sentences elaborating on ONE request — giving its steps, parts, or things to remember for it — that is still a SINGLE task, and the extra detail becomes its subtasks, not a separate task and not a description.',
    'Title: a short, clear, imperative phrase (e.g. "Call mom", not "I need to call my mom later"). Strip filler words and remove any date/time phrase from the title — dates and times belong only in dueDate/dueTime, never repeated in the title text.',
    'Subtasks: an array of short imperative strings, each one concrete step or sub-item of the parent task, in the order the speaker said them. Only create subtasks when the speaker actually gave multiple distinct steps or sub-items for that one task. If the task is already clear and short on its own, return an empty array for subtasks — do not invent steps just to fill it, and do not restate the title as its own subtask.',
    'Example of the single-task-with-subtasks case: "I need to plan the birthday party, book the venue, order the cake, and send invites to everyone" is ONE task titled "Plan the birthday party" with subtasks ["Book the venue", "Order the cake", "Send invites"] — not four separate tasks.',
    'Example of the separate-tasks case: "Call mom and also pick up groceries" is TWO separate tasks, each with its own title and an empty subtasks array, because they are unrelated requests, not steps of one goal.',
    'The transcription may be in any language. Understand it fully, but always write every title and subtask in English, regardless of what language the speaker used. Translate naturally — do not produce a literal word-for-word translation, and do not leave any word in the original language.',
    'Resolve relative dates and times ("tomorrow", "in two days", "next week", "tonight") using only the provided current local date, time, and IANA timezone. Never substitute your own assumption of what "today" is.',
    'Never invent a date or time that was not stated or clearly implied by the transcription. If no date was mentioned at all, return dueDate as null. If no time was mentioned, return dueTime as null.',
    'Vague time-of-day words like "morning", "afternoon", "evening", "tonight", "later", or "soon" are not specific times, so dueTime must always be null in these cases — but they DO imply the task is for today. If the speaker uses one of these words and does not mention any other date, set dueDate to today\'s date (from the provided current local date) rather than leaving it null. If the speaker pairs the vague time word with an explicit different date (e.g. "Friday morning"), use that stated date instead of today, and dueTime still stays null.',
    'Return dueDate as YYYY-MM-DD. Return dueTime in 12-hour format as "h:mm AM/PM" (e.g. "5:00 PM", "9:30 AM") — never 24-hour format. When the speaker gives a time with no AM/PM and the hour alone doesn\'t make it obvious (e.g. "at 8"), infer the most natural meaning from context (e.g. a dinner or evening activity implies PM, a morning routine implies AM); if there is truly no way to tell, prefer the daytime interpretation (AM).',
    'When the speaker names a bare weekday with no qualifier (e.g. "Friday", "on Monday"), always resolve it — never leave dueDate null for this. If that weekday is today, use today\'s date. Otherwise use the closest upcoming occurrence within the next 7 days. Do not skip ahead to next week just because that weekday already passed earlier in the current week. Example: today is Monday and the speaker says "Friday" → use this coming Friday, 4 days away. Example: today is Saturday and the speaker says "Friday" → this week\'s Friday has passed, so use next Friday, 6 days away.',
    'When the speaker explicitly says "next <weekday>" (e.g. "next Friday"), resolve it to the occurrence AFTER the closest upcoming one — i.e. skip one extra week past the nearest occurrence described above. This is the one case where "next" adds a week; treat it consistently this way rather than flagging it as ambiguous.',
    'Reserve dateAmbiguous for cases where the transcription genuinely gives no way to pick a single date — for example a self-contradictory statement, or a reference to an event with no date information at all (not a weekday name, which is always resolvable by the rules above). In that genuine case, set dueDate to null, dateAmbiguous to true, and give a one-sentence explanation in ambiguityNote. In every other case set dateAmbiguous to false and ambiguityNote to null.',
    'A dueDate and dueTime apply to the whole task, not to individual subtasks. Do not attach separate dates to subtasks.',
    'Set reminderEnabled to true only when dueDate is not null. Set it to false when dueDate is null, since a reminder has nothing to remind about without a date.',
    'Infer priority from explicit urgency cues in the transcription (words like "urgent", "ASAP", "important", "critical", repeated emphasis, or a same-day deadline). Use "high", "medium", or "low". Default to "medium" when nothing in the transcription signals urgency — do not default every task to "high".',
    'If the transcription contains no actionable task at all, return an empty array. Do not invent a task just to produce output.',
    'Return only a JSON array matching the supplied schema. No markdown, no code fences, no commentary, no text before or after the array.',
].join(' ');

const TASK_RESPONSE_SCHEMA = {
    type: 'ARRAY',
    items: {
        type: 'OBJECT',
        properties: {
            title: { type: 'STRING' },
            subtasks: { type: 'ARRAY', items: { type: 'STRING' } },
            dueDate: { type: 'STRING', nullable: true },
            dueTime: { type: 'STRING', nullable: true },
            reminderEnabled: { type: 'BOOLEAN' },
            priority: { type: 'STRING', enum: ['high', 'medium', 'low'] },
            dateAmbiguous: { type: 'BOOLEAN' },
            ambiguityNote: { type: 'STRING', nullable: true },
        },
        required: [
            'title',
            'subtasks',
            'dueDate',
            'dueTime',
            'reminderEnabled',
            'priority',
            'dateAmbiguous',
            'ambiguityNote',
        ],
    },
};

interface DateTimeContext {
    date: string;
    time: string;
    timeZone: string;
}

interface TaskRequest {
    action: 'extract-tasks';
    transcription: string;
    currentDateTime: DateTimeContext;
    reservationId: string;
}

type VoiceUsageReason = 'daily_global' | 'daily_user' | 'per_minute';
type VoiceUsageStep = 'transcription' | 'extraction';

interface VoiceUsageDecision {
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

const jsonResponse = (body: unknown, status = 200): Response => new Response(
    JSON.stringify(body),
    {
        status,
        headers: { 'Content-Type': 'application/json' },
    },
);

const withRequestId = (response: Response, requestId: string): Response => {
    const headers = new Headers(response.headers);
    headers.set('x-ai-proxy-request-id', requestId);
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const isUuid = (value: unknown): value is string =>
    typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const isVoiceUsageReason = (value: unknown): value is VoiceUsageReason =>
    value === 'daily_global' || value === 'daily_user' || value === 'per_minute';

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

const isVoiceReservationRequest = (value: unknown): boolean =>
    isRecord(value) && value.action === 'reserve-voice-request';

const readBodyWithinLimit = async (
    request: Request,
    maxBytes: number,
): Promise<ArrayBuffer | null> => {
    if (!request.body) return new ArrayBuffer(0);

    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
            await reader.cancel();
            return null;
        }
        chunks.push(value);
    }

    const body = new ArrayBuffer(totalBytes);
    const bodyView = new Uint8Array(body);
    let offset = 0;
    for (const chunk of chunks) {
        bodyView.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return body;
};

const isTaskRequest = (value: unknown): value is TaskRequest => {
    if (!isRecord(value) || !isRecord(value.currentDateTime)) return false;
    const dateTime = value.currentDateTime;

    return value.action === 'extract-tasks'
        && typeof value.transcription === 'string'
        && value.transcription.trim().length > 0
        && value.transcription.length <= MAX_TRANSCRIPTION_LENGTH
        && typeof dateTime.date === 'string'
        && dateTime.date.length <= 10
        && typeof dateTime.time === 'string'
        && dateTime.time.length <= 8
        && typeof dateTime.timeZone === 'string'
        && isUuid(value.reservationId);
};

const parseProviderResponse = async (
    response: Response,
): Promise<{ body: unknown; rawText: string }> => {
    const rawText = await response.text();
    try {
        return { body: JSON.parse(rawText), rawText };
    } catch {
        return { body: null, rawText };
    }
};

const getProviderError = (
    body: unknown,
    rawText: string,
    fallback: string,
): { message: string; code?: string; type?: string } => {
    if (isRecord(body) && isRecord(body.error)) {
        const providerError = body.error;
        return {
            message: typeof providerError.message === 'string'
                ? providerError.message
                : fallback,
            ...(typeof providerError.code === 'string' || typeof providerError.code === 'number'
                ? { code: String(providerError.code) }
                : {}),
            ...(typeof providerError.type === 'string' ? { type: providerError.type } : {}),
        };
    }

    if (isRecord(body) && typeof body.error === 'string') {
        return { message: body.error };
    }

    return {
        message: rawText.trim().slice(0, 1200) || fallback,
    };
};

const getGeminiTasks = (body: unknown): unknown[] | null => {
    if (!isRecord(body) || !Array.isArray(body.candidates)) return null;

    const candidate = body.candidates[0];
    if (!isRecord(candidate) || !isRecord(candidate.content)) return null;
    if (!Array.isArray(candidate.content.parts)) return null;

    const text = candidate.content.parts
        .filter((part): part is Record<string, unknown> => isRecord(part))
        .map((part) => part.text)
        .filter((part): part is string => typeof part === 'string')
        .join('')
        .trim();
    if (!text) return null;

    try {
        const tasks: unknown = JSON.parse(text);
        return Array.isArray(tasks) ? tasks : null;
    } catch {
        return null;
    }
};

const logInvalidGeminiResponse = (body: unknown, requestId: string): void => {
    const candidates = isRecord(body) && Array.isArray(body.candidates)
        ? body.candidates
        : [];
    const firstCandidate = candidates[0];
    const content = isRecord(firstCandidate) && isRecord(firstCandidate.content)
        ? firstCandidate.content
        : undefined;
    const parts = content && Array.isArray(content.parts) ? content.parts : [];

    console.error('Gemini returned a successful response without a JSON task array.', {
        requestId,
        responseKeys: isRecord(body) ? Object.keys(body) : [],
        promptBlockReason: isRecord(body) && isRecord(body.promptFeedback)
            ? body.promptFeedback.blockReason ?? null
            : null,
        candidateCount: candidates.length,
        firstCandidateKeys: isRecord(firstCandidate) ? Object.keys(firstCandidate) : [],
        finishReason: isRecord(firstCandidate) ? firstCandidate.finishReason ?? null : null,
        partMetadata: parts.map(part => ({
            keys: isRecord(part) ? Object.keys(part) : [],
            textLength: isRecord(part) && typeof part.text === 'string'
                ? part.text.length
                : null,
        })),
    });
};

const reserveVoiceUsage = async (
    supabase: SupabaseClient,
    userId: string,
    isGuest: boolean,
): Promise<Response> => {
    const { data, error } = await supabase.rpc('reserve_ai_voice_request', {
        p_user_id: userId,
        p_is_guest: isGuest,
    });
    if (error) {
        console.error('Voice usage reservation failed:', error);
        return jsonResponse({
            error: {
                code: 'VOICE_USAGE_RESERVATION_FAILED',
                message: 'Could not reserve a voice request.',
            },
        }, 503);
    }

    if (!isVoiceUsageDecision(data)) {
        console.error('Voice usage reservation returned an invalid response.');
        return jsonResponse({
            error: {
                code: 'VOICE_USAGE_RESERVATION_FAILED',
                message: 'Could not reserve a voice request.',
            },
        }, 503);
    }

    return jsonResponse(data);
};

const claimVoiceStep = async (
    supabase: SupabaseClient,
    userId: string,
    reservationId: string,
    step: VoiceUsageStep,
): Promise<Response | null> => {
    const { data, error } = await supabase.rpc('claim_ai_voice_step', {
        p_user_id: userId,
        p_reservation_id: reservationId,
        p_step: step,
    });

    if (error) {
        console.error('Voice reservation validation failed:', error);
        return jsonResponse({
            error: {
                code: 'VOICE_RESERVATION_CHECK_FAILED',
                message: 'Could not verify the voice request reservation.',
            },
        }, 503);
    }

    if (data !== true) {
        return jsonResponse({
            error: {
                code: 'VOICE_RESERVATION_INVALID',
                message: 'This voice request is no longer available. Start a new voice request and try again.',
            },
        }, 403);
    }

    return null;
};

const extractTasks = async (
    request: TaskRequest,
    supabase: SupabaseClient,
    userId: string,
    signal: AbortSignal,
    requestId: string,
): Promise<Response> => {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) return jsonResponse({ error: { message: 'Gemini is not configured.' } }, 500);

    const reservationResponse = await claimVoiceStep(
        supabase,
        userId,
        request.reservationId,
        'extraction',
    );
    if (reservationResponse) return reservationResponse;

    const response = await fetch(GEMINI_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{ text: TASK_EXTRACTION_SYSTEM_PROMPT }],
            },
            contents: [{
                role: 'user',
                parts: [{
                    text: [
                        'Current local date and time context:',
                        `Date: ${request.currentDateTime.date}`,
                        `Time: ${request.currentDateTime.time}`,
                        `IANA timezone: ${request.currentDateTime.timeZone}`,
                        '',
                        'Transcription:',
                        request.transcription.trim(),
                    ].join('\n'),
                }],
            }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 5000,
                responseMimeType: 'application/json',
                responseSchema: TASK_RESPONSE_SCHEMA,
            },
        }),
        signal,
    });

    const { body, rawText } = await parseProviderResponse(response);

    if (!response.ok) {
        const providerError = getProviderError(
            body,
            rawText,
            `Gemini returned HTTP ${response.status} without an error message.`,
        );
        console.error('Gemini request failed.', {
            requestId,
            status: response.status,
            code: providerError.code ?? null,
            type: providerError.type ?? null,
            message: providerError.message,
        });
        return jsonResponse({
            error: {
                message: providerError.message,
                code: 'AI_PROVIDER_ERROR',
                provider: 'Gemini',
                providerStatus: response.status,
                providerCode: providerError.code,
                providerType: providerError.type,
            },
        }, response.status);
    }

    const tasks = getGeminiTasks(body);
    if (!tasks) {
        logInvalidGeminiResponse(body, requestId);
        const candidate = isRecord(body) && Array.isArray(body.candidates)
            ? body.candidates[0]
            : null;
        return jsonResponse({
            error: {
                message: 'Gemini returned HTTP 200 but its response did not contain a valid JSON task array.',
                code: 'INVALID_PROVIDER_RESPONSE',
                provider: 'Gemini',
                providerStatus: response.status,
                finishReason: isRecord(candidate) ? candidate.finishReason ?? null : null,
                promptBlockReason: isRecord(body) && isRecord(body.promptFeedback)
                    ? body.promptFeedback.blockReason ?? null
                    : null,
                rawResponseLength: rawText.length,
            },
        }, 502);
    }

    return jsonResponse(tasks);
};

const transcribeAudio = async (
    request: Request,
    supabase: SupabaseClient,
    userId: string,
    requestId: string,
): Promise<Response> => {
    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) return jsonResponse({ error: { message: 'Groq is not configured.' } }, 500);

    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > MAX_AUDIO_REQUEST_BYTES) {
        return jsonResponse({ error: { message: 'The recording exceeds the 25 MB limit.' } }, 413);
    }

    const requestBody = await readBodyWithinLimit(request, MAX_AUDIO_REQUEST_BYTES);
    if (!requestBody) {
        return jsonResponse({ error: { message: 'The recording exceeds the 25 MB limit.' } }, 413);
    }

    let formData: FormData;
    try {
        const boundedRequest = new Request(request.url, {
            method: request.method,
            headers: request.headers,
            body: requestBody,
        });
        formData = await boundedRequest.formData();
    } catch {
        return jsonResponse({ error: { message: 'The audio upload is invalid.' } }, 400);
    }

    const audioFile = formData.get('file');
    if (!(audioFile instanceof File) || audioFile.size === 0) {
        return jsonResponse({ error: { message: 'An audio recording is required.' } }, 400);
    }
    if (audioFile.size > MAX_AUDIO_BYTES) {
        return jsonResponse({ error: { message: 'The recording exceeds the 25 MB limit.' } }, 413);
    }

    const reservationId = formData.get('reservationId');
    if (!isUuid(reservationId)) {
        return jsonResponse({
            error: {
                code: 'VOICE_RESERVATION_REQUIRED',
                message: 'A valid voice request reservation is required.',
            },
        }, 403);
    }

    const reservationResponse = await claimVoiceStep(
        supabase,
        userId,
        reservationId,
        'transcription',
    );
    if (reservationResponse) return reservationResponse;

    const providerForm = new FormData();
    providerForm.append('file', audioFile, audioFile.name || 'recording.m4a');
    providerForm.append('model', 'whisper-large-v3');
    providerForm.append('response_format', 'json');

    const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: providerForm,
        signal: request.signal,
    });
    const { body, rawText } = await parseProviderResponse(response);

    if (!response.ok) {
        const providerError = getProviderError(
            body,
            rawText,
            `Groq returned HTTP ${response.status} without an error message.`,
        );
        console.error('Groq transcription request failed.', {
            requestId,
            status: response.status,
            code: providerError.code ?? null,
            type: providerError.type ?? null,
            message: providerError.message,
        });
        return jsonResponse({
            error: {
                message: providerError.message,
                code: 'AI_PROVIDER_ERROR',
                provider: 'Groq',
                providerStatus: response.status,
                providerCode: providerError.code,
                providerType: providerError.type,
            },
        }, response.status);
    }

    if (!isRecord(body) || typeof body.text !== 'string') {
        console.error('Groq returned a successful response without transcription text.', {
            requestId,
            status: response.status,
            responseLength: rawText.length,
            responseType: Array.isArray(body) ? 'array' : typeof body,
        });
        return jsonResponse({
            error: {
                message: 'Groq returned HTTP 200 but the response did not contain transcription text.',
                code: 'INVALID_PROVIDER_RESPONSE',
                provider: 'Groq',
                providerStatus: response.status,
            },
        }, 502);
    }

    return jsonResponse(body);
};

export default {
    fetch: withSupabase({ auth: 'user' }, async (request, context) => {
        const requestId = crypto.randomUUID();
        const contentType = request.headers.get('content-type') ?? '';
        const complete = (response: Response): Response => {
            console.log('AI proxy request completed.', {
                requestId,
                status: response.status,
                contentType: contentType.split(';', 1)[0],
            });
            return withRequestId(response, requestId);
        };

        console.log('AI proxy request received.', {
            requestId,
            method: request.method,
            contentType: contentType.split(';', 1)[0],
            contentLength: request.headers.get('content-length'),
        });

        if (request.method !== 'POST') {
            return complete(jsonResponse({ error: { message: 'Method not allowed.' } }, 405));
        }

        try {
            const claims = context.jwtClaims;
            const userId = claims?.sub;
            if (typeof userId !== 'string') {
                return complete(jsonResponse({
                    error: {
                        message: 'A valid user session is required.',
                        code: 'AUTHENTICATION_REQUIRED',
                    },
                }, 401));
            }

            const isGuest = claims?.is_anonymous === true;

            if (contentType.includes('multipart/form-data')) {
                return complete(await transcribeAudio(
                    request,
                    context.supabaseAdmin,
                    userId,
                    requestId,
                ));
            }

            const contentLength = Number(request.headers.get('content-length') ?? 0);
            if (contentLength > MAX_JSON_BODY_BYTES) {
                return complete(jsonResponse({ error: {
                    message: 'The request is too large.',
                    code: 'REQUEST_TOO_LARGE',
                } }, 413));
            }

            const requestBody = await readBodyWithinLimit(request, MAX_JSON_BODY_BYTES);
            if (!requestBody) {
                return complete(jsonResponse({ error: {
                    message: 'The request is too large.',
                    code: 'REQUEST_TOO_LARGE',
                } }, 413));
            }

            let body: unknown;
            try {
                body = JSON.parse(new TextDecoder().decode(requestBody));
            } catch {
                return complete(jsonResponse({ error: {
                    message: 'The task extraction request is invalid JSON.',
                    code: 'INVALID_JSON',
                } }, 400));
            }

            if (isVoiceReservationRequest(body)) {
                return complete(await reserveVoiceUsage(
                    context.supabaseAdmin,
                    userId,
                    isGuest,
                ));
            }

            if (!isTaskRequest(body)) {
                return complete(jsonResponse({ error: {
                    message: 'The task extraction request is invalid or missing required fields.',
                    code: 'INVALID_TASK_REQUEST',
                } }, 400));
            }

            return complete(await extractTasks(
                body,
                context.supabaseAdmin,
                userId,
                request.signal,
                requestId,
            ));
        } catch (error) {
            const errorName = error instanceof Error ? error.name : 'UnknownError';
            const errorMessage = error instanceof Error ? error.message : String(error);
            const aborted = errorName === 'AbortError';
            console.error('AI proxy request failed unexpectedly.', {
                requestId,
                errorName,
                errorMessage,
            });
            return complete(jsonResponse({
                error: {
                    message: aborted
                        ? 'The AI request was cancelled or timed out.'
                        : errorMessage || 'The AI service request failed unexpectedly.',
                    code: aborted ? 'REQUEST_ABORTED' : 'EDGE_FUNCTION_ERROR',
                    causeName: errorName,
                },
                requestId,
            }, aborted ? 408 : 502));
        }
    }),
};
