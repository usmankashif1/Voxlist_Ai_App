import * as SecureStore from 'expo-secure-store';

const HAS_COMPLETED_ONBOARDING_KEY = 'hasCompletedOnboarding';
const HAS_SEEN_HOME_TOUR_KEY = 'hasSeenHomeTour';
const HAS_PROMPTED_BATTERY_OPTIMIZATION_KEY = 'hasPromptedBatteryOptimization';

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

let batteryPromptClaim: Promise<boolean> | null = null;

export const claimBatteryOptimizationPrompt = (): Promise<boolean> => {
    if (batteryPromptClaim) return batteryPromptClaim;

    batteryPromptClaim = (async () => {
        const alreadyPrompted = await SecureStore.getItemAsync(
            HAS_PROMPTED_BATTERY_OPTIMIZATION_KEY,
        );
        if (alreadyPrompted === 'true') return false;

        await SecureStore.setItemAsync(HAS_PROMPTED_BATTERY_OPTIMIZATION_KEY, 'true');
        return true;
    })().finally(() => {
        batteryPromptClaim = null;
    });

    return batteryPromptClaim;
};
