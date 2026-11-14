alter table public.tasks
    drop column if exists notification_id,
    drop column if exists owner_id;
