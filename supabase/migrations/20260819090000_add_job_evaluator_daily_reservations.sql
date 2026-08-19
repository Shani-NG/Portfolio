-- Central Job-Fit Evaluator quota is intentionally separate from public RoleFit reports.
create table if not exists public.job_evaluator_reservations (
  evaluation_key text primary key,
  reservation_day date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_evaluator_reservations_day_idx
  on public.job_evaluator_reservations (reservation_day);

create or replace function public.reserve_job_evaluator_slot(
  p_evaluation_key text,
  p_daily_limit integer default 5
)
returns table (
  outcome text,
  daily_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day date := (timezone('Asia/Jerusalem', now()))::date;
  v_daily_count integer;
begin
  if nullif(btrim(p_evaluation_key), '') is null then
    raise exception using errcode = '22023', message = 'job evaluator evaluation key is required';
  end if;
  if p_daily_limit < 1 or p_daily_limit > 100 then
    raise exception using errcode = '22023', message = 'job evaluator daily limit must be between 1 and 100';
  end if;

  -- A retry always reuses its first reservation, even if it crosses midnight.
  if exists (select 1 from public.job_evaluator_reservations where evaluation_key = p_evaluation_key) then
    select count(*)::integer into v_daily_count
      from public.job_evaluator_reservations where reservation_day = v_day;
    return query select 'reused'::text, v_daily_count;
    return;
  end if;

  -- Serializes new reservations for the relevant calendar day.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('job-evaluator:' || v_day::text, 0));
  select count(*)::integer into v_daily_count
    from public.job_evaluator_reservations where reservation_day = v_day;
  if v_daily_count >= p_daily_limit then
    return query select 'limit_reached'::text, v_daily_count;
    return;
  end if;

  insert into public.job_evaluator_reservations (evaluation_key, reservation_day)
  values (p_evaluation_key, v_day)
  on conflict (evaluation_key) do nothing;

  if found then
    return query select 'reserved'::text, v_daily_count + 1;
  end if;
  return query select 'reused'::text, v_daily_count;
end;
$$;

revoke all on table public.job_evaluator_reservations from public, anon, authenticated;
revoke all on function public.reserve_job_evaluator_slot(text, integer) from public, anon, authenticated;
grant execute on function public.reserve_job_evaluator_slot(text, integer) to service_role;
