// Expo inlines EXPO_PUBLIC_ variables into the mobile bundle; these keys are extractable.
export const SUPABASE_URL: string | undefined = process.env.EXPO_PUBLIC_SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY: string | undefined =
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.EXPO_PUBLIC_SUPABASE_KEY;
