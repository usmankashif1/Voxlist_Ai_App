import type { Session } from '@supabase/supabase-js';

export interface AuthProfile {
    userId: string;
    email: string | null;
    displayName: string | null;
    isAnonymous: boolean;
}

interface AuthProfileUser {
    id: string;
    email?: string;
    is_anonymous?: boolean;
    user_metadata?: Record<string, unknown>;
}

export const getAuthProfileFromUser = (user: AuthProfileUser): AuthProfile => {
    const metadata = user.user_metadata ?? {};
    const displayName = [
        metadata.full_name,
        metadata.name,
        metadata.display_name,
    ].find(value => typeof value === 'string' && value.trim().length > 0);

    return {
        userId: user.id,
        email: user.email ?? null,
        displayName: typeof displayName === 'string' ? displayName.trim() : null,
        isAnonymous: user.is_anonymous === true,
    };
};

export const getAuthProfileFromSession = (
    session: Pick<Session, 'user'>,
): AuthProfile => getAuthProfileFromUser(session.user);
