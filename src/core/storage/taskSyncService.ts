import { getSupabaseClient } from '../auth/supabase';
import {
    claimGuestTasks,
    getPendingSyncTasks,
    markTaskSynced,
    mergeCloudTask,
    removeSyncedDeletedTask,
    toCloudTask,
    type CloudTask,
} from './taskStorage';

type TaskChangeListener = () => void;

const listeners = new Set<TaskChangeListener>();
const activeSyncs = new Map<string, Promise<void>>();
const requestedSyncs = new Set<string>();

export const notifyTaskChanges = (): void => {
    listeners.forEach(listener => listener());
};

export const subscribeToTaskChanges = (listener: TaskChangeListener) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

export const syncTasksForUser = (userId: string): Promise<void> => {
    const activeSync = activeSyncs.get(userId);
    if (activeSync) {
        requestedSyncs.add(userId);
        return activeSync;
    }

    const sync = (async () => {
        do {
            requestedSyncs.delete(userId);
            await performTaskSync(userId);
        } while (requestedSyncs.has(userId));
    })().finally(() => {
        requestedSyncs.delete(userId);
        activeSyncs.delete(userId);
    });
    activeSyncs.set(userId, sync);
    return sync;
};

const performTaskSync = async (userId: string): Promise<void> => {
    await claimGuestTasks(userId);

    const client = getSupabaseClient();
    const pageSize = 500;
    let offset = 0;
    while (true) {
        const { data, error } = await client
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: true })
            .range(offset, offset + pageSize - 1)
            .returns<CloudTask[]>();
        if (error) throw new Error(`Could not download account tasks: ${error.message}`);

        const remoteTasks = data;
        for (const remoteTask of remoteTasks) {
            await mergeCloudTask(remoteTask);
        }

        if (remoteTasks.length < pageSize) break;
        offset += pageSize;
    }

    const pendingTasks = await getPendingSyncTasks(userId);
    for (const task of pendingTasks) {
        if (task.sync_status !== 'deleted') continue;

        const { error } = await client
            .from('tasks')
            .delete()
            .eq('id', task.id)
            .eq('user_id', userId);
        if (error) {
            throw new Error(`Could not delete task ${task.id} from the account: ${error.message}`);
        }

        await removeSyncedDeletedTask(task.id, userId, task.updated_at);
    }

    const pendingUploads = pendingTasks.filter(task => task.sync_status === 'pending');
    const uploadBatchSize = 100;
    for (let index = 0; index < pendingUploads.length; index += uploadBatchSize) {
        const batch = pendingUploads.slice(index, index + uploadBatchSize);
        const cloudTasks = batch.map(task => toCloudTask(task, userId));
        const { error } = await client
            .from('tasks')
            .upsert(cloudTasks, { onConflict: 'id' });
        if (error) {
            throw new Error(`Could not upload task changes: ${error.message}`);
        }

        for (const task of batch) {
            await markTaskSynced(task.id, userId, task.updated_at);
        }
    }

    notifyTaskChanges();
};
