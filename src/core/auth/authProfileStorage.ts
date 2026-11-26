import * as SecureStore from 'expo-secure-store';
import type { Session } from '@supabase/supabase-js';
import type { AuthProfile } from './authProfile';
import { getAuthProfileFromUser } from './authProfile';

const AUTH_PROFILE_STORAGE_KEY = 'voxlist-auth-profile-v1';

export interface AuthProfileSnapshot {
    version: 1;
    profile: AuthProfile;
    accessToken: string;
    refreshToken: string;
    expiresAt: number | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isAuthProfile = (value: unknown): value is AuthProfile =>
    isRecord(value)
    && typeof value.userId === 'string'
    && (typeof value.email === 'string' || value.email === null)
    && (typeof value.displayName === 'string' || value.displayName === null)
    && typeof value.isAnonymous === 'boolean';

const createSnapshot = (value: unknown): AuthProfileSnapshot | null => {
    if (!isRecord(value) || typeof value.access_token !== 'string'
        || typeof value.refresh_token !== 'string' || !isRecord(value.user)
        || typeof value.user.id !== 'string') {
        return null;
    }

    const metadata = isRecord(value.user.user_metadata)
        ? value.user.user_metadata
        : {};
    const profile = getAuthProfileFromUser({
        id: value.user.id,
        email: typeof value.user.email === 'string' ? value.user.email : undefined,
        is_anonymous: value.user.is_anonymous === true,
        user_metadata: metadata,
    });

    return {
        version: 1,
        profile,
        accessToken: value.access_token,
        refreshToken: value.refresh_token,
        expiresAt: typeof value.expires_at === 'number' ? value.expires_at : null,
    };
};

const parseSnapshot = (serialized: string): AuthProfileSnapshot | null => {
    try {
        const value: unknown = JSON.parse(serialized);
        if (
            !isRecord(value)
            || value.version !== 1
            || !isAuthProfile(value.profile)
            || typeof value.accessToken !== 'string'
            || typeof value.refreshToken !== 'string'
            || !(typeof value.expiresAt === 'number' || value.expiresAt === null)
        ) {
            return null;
        }

        return {
            version: 1,
            profile: value.profile,
            accessToken: value.accessToken,
            refreshToken: value.refreshToken,
            expiresAt: value.expiresAt,
        };
    } catch {
        return null;
    }
};

const storeSnapshot = async (snapshot: AuthProfileSnapshot): Promise<void> => {
    await SecureStore.setItemAsync(AUTH_PROFILE_STORAGE_KEY, JSON.stringify(snapshot));
};

export const persistAuthProfileFromSession = async (
    session: Session,
): Promise<void> => {
    const snapshot = createSnapshot(session);
    if (!snapshot) {
        throw new Error('The active session did not contain a valid local profile.');
    }
    await storeSnapshot(snapshot);
};

export const persistAuthProfileFromSessionJson = async (
    serializedSession: string,
): Promise<void> => {
    let session: unknown;
    try {
        session = JSON.parse(serializedSession);
    } catch {
        throw new Error('The stored Supabase session is not valid JSON.');
    }

    const snapshot = createSnapshot(session);
    if (!snapshot) {
        throw new Error('The stored Supabase session did not contain a valid local profile.');
    }
    await storeSnapshot(snapshot);
};

export const loadPersistedAuthSession = async (
    supabaseAuthStorageKey: string | null,
): Promise<AuthProfileSnapshot | null> => {
    const cachedProfile = await SecureStore.getItemAsync(AUTH_PROFILE_STORAGE_KEY);
    if (cachedProfile) {
        const snapshot = parseSnapshot(cachedProfile);
        if (snapshot) return snapshot;
        console.error('The cached account profile is invalid; checking the stored Supabase session.');
    }

    if (!supabaseAuthStorageKey) return null;
    const storedSession = await SecureStore.getItemAsync(supabaseAuthStorageKey);
    if (!storedSession) return null;

    let session: unknown;
    try {
        session = JSON.parse(storedSession);
    } catch {
        console.error('The stored Supabase session could not be read as JSON.');
        return null;
    }

    const snapshot = createSnapshot(session);
    if (!snapshot) {
        console.error('The stored Supabase session did not contain a valid account profile.');
        return null;
    }

    void storeSnapshot(snapshot).catch(error => {
        console.error('Could not cache the local account profile.', error);
    });
    return snapshot;
};

export const clearPersistedAuthProfile = async (): Promise<void> => {
    await SecureStore.deleteItemAsync(AUTH_PROFILE_STORAGE_KEY);
};
