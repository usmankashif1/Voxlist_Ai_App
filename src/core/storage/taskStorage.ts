import * as SQLite from 'expo-sqlite';
import type { ExtractedTask, Task, TaskPriority } from '../../screens/home/home.types';

export interface SyncTaskRow {
    id: string;
    title: string;
    subtasks: string;
    completed_subtasks: string;
    due_date: string | null;
    due_time: string | null;
    reminder_enabled: number;
    priority: TaskPriority;
    date_ambiguous: number;
    ambiguity_note: string | null;
    created_at: string;
    is_completed: number;
    notification_id: string | null;
    owner_id: string | null;
    sync_status: 'pending' | 'synced' | 'deleted';
    is_deleted: number;
    updated_at: string;
}

export interface CloudTask {
    id: string;
    user_id: string;
    title: string;
    subtasks: string[];
    completed_subtasks: boolean[];
    due_date: string | null;
    due_time: string | null;
    reminder_enabled: boolean;
    priority: TaskPriority;
    date_ambiguous: boolean;
    ambiguity_note: string | null;
    is_completed: boolean;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
}

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

const parseSubtasks = (value: string): string[] => {
    try {
        const parsed: unknown = JSON.parse(value);
        if (Array.isArray(parsed) && parsed.every(subtask => typeof subtask === 'string')) {
            return parsed;
        }
    } catch (error) {
        console.error('Could not read saved task subtasks.', error);
    }

    throw new Error('Saved task subtasks are invalid. Please contact support.');
};

const normalizeCompletedSubtasks = (
    completedSubtasks: boolean[] | null | undefined,
    subtasks: string[],
): boolean[] => subtasks.map((_, index) => completedSubtasks?.[index] === true);

const parseCompletedSubtasks = (value: string, subtaskCount: number): boolean[] => {
    try {
        const parsed: unknown = JSON.parse(value);
        if (Array.isArray(parsed) && parsed.every(completed => typeof completed === 'boolean')) {
            return Array.from({ length: subtaskCount }, (_, index) => parsed[index] === true);
        }
    } catch (error) {
        console.error('Could not read saved subtask completion states.', error);
    }

    throw new Error('Saved subtask completion states are invalid. Please contact support.');
};

const getDatabase = (): Promise<SQLite.SQLiteDatabase> => {
    if (!databasePromise) {
        databasePromise = SQLite.openDatabaseAsync('voice-tasks.db')
            .then(async database => {
                await database.execAsync(`
                    PRAGMA journal_mode = WAL;
                    CREATE TABLE IF NOT EXISTS tasks (
                        id TEXT PRIMARY KEY NOT NULL,
                        title TEXT NOT NULL,
                        subtasks TEXT NOT NULL DEFAULT '[]',
                        completed_subtasks TEXT NOT NULL DEFAULT '[]',
                        due_date TEXT,
                        due_time TEXT,
                        reminder_enabled INTEGER NOT NULL DEFAULT 0,
                        priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
                        date_ambiguous INTEGER NOT NULL DEFAULT 0,
                        ambiguity_note TEXT,
                        created_at TEXT NOT NULL,
                        is_completed INTEGER NOT NULL DEFAULT 0,
                        notification_id TEXT,
                        owner_id TEXT,
                        sync_status TEXT NOT NULL DEFAULT 'pending',
                        is_deleted INTEGER NOT NULL DEFAULT 0,
                        updated_at TEXT NOT NULL DEFAULT ''
                    );
                    CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks(due_date, due_time);
                `);
                const columns = await database.getAllAsync<{ name: string }>(
                    'PRAGMA table_info(tasks)',
                );
                const hasLegacyDescription = columns.some(column => column.name === 'description');
                const addColumnIfMissing = async (name: string, definition: string) => {
                    if (!columns.some(column => column.name === name)) {
                        await database.execAsync(`ALTER TABLE tasks ADD COLUMN ${name} ${definition}`);
                    }
                };
                await addColumnIfMissing('subtasks', "TEXT NOT NULL DEFAULT '[]'");
                await addColumnIfMissing('completed_subtasks', "TEXT NOT NULL DEFAULT '[]'");
                await addColumnIfMissing('owner_id', 'TEXT');
                await addColumnIfMissing("sync_status", "TEXT NOT NULL DEFAULT 'pending'");
                await addColumnIfMissing('is_deleted', 'INTEGER NOT NULL DEFAULT 0');
                await addColumnIfMissing("updated_at", "TEXT NOT NULL DEFAULT ''");
                await database.execAsync(
                    "UPDATE tasks SET updated_at = created_at WHERE updated_at = ''",
                );

                if (hasLegacyDescription) {
                    const legacyDescriptions = await database.getAllAsync<{
                        id: string;
                        description: string;
                    }>(
                        `SELECT id, description FROM tasks
                        WHERE description IS NOT NULL AND TRIM(description) != ''
                        AND subtasks = '[]'`,
                    );
                    for (const row of legacyDescriptions) {
                        await database.runAsync(
                            'UPDATE tasks SET subtasks = ? WHERE id = ?',
                            JSON.stringify([row.description]),
                            row.id,
                        );
                    }
                }
                return database;
            })
            .catch(error => {
                databasePromise = null;
                throw error;
            });
    }
    return databasePromise;
};

