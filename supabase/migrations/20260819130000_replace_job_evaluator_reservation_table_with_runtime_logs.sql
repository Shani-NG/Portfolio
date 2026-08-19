-- Job evaluator quota is a technical extension of the approved runtime_logs ledger.
-- The existing, short-lived reservation table is migrated and then removed.

create unique index if not exists runtime_logs_job_evaluation_reserved_key_idx
  on public.runtime_logs ((details ->> 'evaluationKey'))
  where event_name = 'job.evaluation.reserved';

create unique index if not exists runtime_logs_job_evaluation_completed_key_idx
  on public.runtime_logs ((details ->> 'evaluationKey'))
  where event_name = 'job.evaluation.completed';

insert into public.runtime_logs (occurred_at, event_name, status, details)
select
  reservation.created_at,
  'job.evaluation.reserved',
  'success',
  jsonb_build_object(
    'evaluationKey', reservation.evaluation_key,
    'reservationDay', reservation.reservation_day::text
  )
from public.job_evaluator_reservations as reservation
where not exists (
  select 1
  from public.runtime_logs as runtime_log
  where runtime_log.event_name = 'job.evaluation.reserved'
    and runtime_log.details ->> 'evaluationKey' = reservation.evaluation_key
);

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

  if exists (
    select 1
    from public.runtime_logs
    where event_name = 'job.evaluation.reserved'
      and details ->> 'evaluationKey' = p_evaluation_key
  ) then
    select count(*)::integer into v_daily_count
    from public.runtime_logs
    where event_name = 'job.evaluation.reserved'
      and (occurred_at at time zone 'Asia/Jerusalem')::date = v_day;
    return query select 'reused'::text, v_daily_count;
    return;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('job-evaluator:' || v_day::text, 0));

  if exists (
    select 1
    from public.runtime_logs
    where event_name = 'job.evaluation.reserved'
      and details ->> 'evaluationKey' = p_evaluation_key
  ) then
    select count(*)::integer into v_daily_count
    from public.runtime_logs
    where event_name = 'job.evaluation.reserved'
      and (occurred_at at time zone 'Asia/Jerusalem')::date = v_day;
    return query select 'reused'::text, v_daily_count;
    return;
  end if;

  select count(*)::integer into v_daily_count
  from public.runtime_logs
  where event_name = 'job.evaluation.reserved'
    and (occurred_at at time zone 'Asia/Jerusalem')::date = v_day;
  if v_daily_count >= p_daily_limit then
    return query select 'limit_reached'::text, v_daily_count;
    return;
  end if;

  insert into public.runtime_logs (event_name, status, details)
  values (
    'job.evaluation.reserved',
    'success',
    jsonb_build_object('evaluationKey', p_evaluation_key, 'reservationDay', v_day::text)
  );
  return query select 'reserved'::text, v_daily_count + 1;
end;
$$;

create or replace function public.complete_job_evaluator_evaluation(
  p_evaluation_key text,
  p_outcome text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  if nullif(btrim(p_evaluation_key), '') is null then
    raise exception using errcode = '22023', message = 'job evaluator evaluation key is required';
  end if;
  if p_outcome not in ('ready', 'rejected', 'insufficient-evidence', 'validation-failed', 'quota-blocked', 'model-unavailable') then
    raise exception using errcode = '22023', message = 'job evaluator outcome is invalid';
  end if;

  v_status := case
    when p_outcome = 'ready' then 'success'
    when p_outcome = 'model-unavailable' then 'failure'
    else 'partial'
  end;

  insert into public.runtime_logs (event_name, status, details)
  values (
    'job.evaluation.completed',
    v_status,
    jsonb_build_object('evaluationKey', p_evaluation_key, 'outcome', p_outcome)
  )
  on conflict ((details ->> 'evaluationKey')) where (event_name = 'job.evaluation.completed') do nothing;

  return true;
end;
$$;

revoke all on function public.reserve_job_evaluator_slot(text, integer) from public, anon, authenticated;
revoke all on function public.complete_job_evaluator_evaluation(text, text) from public, anon, authenticated;
grant execute on function public.reserve_job_evaluator_slot(text, integer) to service_role;
grant execute on function public.complete_job_evaluator_evaluation(text, text) to service_role;

drop table public.job_evaluator_reservations;
