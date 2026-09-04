-- Repair the Job Fit evaluator reservation lifecycle without storing canonical results.
-- The 120-second lease and legacy-v1 grace window cover the current envelope of up
-- to two 45-second provider attempts plus application overhead. Revisit both if the
-- Job Fit provider timeout changes. The existing v1 RPCs remain untouched for rollout.

create function public.reserve_job_evaluator_slot_v2(
  p_evaluation_key text,
  p_daily_limit integer default 5
)
returns table (
  outcome text,
  daily_count integer,
  attempt_token text,
  lease_expires_at text,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day date := (timezone('Asia/Jerusalem', now()))::date;
  v_daily_count integer;
  v_reservation public.runtime_logs%rowtype;
  v_has_reservation boolean;
  v_lifecycle text;
  v_lease_expires_at timestamptz;
  v_attempt_token text;
begin
  if nullif(btrim(p_evaluation_key), '') is null then
    raise exception using errcode = '22023', message = 'job evaluator evaluation key is required';
  end if;
  if p_daily_limit < 1 or p_daily_limit > 100 then
    raise exception using errcode = '22023', message = 'job evaluator daily limit must be between 1 and 100';
  end if;

  -- Fixed lock order for every reservation: daily quota first, evaluation key second.
  -- The day lock preserves race-safe quota accounting across different keys. The key
  -- lock makes lifecycle inspection and attempt-token acquisition atomic for one job.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('job-evaluator:' || v_day::text, 0));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('job-evaluator-key:' || p_evaluation_key, 0));

  select runtime_log.* into v_reservation
  from public.runtime_logs as runtime_log
  where runtime_log.event_name = 'job.evaluation.reserved'
    and runtime_log.details ->> 'evaluationKey' = p_evaluation_key;
  v_has_reservation := found;

  select count(*)::integer into v_daily_count
  from public.runtime_logs
  where event_name = 'job.evaluation.reserved'
    and (occurred_at at time zone 'Asia/Jerusalem')::date = v_day;

  if not v_has_reservation then
    if v_daily_count >= p_daily_limit then
      return query select 'limit_reached'::text, v_daily_count, null::text, null::text, null::integer;
      return;
    end if;

    v_attempt_token := pg_catalog.gen_random_uuid()::text;
    v_lease_expires_at := now() + interval '120 seconds';
    insert into public.runtime_logs (event_name, status, details)
    values (
      'job.evaluation.reserved',
      'success',
      jsonb_build_object(
        'evaluationKey', p_evaluation_key,
        'reservationDay', v_day::text,
        'lifecycle', 'active',
        'attemptToken', v_attempt_token,
        'attemptCount', 1,
        'leaseExpiresAt', v_lease_expires_at::text
      )
    );
    return query select 'reserved'::text, v_daily_count + 1, v_attempt_token, v_lease_expires_at::text, null::integer;
    return;
  end if;

  v_lifecycle := coalesce(v_reservation.details ->> 'lifecycle', 'legacy');
  if v_lifecycle = 'active' then
    v_lease_expires_at := nullif(v_reservation.details ->> 'leaseExpiresAt', '')::timestamptz;
  elsif v_lifecycle = 'legacy' then
    -- A legacy reservation without completion may still represent an active request.
    -- A completion row is metadata only and never a replayable evaluator result.
    if not exists (
      select 1 from public.runtime_logs
      where event_name = 'job.evaluation.completed'
        and details ->> 'evaluationKey' = p_evaluation_key
    ) then
      v_lease_expires_at := v_reservation.occurred_at + interval '120 seconds';
    end if;
  end if;

  if v_lease_expires_at is not null and v_lease_expires_at > now() then
    return query select
      'in_progress'::text,
      v_daily_count,
      null::text,
      v_lease_expires_at::text,
      greatest(1, ceil(extract(epoch from (v_lease_expires_at - now())))::integer);
    return;
  end if;

  -- Retryable, expired, completed-without-result, and old legacy reservations all
  -- acquire a fresh fenced attempt. Updating the existing row preserves quota usage.
  v_attempt_token := pg_catalog.gen_random_uuid()::text;
  v_lease_expires_at := now() + interval '120 seconds';
  update public.runtime_logs
  set details = details || jsonb_build_object(
    'lifecycle', 'active',
    'attemptToken', v_attempt_token,
    'attemptCount', coalesce((details ->> 'attemptCount')::integer, 0) + 1,
    'leaseExpiresAt', v_lease_expires_at::text,
    'lastAttemptStartedAt', now()::text
  )
  where event_name = 'job.evaluation.reserved'
    and details ->> 'evaluationKey' = p_evaluation_key;

  return query select 'retry_reserved'::text, v_daily_count, v_attempt_token, v_lease_expires_at::text, null::integer;
end;
$$;

create function public.complete_job_evaluator_evaluation_v2(
  p_evaluation_key text,
  p_outcome text,
  p_attempt_token text,
  p_diagnostics jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_lifecycle text;
  v_updated integer;
begin
  if nullif(btrim(p_evaluation_key), '') is null then
    raise exception using errcode = '22023', message = 'job evaluator evaluation key is required';
  end if;
  if nullif(btrim(p_attempt_token), '') is null then
    raise exception using errcode = '22023', message = 'job evaluator attempt token is required';
  end if;
  if p_outcome not in ('ready', 'rejected', 'insufficient-evidence', 'validation-failed', 'quota-blocked', 'model-unavailable') then
    raise exception using errcode = '22023', message = 'job evaluator outcome is invalid';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('job-evaluator-key:' || p_evaluation_key, 0));

  v_lifecycle := case when p_outcome = 'model-unavailable' then 'retryable' else 'completed' end;
  v_status := case
    when p_outcome = 'ready' then 'success'
    when p_outcome = 'model-unavailable' then 'failure'
    else 'partial'
  end;

  update public.runtime_logs
  set details = details || jsonb_build_object(
    'lifecycle', v_lifecycle,
    'lastOutcome', p_outcome,
    'lastCompletedAt', now()::text,
    'leaseExpiresAt', null
  )
  where event_name = 'job.evaluation.reserved'
    and details ->> 'evaluationKey' = p_evaluation_key
    and details ->> 'lifecycle' = 'active'
    and details ->> 'attemptToken' = p_attempt_token;
  get diagnostics v_updated = row_count;

  -- A late completion from an expired owner is ignored and cannot overwrite a retry.
  if v_updated = 0 then
    return false;
  end if;

  insert into public.runtime_logs (occurred_at, event_name, status, details)
  values (
    now(),
    'job.evaluation.completed',
    v_status,
    jsonb_build_object(
      'evaluationKey', p_evaluation_key,
      'outcome', p_outcome,
      'attemptToken', p_attempt_token,
      'diagnostics', coalesce(p_diagnostics, '{}'::jsonb)
    )
  )
  on conflict ((details ->> 'evaluationKey')) where (event_name = 'job.evaluation.completed')
  do update set
    occurred_at = excluded.occurred_at,
    status = excluded.status,
    details = excluded.details;

  return true;
end;
$$;

revoke all on function public.reserve_job_evaluator_slot_v2(text, integer) from public, anon, authenticated;
revoke all on function public.complete_job_evaluator_evaluation_v2(text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.reserve_job_evaluator_slot_v2(text, integer) to service_role;
grant execute on function public.complete_job_evaluator_evaluation_v2(text, text, text, jsonb) to service_role;
