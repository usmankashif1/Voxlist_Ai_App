import * as SecureStore from 'expo-secure-store';

const HAS_COMPLETED_ONBOARDING_KEY = 'hasCompletedOnboarding';
const HAS_SEEN_HOME_TOUR_KEY = 'hasSeenHomeTour';
const HAS_SEEN_REMINDER_HEALTH_KEY = 'hasSeenReminderHealthChecklist';
const HAS_REVIEWED_BRAND_GUIDANCE_KEY = 'hasReviewedReminderBrandGuidance';
const HAS_DISABLED_REMINDER_HEALTH_PROMPTS_KEY = 'hasDisabledReminderHealthPrompts';
const HAS_DISMISSED_REMINDER_HEALTH_BANNER_KEY = 'hasDismissedReminderHealthBanner';
const LEGACY_HAS_PROMPTED_BATTERY_OPTIMIZATION_KEY = 'hasPromptedBatteryOptimization';

type OnboardingPermission = 'microphone' | 'notifications';

export const getHasCompletedOnboarding = async (): Promise<boolean> =>
    await SecureStore.getItemAsync(HAS_COMPLETED_ONBOARDING_KEY) === 'true';

export const setHasCompletedOnboarding = async (): Promise<void> => {
    await SecureStore.setItemAsync(HAS_COMPLETED_ONBOARDING_KEY, 'true');
};

export const saveOnboardingPermissionResult = async (
    permission: OnboardingPermission,
    granted: boolean,
): Promise<void> => {
    await SecureStore.setItemAsync(`onboarding-${permission}-granted`, String(granted));
};

export const getHasSeenHomeTour = async (): Promise<boolean> =>
    await SecureStore.getItemAsync(HAS_SEEN_HOME_TOUR_KEY) === 'true';

export const setHasSeenHomeTour = async (): Promise<void> => {
    await SecureStore.setItemAsync(HAS_SEEN_HOME_TOUR_KEY, 'true');
};

let reminderHealthPromptClaim: Promise<boolean> | null = null;

export const claimReminderHealthChecklist = (): Promise<boolean> => {
    if (reminderHealthPromptClaim) return reminderHealthPromptClaim;

    reminderHealthPromptClaim = (async () => {
        const [alreadySeen, promptsDisabled] = await Promise.all([
            SecureStore.getItemAsync(HAS_SEEN_REMINDER_HEALTH_KEY),
            SecureStore.getItemAsync(HAS_DISABLED_REMINDER_HEALTH_PROMPTS_KEY),
        ]);
        if (alreadySeen === 'true' || promptsDisabled === 'true') return false;

        const legacyPromptShown = await SecureStore.getItemAsync(
            LEGACY_HAS_PROMPTED_BATTERY_OPTIMIZATION_KEY,
        ) === 'true';
        await SecureStore.setItemAsync(HAS_SEEN_REMINDER_HEALTH_KEY, 'true');
        return !legacyPromptShown;
    })().finally(() => {
        reminderHealthPromptClaim = null;
    });

    return reminderHealthPromptClaim;
};

export const getHasReviewedBrandGuidance = async (): Promise<boolean> =>
    await SecureStore.getItemAsync(HAS_REVIEWED_BRAND_GUIDANCE_KEY) === 'true';

export const setHasReviewedBrandGuidance = async (): Promise<void> => {
    await SecureStore.setItemAsync(HAS_REVIEWED_BRAND_GUIDANCE_KEY, 'true');
};

export const getReminderHealthPromptsDisabled = async (): Promise<boolean> =>
    await SecureStore.getItemAsync(HAS_DISABLED_REMINDER_HEALTH_PROMPTS_KEY) === 'true';

export const disableReminderHealthPrompts = async (): Promise<void> => {
    await SecureStore.setItemAsync(HAS_DISABLED_REMINDER_HEALTH_PROMPTS_KEY, 'true');
};

export const getHasDismissedReminderHealthBanner = async (): Promise<boolean> =>
    await SecureStore.getItemAsync(HAS_DISMISSED_REMINDER_HEALTH_BANNER_KEY) === 'true';

export const dismissReminderHealthBanner = async (): Promise<void> => {
    await SecureStore.setItemAsync(HAS_DISMISSED_REMINDER_HEALTH_BANNER_KEY, 'true');
};