const toTask = (row: SyncTaskRow): Task => {
    const subtasks = parseSubtasks(row.subtasks);
    return {
        id: row.id,
        title: row.title,
        subtasks,
        completedSubtasks: parseCompletedSubtasks(row.completed_subtasks, subtasks.length),
        dueDate: row.due_date,
        dueTime: row.due_time,
        reminderEnabled: row.reminder_enabled === 1,
        priority: row.priority,
        dateAmbiguous: row.date_ambiguous === 1,
        ambiguityNote: row.ambiguity_note ?? undefined,
        createdAt: row.created_at,
        isCompleted: row.is_completed === 1,
        notificationId: row.notification_id,
    };
};

const createTaskId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const getStoredTasks = async (userId: string | null): Promise<Task[]> => {
    const database = await getDatabase();
    const rows = await database.getAllAsync<SyncTaskRow>(
        userId
            ? `SELECT * FROM tasks
                WHERE is_deleted = 0 AND (owner_id = ? OR owner_id IS NULL)
                ORDER BY is_completed ASC, due_date IS NULL, due_date, due_time, created_at DESC`
            : `SELECT * FROM tasks
                WHERE is_deleted = 0 AND owner_id IS NULL
                ORDER BY is_completed ASC, due_date IS NULL, due_date, due_time, created_at DESC`,
        ...(userId ? [userId] : []),
    );
    return rows.map(toTask);
};

