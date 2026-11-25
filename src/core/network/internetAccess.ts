import * as Network from 'expo-network';
import Toast from 'react-native-toast-message';

export const NETWORK_UNAVAILABLE_MESSAGE =
    'No internet connection. Connect to the internet and try again.';

export const isInternetAvailable = async (): Promise<boolean> => {
    try {
        const state = await Network.getNetworkStateAsync();
        return state.isConnected !== false && state.isInternetReachable !== false;
    } catch (error) {
        console.error('Could not check internet availability before a network request.', error);
        return true;
    }
};

export const showNetworkUnavailableToast = (): void => {
    Toast.show({
        type: 'error',
        text1: 'No internet connection',
        text2: 'Connect to the internet and try again.',
        position: 'top',
        visibilityTime: 4500,
    });
};

export const requireInternetConnection = async (): Promise<boolean> => {
    const available = await isInternetAvailable();
    if (!available) showNetworkUnavailableToast();
    return available;
};

export const ensureInternetAvailable = async (): Promise<void> => {
    if (!await isInternetAvailable()) {
        throw new Error(NETWORK_UNAVAILABLE_MESSAGE);
    }
};

export const isNetworkError = (error: unknown): boolean => {
    const message = error instanceof Error ? error.message : String(error ?? '');
    return /no internet connection|internet connection|network error|network request failed|failed to fetch|fetch failed|network is unreachable|econnrefused|econnreset|enotfound/i
        .test(message);
};
