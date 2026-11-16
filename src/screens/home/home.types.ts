export type TaskPriority = 'high' | 'medium' | 'low';

export interface ExtractedTask {
    title: string;
    subtasks: string[];
    dueDate: string | null;
    dueTime: string | null;
    reminderEnabled: boolean;
    priority: TaskPriority;
    dateAmbiguous: boolean;
    ambiguityNote?: string;
}

export interface Task extends ExtractedTask {
    id: string;
    createdAt: string;
    isCompleted: boolean;
    completedSubtasks: boolean[];
    notificationId: string | null;
}

export type TaskDateLabel = 'Overdue' | 'Today' | 'Tomorrow' | 'Upcoming' | 'No Date';

export type TaskCategory = TaskDateLabel | 'Completed';

export interface TaskSection {
    title: TaskCategory;
    data: Task[];
    dateLabel?: TaskDateLabel;
}
