alter table public.tasks
add column if not exists completed_subtasks jsonb not null default '[]'::jsonb;

alter table public.tasks
add column if not exists is_deleted boolean not null default false;

alter table public.tasks
add column if not exists notification_id text;

alter table public.tasks
add column if not exists owner_id uuid;

alter table public.tasks
add column if not exists sync_status text not null default 'synced';

create index if not exists tasks_user_updated_at_idx
on public.tasks (user_id, updated_at desc);
