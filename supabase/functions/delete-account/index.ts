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

export default {
    fetch: withSupabase({ auth: 'user' }, async (request, context) => {
        if (request.method !== 'POST') {
            return jsonResponse({ error: 'Method not allowed.' }, 405);
        }

        const userId = context.jwtClaims?.sub;
        if (typeof userId !== 'string') {
            return jsonResponse({ error: 'A valid user session is required.' }, 401);
        }

        const { error } = await context.supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) {
            console.error('Could not delete Supabase auth user.', {
                userId,
                message: error.message,
                status: error.status,
            });
            return jsonResponse({
                error: 'Could not delete the account. Please try again later.',
            }, 500);
        }

        return jsonResponse({ success: true }, 200);
    }),
};
