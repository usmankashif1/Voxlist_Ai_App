alter table public.tasks
add column if not exists completed_subtasks jsonb not null default '[]'::jsonb;
