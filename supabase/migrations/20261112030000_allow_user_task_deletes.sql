grant delete on table public.tasks to authenticated;

drop policy if exists "Users can delete their own tasks" on public.tasks;
create policy "Users can delete their own tasks"
on public.tasks
for delete
to authenticated
using (
    user_id = (select auth.uid())
    and (auth.jwt() ->> 'is_anonymous') is distinct from 'true'
);
