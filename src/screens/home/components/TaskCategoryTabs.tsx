import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import AppButton from '../../../components/AppButton';
import AppText from '../../../components/AppText';
import { taskTheme } from '../../../core/theme/taskTheme';
import { RF, RH, RS, RW } from '../../../core/utils/responsive';
import type { TaskCategory } from '../home.types';

interface TaskCategoryTabsProps {
    categories: TaskCategory[];
    counts: ReadonlyMap<TaskCategory, number>;
    selectedCategory: TaskCategory;
    onSelect: (category: TaskCategory) => void;
}

const TaskCategoryTabs = ({
    categories,
    counts,
    selectedCategory,
    onSelect,
}: TaskCategoryTabsProps) => (
    <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.row}
    >
        {categories.map(category => {
            const isSelected = selectedCategory === category;
            return (
                <AppButton
                    key={category}
                    style={[styles.button, isSelected && styles.selectedButton]}
                    onPress={() => onSelect(category)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                >
                    <AppText style={[styles.text, isSelected && styles.selectedText]}>
                        {category} ({counts.get(category) ?? 0})
                    </AppText>
                </AppButton>
            );
        })}
    </ScrollView>
);

const styles = StyleSheet.create({
    scroll: {
        marginHorizontal: -RW(taskTheme.spacing.xl),
    },
    row: {
        gap: RW(taskTheme.spacing.sm),
        paddingBottom: RH(taskTheme.spacing.sm),
        paddingHorizontal: RW(taskTheme.spacing.xl),
        flexGrow: 1,
        alignItems: 'center',
    },
    button: {
        minHeight: RH(40),
        justifyContent: 'center',
        borderColor: taskTheme.colors.border,
        borderWidth: 1,
        borderRadius: RS(taskTheme.radius.lg),
        backgroundColor: taskTheme.colors.surface,
        paddingHorizontal: RW(taskTheme.spacing.md),
    },
    selectedButton: {
        borderColor: taskTheme.colors.primary,
        backgroundColor: taskTheme.colors.primary,
    },
    text: {
        color: taskTheme.colors.textSecondary,
        fontSize: RF(12),
        fontWeight: '600',
    },
    selectedText: {
        color: taskTheme.colors.white,
    },
});

export default TaskCategoryTabs;
