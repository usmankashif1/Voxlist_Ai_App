create table public.ai_user_usage (
    user_id uuid primary key references auth.users (id) on delete cascade,
    usage_day date not null,
    daily_count integer not null default 0,
    minute_bucket timestamptz not null,
    minute_count integer not null default 0
);

create table public.ai_global_usage (
    usage_day date primary key,
    request_count integer not null default 0
);

alter table public.ai_user_usage enable row level security;
alter table public.ai_global_usage enable row level security;

revoke all on table public.ai_user_usage from anon, authenticated;
revoke all on table public.ai_global_usage from anon, authenticated;

create or replace function public.consume_ai_request(
    p_user_id uuid,
    p_is_guest boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    current_user_id uuid := p_user_id;
    current_day_utc date := (now() at time zone 'UTC')::date;
    current_minute timestamptz := date_trunc('minute', now() at time zone 'UTC') at time zone 'UTC';
    daily_limit integer;
    user_usage public.ai_user_usage%rowtype;
    global_request_count integer;
begin
    if current_user_id is null or p_is_guest is null then
        return jsonb_build_object('allowed', false, 'reason', 'authentication_required');
    end if;

    if p_is_guest then
        daily_limit := 10;
    else
        daily_limit := 40;
    end if;

    insert into public.ai_user_usage (
        user_id,
        usage_day,
        daily_count,
        minute_bucket,
        minute_count
    )
    values (current_user_id, current_day_utc, 0, current_minute, 0)
    on conflict (user_id) do nothing;

    insert into public.ai_global_usage (usage_day, request_count)
    values (current_day_utc, 0)
    on conflict (usage_day) do nothing;

    select *
    into user_usage
    from public.ai_user_usage
    where user_id = current_user_id
    for update;

    select request_count
    into global_request_count
    from public.ai_global_usage
    where usage_day = current_day_utc
    for update;

    if global_request_count >= 200 then
        return jsonb_build_object('allowed', false, 'reason', 'daily_global');
    end if;

    if user_usage.usage_day = current_day_utc
        and user_usage.daily_count >= daily_limit then
        return jsonb_build_object('allowed', false, 'reason', 'daily_user');
    end if;

    if user_usage.minute_bucket = current_minute
        and user_usage.minute_count >= 5 then
        return jsonb_build_object('allowed', false, 'reason', 'per_minute');
    end if;

    update public.ai_user_usage
    set usage_day = current_day_utc,
        daily_count = case
            when user_usage.usage_day = current_day_utc then user_usage.daily_count + 1
            else 1
        end,
        minute_bucket = current_minute,
        minute_count = case
            when user_usage.minute_bucket = current_minute then user_usage.minute_count + 1
            else 1
        end
    where user_id = current_user_id;

    update public.ai_global_usage
    set request_count = global_request_count + 1
    where usage_day = current_day_utc;

    return jsonb_build_object('allowed', true);
end;
$$;

revoke all on function public.consume_ai_request(uuid, boolean) from public, anon, authenticated;
grant execute on function public.consume_ai_request(uuid, boolean) to service_role;
