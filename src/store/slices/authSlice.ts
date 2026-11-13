import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Session } from '@supabase/supabase-js';
import type { RootState } from '../store';

export interface AuthState {
    session: Session | null;
    isLoading: boolean;
    isSubmitting: boolean;
    error: string | null;
    initializationError: string | null;
    notice: string | null;
}

const initialState: AuthState = {
    session: null,
    isLoading: true,
    isSubmitting: false,
    error: null,
    initializationError: null,
    notice: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setSession(state, action: PayloadAction<Session | null>) {
            state.session = action.payload;
            state.initializationError = null;
        },
        setLoading(state, action: PayloadAction<boolean>) {
            state.isLoading = action.payload;
        },
        setSubmitting(state, action: PayloadAction<boolean>) {
            state.isSubmitting = action.payload;
        },
        setError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
        },
        setInitializationError(state, action: PayloadAction<string | null>) {
            state.initializationError = action.payload;
        },
        setNotice(state, action: PayloadAction<string | null>) {
            state.notice = action.payload;
        },
        clearAuthMessages(state) {
            state.error = null;
            state.notice = null;
        },
    },
});

export const {
    clearAuthMessages,
    setError,
    setInitializationError,
    setLoading,
    setNotice,
    setSession,
    setSubmitting,
} = authSlice.actions;

export const selectAuth = (state: RootState): AuthState => state.auth;
export default authSlice.reducer;
