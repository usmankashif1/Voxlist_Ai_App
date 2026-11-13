import { withSupabase } from 'npm:@supabase/server@1';

const jsonResponse = (body: unknown, status = 200): Response => new Response(
    JSON.stringify(body),
    {
        status,
        headers: {
            'Content-Type': 'application/json',
        },
    },
);

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

export default {
    fetch: withSupabase({ auth: 'user' }, async (request, context) => {
        if (request.method !== 'POST') {
            return jsonResponse({ error: 'Method not allowed.' }, 405);
        }

        const userId = context.jwtClaims?.sub;
        if (typeof userId !== 'string') {
            return jsonResponse({ error: 'A valid user session is required.' }, 401);
        }

        let payload: unknown;
        try {
            payload = await request.json();
        } catch {
            return jsonResponse({ error: 'Request body must be valid JSON.' }, 400);
        }

        if (!isRecord(payload)) {
            return jsonResponse({ error: 'Request body is required.' }, 400);
        }

        const reportType = typeof payload.reportType === 'string' ? payload.reportType : '';
        const summary = typeof payload.summary === 'string' ? payload.summary.trim() : '';
        const details = typeof payload.details === 'string' ? payload.details.trim() : '';
        const taskId = typeof payload.taskId === 'string' ? payload.taskId : null;
        const taskTitle = typeof payload.taskTitle === 'string' ? payload.taskTitle : null;
        const aiOutput = typeof payload.aiOutput === 'string' ? payload.aiOutput : null;
        const source = payload.source === 'support' ? 'support' : 'app';
        const appVersion = typeof payload.appVersion === 'string' ? payload.appVersion : null;
        const claims = context.jwtClaims;
        const userEmail = typeof claims?.email === 'string' ? claims.email : null;

        if (!['offensive', 'inaccurate', 'unsafe', 'other'].includes(reportType)) {
            return jsonResponse({ error: 'Choose a valid report category.' }, 400);
        }
        if (!summary || summary.length > 140) {
            return jsonResponse({ error: 'A summary of up to 140 characters is required.' }, 400);
        }
        if (details.length > 4000 || (taskTitle?.length ?? 0) > 500 || (aiOutput?.length ?? 0) > 4000) {
            return jsonResponse({ error: 'The report contains text that is too long.' }, 400);
        }

        const { data, error } = await context.supabaseAdmin
            .from('ai_content_reports')
            .insert({
                user_id: userId,
                report_type: reportType,
                summary,
                details: details || null,
                task_id: taskId,
                task_title: taskTitle,
                ai_output: aiOutput,
                source,
                app_version: appVersion,
                user_email: userEmail,
            })
            .select('id, created_at')
            .single();

        if (error) {
            console.error('Could not store AI content report.', {
                userId,
                code: error.code,
                message: error.message,
            });
            return jsonResponse({ error: 'Unable to save the report right now.' }, 500);
        }

        return jsonResponse({
            id: data.id,
            success: true,
            createdAt: data.created_at,
        }, 201);
    }),
};
