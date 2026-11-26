import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../utils/config';
import { persistAuthProfileFromSessionJson } from './authProfileStorage';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

let supabaseClient: SupabaseClient | undefined;

export const getSupabaseAuthStorageKey = (): string | null => {
    if (!SUPABASE_URL) return null;
    try {
        return `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;
    } catch {
        return null;
    }
};

const secureAuthStorage = {
    getItem: SecureStore.getItemAsync,
    setItem: async (key: string, value: string): Promise<void> => {
        await SecureStore.setItemAsync(key, value);
        if (key !== getSupabaseAuthStorageKey()) return;

        try {
            await persistAuthProfileFromSessionJson(value);
        } catch (error) {
            console.error('Could not update the cached account profile.', error);
        }
    },
    removeItem: SecureStore.deleteItemAsync,
};

export const getSupabaseClient = (): SupabaseClient => {
    if (!isSupabaseConfigured || !SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
        throw new Error(
            'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and '
            + 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to your .env file.',
        );
    }

    if (!supabaseClient) {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            auth: {
                storage: secureAuthStorage,
                storageKey: getSupabaseAuthStorageKey() ?? undefined,
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false,
            },
        });
    }

    return supabaseClient;
};




export const createSignUpClient = (): SupabaseClient => {
    if (!isSupabaseConfigured || !SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
        throw new Error(
            'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and '
            + 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to your .env file.',
        );
    }



    return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
        },
    });
};
