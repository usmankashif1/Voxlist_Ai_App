create table if not exists public.ai_content_reports (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users (id) on delete set null,
    report_type text not null check (report_type in ('offensive', 'inaccurate', 'unsafe', 'other')),
    summary text not null,
    details text,
    task_id text,
    task_title text,
    ai_output text,
    source text not null default 'app' check (source in ('app', 'support')),
    app_version text,
    user_email text,
    created_at timestamptz not null default now()
);

alter table public.ai_content_reports enable row level security;

revoke all on table public.ai_content_reports from anon, authenticated;
grant insert on table public.ai_content_reports to authenticated;
grant select on table public.ai_content_reports to service_role;
grant insert on table public.ai_content_reports to service_role;
