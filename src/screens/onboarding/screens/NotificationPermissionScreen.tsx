import React, { useRef, useState } from 'react';
import { requestNotificationPermission } from '../../../core/permissions/permissionService';
import { saveOnboardingPermissionResult } from '../../../core/storage/onboardingStorage';
import OnboardingLayout from '../components/OnboardingLayout';

interface NotificationPermissionScreenProps {
    onComplete: () => Promise<void>;
}

const NotificationPermissionScreen = ({
    onComplete,
}: NotificationPermissionScreenProps) => {
    const permissionAttempted = useRef(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleContinue = async () => {
        if (loading) return;
        setLoading(true);
        setMessage('');

        if (!permissionAttempted.current) {
            let granted = false;
            try {
                granted = await requestNotificationPermission();
            } catch (error) {
                console.error('Could not request notification permission during onboarding.', error);
                setMessage('You can enable notifications later in settings.');
            }

            try {
                await saveOnboardingPermissionResult('notifications', granted);
            } catch (error) {
                console.error('Could not save the notification permission result.', error);
                setMessage('Your permission choice could not be saved. You can continue.');
            }
            permissionAttempted.current = true;
        }

        try {
            await onComplete();
        } catch (error) {
            console.error('Could not complete onboarding.', error);
            setMessage('Could not save setup. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <OnboardingLayout
            step={3}
            icon="notifications-outline"
            title="Never miss a reminder"
            description="Allow notifications so Voxlist can remind you when a task is due."
            buttonLabel="Finish"
            loading={loading}
            message={message}
            onContinue={() => void handleContinue()}
        />
    );
};

export default NotificationPermissionScreen;