export const insertTasks = async (
    drafts: ExtractedTask[],
    userId: string | null,
): Promise<Task[]> => {
    const database = await getDatabase();
    const createdAt = new Date().toISOString();
    const tasks = drafts.map<Task>(draft => ({
        ...draft,
        completedSubtasks: draft.subtasks.map(() => false),
        id: createTaskId(),
        createdAt,
        isCompleted: false,
        notificationId: null,
    }));

    await database.withTransactionAsync(async () => {
        for (const task of tasks) {
            await database.runAsync(
                `INSERT INTO tasks (
                    id, title, subtasks, completed_subtasks, due_date, due_time, reminder_enabled,
                    priority, date_ambiguous, ambiguity_note, created_at,
                    is_completed, notification_id, owner_id, sync_status, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
                task.id,
                task.title,
                JSON.stringify(task.subtasks),
                JSON.stringify(task.completedSubtasks),
                task.dueDate,
                task.dueTime,
                task.reminderEnabled ? 1 : 0,
                task.priority,
                task.dateAmbiguous ? 1 : 0,
                task.ambiguityNote ?? null,
                task.createdAt,
                0,
                null,
                userId,
                task.createdAt,
            );
        }
    });
    return tasks;
};

export const updateStoredTask = async (task: Task): Promise<void> => {
    const database = await getDatabase();
    await database.runAsync(
        `UPDATE tasks SET
            title = ?, subtasks = ?, completed_subtasks = ?, due_date = ?, due_time = ?,
            reminder_enabled = ?, priority = ?, date_ambiguous = ?,
            ambiguity_note = ?, is_completed = ?, notification_id = ?,
            sync_status = 'pending', updated_at = ?
        WHERE id = ?`,
        task.title,
        JSON.stringify(task.subtasks),
        JSON.stringify(normalizeCompletedSubtasks(task.completedSubtasks, task.subtasks)),
        task.dueDate,
        task.dueTime,
        task.reminderEnabled ? 1 : 0,
        task.priority,
        task.dateAmbiguous ? 1 : 0,
        task.ambiguityNote ?? null,
        task.isCompleted ? 1 : 0,
        task.notificationId,
        new Date().toISOString(),
        task.id,
    );
};

export const updateStoredTasks = async (tasks: Task[]): Promise<void> => {
    const database = await getDatabase();
    const updatedAt = new Date().toISOString();

    await database.withTransactionAsync(async () => {
        for (const task of tasks) {
            const result = await database.runAsync(
                `UPDATE tasks SET
                    title = ?, subtasks = ?, completed_subtasks = ?, due_date = ?, due_time = ?,
                    reminder_enabled = ?, priority = ?, date_ambiguous = ?,
                    ambiguity_note = ?, is_completed = ?, notification_id = ?,
                    sync_status = 'pending', updated_at = ?
                WHERE id = ? AND is_deleted = 0`,
                task.title,
                JSON.stringify(task.subtasks),
                JSON.stringify(normalizeCompletedSubtasks(task.completedSubtasks, task.subtasks)),
                task.dueDate,
                task.dueTime,
                task.reminderEnabled ? 1 : 0,
                task.priority,
                task.dateAmbiguous ? 1 : 0,
                task.ambiguityNote ?? null,
                task.isCompleted ? 1 : 0,
                task.notificationId,
                updatedAt,
                task.id,
            );
            if (result.changes !== 1) {
                throw new Error(`Could not update task ${task.id}.`);
            }
        }
    });
};

export const updateStoredTaskNotificationId = async (
    task: Task,
    notificationId: string | null,
): Promise<boolean> => {
    const database = await getDatabase();
    const result = await database.runAsync(
        `UPDATE tasks SET notification_id = ?
        WHERE id = ? AND is_deleted = 0 AND title = ? AND subtasks = ?
        AND due_date IS ? AND due_time IS ? AND reminder_enabled = ?
        AND priority = ? AND date_ambiguous = ? AND ambiguity_note IS ?
        AND is_completed = ?`,
        notificationId,
        task.id,
        task.title,
        JSON.stringify(task.subtasks),
        task.dueDate,
        task.dueTime,
        task.reminderEnabled ? 1 : 0,
        task.priority,
        task.dateAmbiguous ? 1 : 0,
        task.ambiguityNote ?? null,
        task.isCompleted ? 1 : 0,
    );
    return result.changes > 0;
};

export const updateStoredSubtaskCompletion = async (
    task: Task,
    completedSubtasks: boolean[],
): Promise<void> => {
    const database = await getDatabase();
    const result = await database.runAsync(
        `UPDATE tasks SET
            completed_subtasks = ?, sync_status = 'pending', updated_at = ?
        WHERE id = ? AND subtasks = ? AND is_deleted = 0`,
        JSON.stringify(normalizeCompletedSubtasks(completedSubtasks, task.subtasks)),
        new Date().toISOString(),
        task.id,
        JSON.stringify(task.subtasks),
    );
    if (result.changes === 0) {
        throw new Error('This task changed. Refresh it and try again.');
    }
};

export const deleteStoredTask = async (id: string): Promise<void> => {
    const database = await getDatabase();
    const task = await database.getFirstAsync<{ owner_id: string | null }>(
        'SELECT owner_id FROM tasks WHERE id = ?',
        id,
    );
    if (!task || !task.owner_id) {
        await database.runAsync('DELETE FROM tasks WHERE id = ?', id);
        return;
    }

    const updatedAt = new Date().toISOString();
    await database.runAsync(
        `UPDATE tasks SET is_deleted = 1, sync_status = 'deleted', updated_at = ?
        WHERE id = ?`,
        updatedAt,
        id,
    );
};

export const restoreStoredDeletedTask = async (
    id: string,
    userId: string,
    deletedAt: string,
): Promise<boolean> => {
    const database = await getDatabase();
    const result = await database.runAsync(
        `UPDATE tasks SET is_deleted = 0, sync_status = 'pending', updated_at = ?
        WHERE id = ? AND owner_id = ? AND sync_status = 'deleted'
        AND is_deleted = 1 AND updated_at = ?`,
        new Date().toISOString(),
        id,
        userId,
        deletedAt,
    );
    return result.changes > 0;
};

export const claimGuestTasks = async (userId: string): Promise<void> => {
    const database = await getDatabase();
    await database.runAsync(
        `UPDATE tasks SET owner_id = ?, sync_status = 'pending'
        WHERE owner_id IS NULL AND is_deleted = 0`,
        userId,
    );
};

export const getPendingSyncTasks = async (userId: string): Promise<SyncTaskRow[]> => {
    const database = await getDatabase();
    return database.getAllAsync<SyncTaskRow>(
        `SELECT * FROM tasks
        WHERE owner_id = ? AND sync_status IN ('pending', 'deleted')
        ORDER BY updated_at ASC`,
        userId,
    );
};

export const markTaskSynced = async (
    id: string,
    userId: string,
    updatedAt: string,
): Promise<void> => {
    const database = await getDatabase();
    await database.runAsync(
        `UPDATE tasks SET sync_status = 'synced'
        WHERE id = ? AND owner_id = ? AND updated_at = ? AND sync_status IN ('pending', 'deleted')`,
        id,
        userId,
        updatedAt,
    );
};

export const removeSyncedDeletedTask = async (
    id: string,
    userId: string,
    updatedAt: string,
): Promise<void> => {
    const database = await getDatabase();
    await database.runAsync(
        `DELETE FROM tasks
        WHERE id = ? AND owner_id = ? AND updated_at = ?
        AND sync_status = 'deleted' AND is_deleted = 1`,
        id,
        userId,
        updatedAt,
    );
};

export const mergeCloudTask = async (task: CloudTask): Promise<void> => {
    const database = await getDatabase();
    const local = await database.getFirstAsync<SyncTaskRow>(
        'SELECT * FROM tasks WHERE id = ?',
        task.id,
    );

    if (local && local.owner_id !== task.user_id) return;
    if (local?.sync_status === 'deleted') return;
    if (local) {
        const localUpdatedAt = Date.parse(local.updated_at);
        const remoteUpdatedAt = Date.parse(task.updated_at);
        const localIsPending = local.sync_status === 'pending';
        if (
            localUpdatedAt > remoteUpdatedAt
            || (localIsPending && localUpdatedAt === remoteUpdatedAt)
        ) {
            if (!localIsPending) {
                await database.runAsync(
                    "UPDATE tasks SET sync_status = 'pending' WHERE id = ? AND owner_id = ?",
                    local.id,
                    task.user_id,
                );
            }
            return;
        }
    }

    if (task.is_deleted) {
        if (local) {
            await database.runAsync('DELETE FROM tasks WHERE id = ?', task.id);
        }
        return;
    }

    const completedSubtasks = normalizeCompletedSubtasks(
        task.completed_subtasks,
        task.subtasks,
    );
    const values = [
        task.id,
        task.title,
        JSON.stringify(task.subtasks),
        JSON.stringify(completedSubtasks),
        task.due_date,
        task.due_time,
        task.reminder_enabled ? 1 : 0,
        task.priority,
        task.date_ambiguous ? 1 : 0,
        task.ambiguity_note,
        task.created_at,
        task.is_completed ? 1 : 0,
        local?.notification_id ?? null,
        task.user_id,
        task.updated_at,
    ];

    await database.runAsync(
        `INSERT INTO tasks (
            id, title, subtasks, completed_subtasks, due_date, due_time, reminder_enabled, priority,
            date_ambiguous, ambiguity_note, created_at, is_completed, notification_id,
            owner_id, sync_status, updated_at, is_deleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, 0)
        ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            subtasks = excluded.subtasks,
            completed_subtasks = excluded.completed_subtasks,
            due_date = excluded.due_date,
            due_time = excluded.due_time,
            reminder_enabled = excluded.reminder_enabled,
            priority = excluded.priority,
            date_ambiguous = excluded.date_ambiguous,
            ambiguity_note = excluded.ambiguity_note,
            created_at = excluded.created_at,
            is_completed = excluded.is_completed,
            owner_id = excluded.owner_id,
            sync_status = 'synced',
            updated_at = excluded.updated_at,
            is_deleted = 0`,
        ...values,
    );
};

export const toCloudTask = (task: SyncTaskRow, userId: string): CloudTask => {
    const subtasks = parseSubtasks(task.subtasks);
    return {
        id: task.id,
        user_id: userId,
        title: task.title,
        subtasks,
        completed_subtasks: parseCompletedSubtasks(
            task.completed_subtasks,
            subtasks.length,
        ),
        due_date: task.due_date,
        due_time: task.due_time,
        reminder_enabled: task.reminder_enabled === 1,
        priority: task.priority,
        date_ambiguous: task.date_ambiguous === 1,
        ambiguity_note: task.ambiguity_note,
        is_completed: task.is_completed === 1,
        created_at: task.created_at,
        updated_at: task.updated_at,
        is_deleted: task.is_deleted === 1,
    };
};
