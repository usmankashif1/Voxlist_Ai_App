import type { Session, Subscription } from '@supabase/supabase-js';
import { createSignUpClient, getSupabaseClient } from '../core/auth/supabase';
import { getErrorMessage } from '../core/utils/errorMessage';
import type { AppDispatch } from './store';
import {
    setError,
    setInitializationError,
    setLoading,
    setNotice,
    setSession,
    setSubmitting,
} from './slices/authSlice';

interface Credentials {
    email: string;
    password: string;
}

let authSubscription: Subscription | null = null;

export const initializeAuth = () => async (dispatch: AppDispatch): Promise<void> => {
    dispatch(setLoading(true));
    dispatch(setInitializationError(null));

    try {
        const client = getSupabaseClient();

        if (!authSubscription) {
            const { data } = client.auth.onAuthStateChange((_event, session) => {
                dispatch(setSession(session));
            });
            authSubscription = data.subscription;
        }

        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        dispatch(setSession(data.session));
    } catch (error) {
        dispatch(setInitializationError(getErrorMessage(error)));
    } finally {
        dispatch(setLoading(false));
    }
};

export const signIn = (credentials: Credentials) => async (
    dispatch: AppDispatch,
): Promise<boolean> => {
    dispatch(setSubmitting(true));
    dispatch(setError(null));

    try {
        const { data, error } = await getSupabaseClient().auth.signInWithPassword({
            email: credentials.email.trim(),
            password: credentials.password,
        });
        if (error) throw error;
        if (!data.session) throw new Error('Sign in returned no active session.');

        dispatch(setSession(data.session));
        return true;
    } catch (error) {
        dispatch(setError(getErrorMessage(error)));
        return false;
    } finally {
        dispatch(setSubmitting(false));
    }
};

export const continueAsGuest = () => async (dispatch: AppDispatch): Promise<void> => {
    dispatch(setSubmitting(true));
    dispatch(setError(null));

    try {
        const { data, error } = await getSupabaseClient().auth.signInAnonymously();
        if (error) throw error;
        if (!data.session) throw new Error('Guest sign in returned no active session.');
        dispatch(setSession(data.session));
    } catch (error) {
        dispatch(setError(getErrorMessage(error)));
    } finally {
        dispatch(setSubmitting(false));
    }
};

export const signUp = (credentials: Credentials) => async (
    dispatch: AppDispatch,
): Promise<boolean> => {
    dispatch(setSubmitting(true));
    dispatch(setError(null));
    dispatch(setNotice(null));

    try {
        const { data, error } = await createSignUpClient().auth.signUp({
            email: credentials.email.trim(),
            password: credentials.password,
        });
        if (error) throw error;

        if (!data.session) {
            dispatch(setNotice(
                'Check your email to confirm your account, then log in. Your local tasks will sync after you sign in.',
            ));
            return false;
        }

        const session: Session = data.session;
        const { error: sessionError } = await getSupabaseClient().auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
        });
        if (sessionError) throw sessionError;

        dispatch(setSession(session));
        return true;
    } catch (error) {
        dispatch(setError(getErrorMessage(error)));
        return false;
    } finally {
        dispatch(setSubmitting(false));
    }
};

export const signOut = () => async (dispatch: AppDispatch): Promise<void> => {
    dispatch(setSubmitting(true));
    dispatch(setError(null));

    try {
        const { error } = await getSupabaseClient().auth.signOut();
        if (error) throw error;
        dispatch(setSession(null));
    } catch (error) {
        dispatch(setError(getErrorMessage(error)));
    } finally {
        dispatch(setSubmitting(false));
    }
};
