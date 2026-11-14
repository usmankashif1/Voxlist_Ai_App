create table public.ai_voice_reservations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    expires_at timestamptz not null,
    transcription_claimed boolean not null default false,
    extraction_claimed boolean not null default false
);

create index ai_voice_reservations_expires_at_idx
    on public.ai_voice_reservations (expires_at);

alter table public.ai_voice_reservations enable row level security;
revoke all on table public.ai_voice_reservations from public, anon, authenticated;

create or replace function public.reserve_ai_voice_request(
    p_user_id uuid,
    p_is_guest boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    current_day_utc date := (now() at time zone 'UTC')::date;
    current_minute timestamptz := date_trunc('minute', now() at time zone 'UTC') at time zone 'UTC';
    daily_limit integer;
    user_usage public.ai_user_usage%rowtype;
    global_request_count integer;
    daily_count integer;
    minute_count integer;
    new_daily_count integer;
    new_minute_count integer;
    reservation_id uuid;
begin
    if p_user_id is null or p_is_guest is null then
        return jsonb_build_object(
            'allowed', false,
            'reason', 'authentication_required',
            'reservationId', null,
            'dailyCount', 0,
            'dailyLimit', 0,
            'minuteCount', 0,
            'minuteLimit', 5,
            'globalCount', 0,
            'globalLimit', 480
        );
    end if;

    daily_limit := case when p_is_guest then 10 else 15 end;

    insert into public.ai_user_usage (
        user_id,
        usage_day,
        daily_count,
        minute_bucket,
        minute_count
    )
    values (p_user_id, current_day_utc, 0, current_minute, 0)
    on conflict (user_id) do nothing;

    insert into public.ai_global_usage (usage_day, request_count)
    values (current_day_utc, 0)
    on conflict (usage_day) do nothing;

    select *
    into user_usage
    from public.ai_user_usage
    where user_id = p_user_id
    for update;

    select request_count
    into global_request_count
    from public.ai_global_usage
    where usage_day = current_day_utc
    for update;

    daily_count := case
        when user_usage.usage_day = current_day_utc then user_usage.daily_count
        else 0
    end;
    minute_count := case
        when user_usage.minute_bucket = current_minute then user_usage.minute_count
        else 0
    end;

    if global_request_count >= 480 then
        return jsonb_build_object(
            'allowed', false,
            'reason', 'daily_global',
            'reservationId', null,
            'dailyCount', daily_count,
            'dailyLimit', daily_limit,
            'minuteCount', minute_count,
            'minuteLimit', 5,
            'globalCount', global_request_count,
            'globalLimit', 480
        );
    end if;

    if daily_count >= daily_limit then
        return jsonb_build_object(
            'allowed', false,
            'reason', 'daily_user',
            'reservationId', null,
            'dailyCount', daily_count,
            'dailyLimit', daily_limit,
            'minuteCount', minute_count,
            'minuteLimit', 5,
            'globalCount', global_request_count,
            'globalLimit', 480
        );
    end if;

    if minute_count >= 5 then
        return jsonb_build_object(
            'allowed', false,
            'reason', 'per_minute',
            'reservationId', null,
            'dailyCount', daily_count,
            'dailyLimit', daily_limit,
            'minuteCount', minute_count,
            'minuteLimit', 5,
            'globalCount', global_request_count,
            'globalLimit', 480
        );
    end if;

    new_daily_count := daily_count + 1;
    new_minute_count := minute_count + 1;
    reservation_id := gen_random_uuid();

    update public.ai_user_usage
    set usage_day = current_day_utc,
        daily_count = new_daily_count,
        minute_bucket = current_minute,
        minute_count = new_minute_count
    where user_id = p_user_id;

    update public.ai_global_usage
    set request_count = global_request_count + 1
    where usage_day = current_day_utc;

    insert into public.ai_voice_reservations (
        id,
        user_id,
        expires_at
    )
    values (reservation_id, p_user_id, now() + interval '30 minutes');

    delete from public.ai_voice_reservations
    where expires_at < now() - interval '1 day';

    return jsonb_build_object(
        'allowed', true,
        'reason', null,
        'reservationId', reservation_id,
        'dailyCount', new_daily_count,
        'dailyLimit', daily_limit,
        'minuteCount', new_minute_count,
        'minuteLimit', 5,
        'globalCount', global_request_count + 1,
        'globalLimit', 480
    );
end;
$$;

revoke all on function public.reserve_ai_voice_request(uuid, boolean)
    from public, anon, authenticated;
grant execute on function public.reserve_ai_voice_request(uuid, boolean)
    to service_role;

create or replace function public.claim_ai_voice_step(
    p_user_id uuid,
    p_reservation_id uuid,
    p_step text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
    reservation public.ai_voice_reservations%rowtype;
begin
    if p_user_id is null
        or p_reservation_id is null
        or p_step is null
        or p_step not in ('transcription', 'extraction') then
        return false;
    end if;

    select *
    into reservation
    from public.ai_voice_reservations
    where id = p_reservation_id
        and user_id = p_user_id
        and expires_at > now()
    for update;

    if not found then
        return false;
    end if;

    if p_step = 'transcription' then
        if reservation.transcription_claimed then
            return false;
        end if;
        update public.ai_voice_reservations
        set transcription_claimed = true
        where id = p_reservation_id;
    else
        if reservation.extraction_claimed then
            return false;
        end if;
        update public.ai_voice_reservations
        set extraction_claimed = true
        where id = p_reservation_id;
    end if;

    return true;
end;
$$;

revoke all on function public.claim_ai_voice_step(uuid, uuid, text)
    from public, anon, authenticated;
grant execute on function public.claim_ai_voice_step(uuid, uuid, text)
    to service_role;
