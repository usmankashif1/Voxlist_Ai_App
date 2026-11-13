create table if not exists public.tasks (
    id text primary key,
    user_id uuid not null references auth.users (id) on delete cascade,
    title text not null,
    subtasks jsonb not null default '[]'::jsonb,
    due_date text,
    due_time text,
    reminder_enabled boolean not null default false,
    priority text not null default 'medium'
        check (priority in ('low', 'medium', 'high')),
    date_ambiguous boolean not null default false,
    ambiguity_note text,
    is_completed boolean not null default false,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    is_deleted boolean not null default false
);

alter table public.tasks enable row level security;

revoke all on table public.tasks from anon, authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;

drop policy if exists "Users can read their own tasks" on public.tasks;
create policy "Users can read their own tasks"
on public.tasks
for select
to authenticated
using (
    user_id = (select auth.uid())
    and (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
);

drop policy if exists "Users can create their own tasks" on public.tasks;
create policy "Users can create their own tasks"
on public.tasks
for insert
to authenticated
with check (
    user_id = (select auth.uid())
    and (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
);

drop policy if exists "Users can update their own tasks" on public.tasks;
create policy "Users can update their own tasks"
on public.tasks
for update
to authenticated
using (
    user_id = (select auth.uid())
    and (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
)
with check (
    user_id = (select auth.uid())
    and (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
);

drop policy if exists "Users can delete their own tasks" on public.tasks;
create policy "Users can delete their own tasks"
on public.tasks
for delete
to authenticated
using (
    user_id = (select auth.uid())
    and (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
);

create index if not exists tasks_user_updated_at_idx
on public.tasks (user_id, updated_at desc);
