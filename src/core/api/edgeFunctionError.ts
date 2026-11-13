interface ResponseLike {
    status?: number;
    statusText?: string;
    headers?: {
        get: (name: string) => string | null;
    };
    clone?: () => ResponseLike;
    text?: () => Promise<string>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const getErrorContext = (error: unknown): unknown =>
    isRecord(error) ? error.context : undefined;

const getResponseLike = (value: unknown): ResponseLike | null => {
    if (!isRecord(value) || typeof value.text !== 'function') return null;
    return value as ResponseLike;
};

const readResponseBody = async (response: ResponseLike): Promise<string> => {
    const readableResponse = typeof response.clone === 'function'
        ? response.clone()
        : response;
    if (typeof readableResponse.text !== 'function') return '';
    return readableResponse.text();
};

const getResponseRequestId = (response: ResponseLike): string | null => {
    if (!response.headers) return null;
    return response.headers.get('x-ai-proxy-request-id')
        ?? response.headers.get('x-request-id')
        ?? response.headers.get('sb-request-id')
        ?? response.headers.get('x-deno-execution-id')
        ?? response.headers.get('cf-ray');
};

const getProviderStatus = (body: string): number | null => {
    try {
        const parsed: unknown = JSON.parse(body);
        if (!isRecord(parsed)) return null;
        const error = isRecord(parsed.error) ? parsed.error : parsed;
        const status = error.providerStatus;
        return typeof status === 'number' ? status : null;
    } catch {
        return null;
    }
};

const serializeContext = (context: unknown): unknown => {
    if (context instanceof Error) {
        return {
            name: context.name,
            message: context.message,
            stack: context.stack,
            cause: context.cause,
        };
    }

    return context;
};

export const getFunctionErrorMessage = async (
    error: Error,
    fallback: string,
): Promise<string> => {
    const context = getErrorContext(error);
    const response = getResponseLike(context);

    if (!response) {
        console.error('[Voice AI] Supabase function invocation failed.', {
            error,
            name: error.name,
            message: error.message,
            stack: error.stack,
            context: serializeContext(context),
        });

        const contextMessage = context instanceof Error ? context.message : '';
        const message = error.message && error.message !== 'Edge Function returned a non-2xx status code'
            ? error.message
            : contextMessage || fallback;
        return `${message} (${error.name || 'Function error'}).`;
    }

    let rawBody = '';
    let bodyReadError: string | null = null;
    try {
        rawBody = await readResponseBody(response);
    } catch (readError) {
        bodyReadError = readError instanceof Error ? readError.message : String(readError);
    }

    const status = [
        response.status,
        response.statusText,
    ].filter(value => value !== undefined && value !== '').join(' ');
    const requestId = getResponseRequestId(response);
    const gatewayCode = response.headers?.get('x-sb-error-code') ?? null;
    const providerStatus = getProviderStatus(rawBody);

    if (response.status === 503 || providerStatus === 503) {
        console.warn('[Voice AI] AI provider is temporarily unavailable.', {
            status: response.status ?? null,
            providerStatus,
            requestId,
        });
        return 'The AI is experiencing high traffic right now. Please try again shortly.';
    }

    if (response.status === 429 || providerStatus === 429) {
        console.warn('[Voice AI] AI request limit reached.', {
            status: response.status ?? null,
            providerStatus,
            requestId,
        });
        return 'AI usage limit reached. Please try again later.';
    }

    console.error('[Voice AI] Supabase Edge Function returned an HTTP error.', {
        error,
        name: error.name,
        message: error.message,
        stack: error.stack,
        status: response.status ?? null,
        statusText: response.statusText ?? null,
        gatewayCode,
        requestId,
        rawResponseBody: rawBody || null,
        responseBodyReadError: bodyReadError,
        context: serializeContext(context),
    });

    const details = [
        rawBody || bodyReadError || error.message || fallback,
        status ? `HTTP ${status}` : null,
        gatewayCode ? `gateway code: ${gatewayCode}` : null,
        requestId ? `request ID: ${requestId}` : null,
    ].filter(Boolean);

    return details.join('\n');
};
