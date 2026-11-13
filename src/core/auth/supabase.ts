import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../utils/config';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

let supabaseClient: SupabaseClient | undefined;

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
                storage: {
                    getItem: SecureStore.getItemAsync,
                    setItem: SecureStore.setItemAsync,
                    removeItem: SecureStore.deleteItemAsync,
                },
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
