import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { RF, RH, RS, RW } from '../core/utils/responsive';
import { taskTheme } from '../core/theme/taskTheme';
import AppButton from './AppButton';
import AppText from './AppText';

interface BackButtonProps {
    onPress: () => void;
    label?: string;
    accessibilityLabel?: string;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
}

const BackButton = ({
    onPress,
    label,
    accessibilityLabel,
    disabled = false,
    style,
}: BackButtonProps) => (
    <AppButton
        style={[styles.button, label ? styles.labeledButton : null, disabled ? styles.disabled : null, style]}
        onPress={onPress}
        disabled={disabled}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label ?? 'Go back'}
    >
        <FontAwesome5 name="arrow-left" size={RS(16)} color={taskTheme.colors.text} />
        {label ? <AppText style={styles.label}>{label}</AppText> : null}
    </AppButton>
);

const styles = StyleSheet.create({
    button: {
        minWidth: RS(48),
        minHeight: RH(48),
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
        borderRadius: RS(taskTheme.radius.md),
        // backgroundColor: taskTheme.colors.surface,
        // borderColor: taskTheme.colors.border,
        // borderWidth: 1,
        // paddingHorizontal: RW(taskTheme.spacing.md),
    },
    labeledButton: {
        flexDirection: 'row',
        gap: RW(taskTheme.spacing.sm),
    },
    label: {
        color: taskTheme.colors.text,
        fontSize: RF(14),
        fontWeight: '600',
    },
    disabled: {
        opacity: 0.5,
    },
});

export default BackButton;
