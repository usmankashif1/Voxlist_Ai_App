import { createAsyncThunk } from '@reduxjs/toolkit';
import type { Session, Subscription } from '@supabase/supabase-js';
import { createSignUpClient, getSupabaseClient } from '../core/auth/supabase';
import { getFunctionErrorMessage } from '../core/api/edgeFunctionError';
import {
    isInternetAvailable,
    NETWORK_UNAVAILABLE_MESSAGE,
} from '../core/network/internetAccess';
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

interface ResetCodeCredentials {
    email: string;
    code: string;
}

let authSubscription: Subscription | null = null;
let anonymousSessionRequest: Promise<Session> | null = null;

export const requestPasswordReset = createAsyncThunk<
    string,
    string,
    { rejectValue: string }
>(
    'auth/requestPasswordReset',
    async (email, { rejectWithValue }) => {
        const normalizedEmail = email.trim();
        if (!normalizedEmail) {
            return rejectWithValue('Enter your email address.');
        }
        if (!await isInternetAvailable()) {
            return rejectWithValue(NETWORK_UNAVAILABLE_MESSAGE);
        }

        console.info('[Auth] Password reset code request started.');

        try {
            const { error } = await getSupabaseClient().auth.resetPasswordForEmail(normalizedEmail);
            if (error) {
                console.error('[Auth] Password reset code request failed.', {
                    status: error.status ?? null,
                    code: error.code ?? null,
                    message: error.message ?? null,
                });
                return rejectWithValue(getErrorMessage(error));
            }

            console.info('[Auth] Supabase accepted the password reset code request.');
            return 'If an account exists, we sent a 6-digit code.';
        } catch (error) {
            console.error('[Auth] Password reset code request failed unexpectedly.', {
                errorName: error instanceof Error ? error.name : 'UnknownError',
                message: error instanceof Error ? error.message : 'Unknown error occurred.',
            });
            return rejectWithValue(getErrorMessage(error));
        }
    },
);

export const verifyResetCode = createAsyncThunk<
    void,
    ResetCodeCredentials,
    { rejectValue: string }
>(
    'auth/verifyResetCode',
    async ({ email, code }, { dispatch, rejectWithValue }) => {
        const normalizedEmail = email.trim();
        const normalizedCode = code.trim();
        if (!normalizedEmail || !/^\d{6}$/.test(normalizedCode)) {
            return rejectWithValue('Enter the 6-digit code sent to your email.');
        }
        if (!await isInternetAvailable()) {
            return rejectWithValue(NETWORK_UNAVAILABLE_MESSAGE);
        }

        const { data, error } = await getSupabaseClient().auth.verifyOtp({
            email: normalizedEmail,
            token: normalizedCode,
            type: 'recovery',
        });
        if (error) return rejectWithValue(getErrorMessage(error));
        if (!data.session) {
            return rejectWithValue('Could not start password recovery. Request a new code and try again.');
        }

        dispatch(setSession(data.session));
    },
);

export const updatePassword = createAsyncThunk<
    string,
    string,
    { rejectValue: string }
>(
    'auth/updatePassword',
    async (newPassword, { rejectWithValue }) => {
        if (newPassword.length < 8) {
            return rejectWithValue('Password must be at least 8 characters long.');
        }
        if (!await isInternetAvailable()) {
            return rejectWithValue(NETWORK_UNAVAILABLE_MESSAGE);
        }

        const { error } = await getSupabaseClient().auth.updateUser({
            password: newPassword,
        });
        if (error) return rejectWithValue(getErrorMessage(error));

        return 'Log in with your new password.';
    },
);

const createAnonymousSession = (): Promise<Session> => {
    if (!anonymousSessionRequest) {
        anonymousSessionRequest = getSupabaseClient().auth.signInAnonymously()
            .then(({ data, error }) => {
                if (error) throw error;
                if (!data.session) throw new Error('Guest sign in returned no active session.');
                return data.session;
            })
            .finally(() => {
                anonymousSessionRequest = null;
            });
    }

    return anonymousSessionRequest;
};

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

export const ensureVoiceSession = () => async (dispatch: AppDispatch): Promise<Session> => {
    const { data, error } = await getSupabaseClient().auth.getSession();
    if (error) throw error;

    const session = data.session ?? await createAnonymousSession();
    dispatch(setSession(session));
    return session;
};

export const signIn = (credentials: Credentials) => async (
    dispatch: AppDispatch,
): Promise<boolean> => {
    dispatch(setError(null));
    if (!await isInternetAvailable()) {
        dispatch(setError(NETWORK_UNAVAILABLE_MESSAGE));
        return false;
    }

    dispatch(setSubmitting(true));

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
    dispatch(setError(null));
    if (!await isInternetAvailable()) {
        dispatch(setError(NETWORK_UNAVAILABLE_MESSAGE));
        return;
    }

    dispatch(setSubmitting(true));

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
    dispatch(setError(null));
    dispatch(setNotice(null));
    if (!await isInternetAvailable()) {
        dispatch(setError(NETWORK_UNAVAILABLE_MESSAGE));
        return false;
    }

    dispatch(setSubmitting(true));

    try {
        const { data, error } = await createSignUpClient().auth.signUp({
            email: credentials.email.trim(),
            password: credentials.password,
        });
        if (error) throw error;

        if (!data.session) {
            dispatch(setNotice(
                'Check your email to finish signing up.',
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
    dispatch(setError(null));
    if (!await isInternetAvailable()) {
        dispatch(setError(NETWORK_UNAVAILABLE_MESSAGE));
        return;
    }

    dispatch(setSubmitting(true));

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

export const deleteAccount = () => async (dispatch: AppDispatch): Promise<boolean> => {
    dispatch(setError(null));
    if (!await isInternetAvailable()) {
        dispatch(setError(NETWORK_UNAVAILABLE_MESSAGE));
        return false;
    }

    dispatch(setSubmitting(true));

    try {
        const client = getSupabaseClient();
        const { data, error } = await client.functions.invoke<{ success: boolean }>('delete-account');
        if (error) {
            throw new Error(await getFunctionErrorMessage(error, 'Could not delete the account.'));
        }
        if (!data?.success) {
            throw new Error('The server did not confirm account deletion. Please try again.');
        }

        const { error: signOutError } = await client.auth.signOut({ scope: 'local' });
        if (signOutError) {
            throw new Error(`Account deleted, but the local session could not be cleared: ${signOutError.message}`);
        }
        dispatch(setSession(null));
        return true;
    } catch (error) {
        dispatch(setError(getErrorMessage(error)));
        return false;
    } finally {
        dispatch(setSubmitting(false));
    }
};
