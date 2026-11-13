import React from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import useSheetTransition from '../../../components/useSheetTransition';
import { taskTheme } from '../../../core/theme/taskTheme';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';

interface InternetRequiredSheetProps {
    visible: boolean;
    onClose: () => void;
}

const InternetRequiredSheet = ({ visible, onClose }: InternetRequiredSheetProps) => {
    const insets = useSafeAreaInsets();
    const {
        mounted,
        backdropStyle,
        sheetStyle,
        startOpening,
    } = useSheetTransition(visible);

    return (
        <Modal
            visible={mounted}
            transparent
            animationType="none"
            onShow={startOpening}
            onRequestClose={onClose}
        >
            <View style={styles.backdrop}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close internet connection message"
                />
                <Animated.View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, styles.dimmer, backdropStyle]}
                />
                <Animated.View
                    style={[
                        styles.sheet,
                        sheetStyle,
                        { paddingBottom: RH(taskTheme.spacing.xl) + insets.bottom },
                    ]}
                >
                    <View style={styles.handle} />
                    <View style={styles.icon}>
                        <FontAwesome5
                            name="wifi"
                            size={RS(22)}
                            color={taskTheme.colors.text}
                        />
                    </View>
                    <AppText style={styles.title}>Internet connection needed</AppText>
                    <AppText style={styles.description}>
                        Connect to the internet to create tasks by voice. You can still add
                        tasks manually while offline.
                    </AppText>
                    <AppButton
                        style={styles.button}
                        onPress={onClose}
                        accessibilityRole="button"
                        accessibilityLabel="Close internet connection message"
                    >
                        <AppText style={styles.buttonText}>Got it</AppText>
                    </AppButton>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    dimmer: {
        backgroundColor: 'rgba(24, 28, 38, 0.45)',
    },
    sheet: {
        alignItems: 'center',
        paddingHorizontal: RW(taskTheme.spacing.xl),
        paddingTop: RH(taskTheme.spacing.md),
        backgroundColor: taskTheme.colors.surface,
        borderTopLeftRadius: RS(taskTheme.radius.lg),
        borderTopRightRadius: RS(taskTheme.radius.lg),
    },
    handle: {
        width: RW(38),
        height: RH(4),
        borderRadius: RS(2),
        backgroundColor: taskTheme.colors.borderStrong,
        marginBottom: RH(taskTheme.spacing.xl),
    },
    icon: {
        width: RS(56),
        height: RS(56),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(28),
        backgroundColor: taskTheme.colors.surfaceMuted,
        marginBottom: RH(taskTheme.spacing.md),
    },
    title: {
        color: taskTheme.colors.text,
        fontSize: RF(19),
        fontWeight: '700',
        textAlign: 'center',
    },
    description: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(14),
        lineHeight: RF(21),
        textAlign: 'center',
        marginTop: RH(taskTheme.spacing.sm),
    },
    button: {
        minHeight: RH(48),
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RS(taskTheme.radius.md),
        backgroundColor: taskTheme.colors.primary,
        marginTop: RH(taskTheme.spacing.xl),
    },
    buttonText: {
        color: taskTheme.colors.white,
        fontSize: RF(15),
        fontWeight: '700',
    },
});

export default InternetRequiredSheet;
