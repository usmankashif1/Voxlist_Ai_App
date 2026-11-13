import type { ExtractedTask } from './home.types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isValidDate = (value: string): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day;
};

const invalidTask = (message: string, details: Record<string, unknown> = {}): Error => {
    const error = new Error(message);
    console.error('AI task validation failed.', error, details);
    return error;
};

const normalizeDueTime = (value: string | null): string | null => {
    if (value === null) return null;

    const twelveHourTime = /^(1[0-2]|[1-9]):([0-5]\d)\s(AM|PM)$/i.exec(value.trim());
    if (twelveHourTime) {
        const hour = Number(twelveHourTime[1]) % 12
            + (twelveHourTime[3].toUpperCase() === 'PM' ? 12 : 0);
        return `${String(hour).padStart(2, '0')}:${twelveHourTime[2]}`;
    }

    return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : null;
};

export const validateExtractedTasks = (value: unknown): ExtractedTask[] => {
    if (!Array.isArray(value)) {
        throw invalidTask('Gemini returned tasks in an unexpected format.', {
            receivedType: value === null ? 'null' : typeof value,
            receivedKeys: isRecord(value) ? Object.keys(value) : [],
        });
    }

    return value.map((item, index) => {
        if (!isRecord(item)) {
            throw invalidTask(`Task ${index + 1} is not a valid object.`, {
                taskIndex: index,
                receivedType: item === null ? 'null' : typeof item,
            });
        }

        const {
            title,
            subtasks,
            dueDate,
            dueTime,
            reminderEnabled,
            priority,
            dateAmbiguous,
            ambiguityNote,
        } = item;

        if (typeof title !== 'string' || !title.trim()) {
            throw invalidTask(`Task ${index + 1} is missing a title.`, {
                taskIndex: index,
                field: 'title',
                receivedType: typeof title,
            });
        }
        if (!Array.isArray(subtasks) || subtasks.some(subtask =>
            typeof subtask !== 'string' || !subtask.trim(),
        )) {
            throw invalidTask(`Task ${index + 1} has invalid subtasks.`, {
                taskIndex: index,
                field: 'subtasks',
                receivedType: typeof subtasks,
            });
        }
        if (dueDate !== null && (typeof dueDate !== 'string' || !isValidDate(dueDate))) {
            throw invalidTask(`Task ${index + 1} has an invalid due date.`, {
                taskIndex: index,
                field: 'dueDate',
                receivedType: typeof dueDate,
            });
        }
        if (dueTime !== null && typeof dueTime !== 'string') {
            throw invalidTask(`Task ${index + 1} has an invalid due time.`, {
                taskIndex: index,
                field: 'dueTime',
                receivedType: typeof dueTime,
            });
        }
        if (typeof dueTime === 'string' && normalizeDueTime(dueTime) === null) {
            throw invalidTask(`Task ${index + 1} has an invalid due time.`, {
                taskIndex: index,
                field: 'dueTime',
                value: dueTime,
            });
        }
        if (typeof reminderEnabled !== 'boolean') {
            throw invalidTask(`Task ${index + 1} has an invalid reminder setting.`, {
                taskIndex: index,
                field: 'reminderEnabled',
                receivedType: typeof reminderEnabled,
            });
        }
        if (priority !== 'high' && priority !== 'medium' && priority !== 'low') {
            throw invalidTask(`Task ${index + 1} has an invalid priority.`, {
                taskIndex: index,
                field: 'priority',
                value: priority,
            });
        }
        if (typeof dateAmbiguous !== 'boolean') {
            throw invalidTask(`Task ${index + 1} is missing its date ambiguity status.`, {
                taskIndex: index,
                field: 'dateAmbiguous',
                receivedType: typeof dateAmbiguous,
            });
        }
        if (ambiguityNote !== undefined && ambiguityNote !== null && typeof ambiguityNote !== 'string') {
            throw invalidTask(`Task ${index + 1} has an invalid ambiguity note.`, {
                taskIndex: index,
                field: 'ambiguityNote',
                receivedType: typeof ambiguityNote,
            });
        }
        if (dateAmbiguous && dueDate !== null) {
            throw invalidTask(`Task ${index + 1} guesses a date marked as ambiguous.`, {
                taskIndex: index,
                field: 'dueDate',
                issue: 'date is set while dateAmbiguous is true',
            });
        }

        if (dueDate === null && reminderEnabled) {
            throw invalidTask(`Task ${index + 1} enables a reminder without a due date.`, {
                taskIndex: index,
                field: 'reminderEnabled',
            });
        }

        return {
            title: title.trim(),
            subtasks: subtasks.map(subtask => subtask.trim()),
            dueDate,
            dueTime: normalizeDueTime(dueTime),
            reminderEnabled,
            priority,
            dateAmbiguous,
            ambiguityNote: typeof ambiguityNote === 'string' && ambiguityNote.trim()
                ? ambiguityNote.trim()
                : undefined,
        };
    });
};
