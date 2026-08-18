-- RoleFit completed-report persistence is server-side only.
-- This migration adds no sessions table and does not expose report persistence to browser roles.

create or replace function public.rolefit_completed_report_count(p_session_id text)
returns integer
language sql
security definer
set search_path = ''
stable
as $$
  select count(*)::integer
  from public.reports
  where session_id = p_session_id;
$$;

create or replace function public.persist_rolefit_completed_report(
  p_report_id text,
  p_session_id text,
  p_role_title text,
  p_company_name text,
  p_role_family text,
  p_location_or_work_model text,
  p_fit_label text,
  p_schema_version text,
  p_evidence_projects_used text[],
  p_contact_cta_clicked boolean,
  p_report_json jsonb
)
returns table (
  outcome text,
  completed_report_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_completed_report_count integer;
  v_inserted_count integer := 0;
begin
  if nullif(btrim(p_session_id), '') is null then
    raise exception using errcode = '22023', message = 'rolefit session_id is required';
  end if;

  -- Serializes completed-report persistence per exact runtime session identifier.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_session_id, 0));

  select count(*)::integer
  into v_completed_report_count
  from public.reports
  where session_id = p_session_id;

  -- A replay of a previously persisted report is idempotent, even after the limit.
  if exists (select 1 from public.reports where report_id = p_report_id) then
    return query select 'duplicate'::text, v_completed_report_count;
    return;
  end if;

  if v_completed_report_count >= 2 then
    return query select 'limit_reached'::text, v_completed_report_count;
    return;
  end if;

  insert into public.reports (
    report_id,
    session_id,
    role_title,
    company_name,
    role_family,
    location_or_work_model,
    fit_label,
    schema_version,
    evidence_projects_used,
    contact_cta_clicked,
    report_json
  )
  values (
    p_report_id,
    p_session_id,
    p_role_title,
    p_company_name,
    nullif(p_role_family, ''),
    nullif(p_location_or_work_model, ''),
    p_fit_label,
    p_schema_version,
    coalesce(p_evidence_projects_used, '{}'::text[]),
    coalesce(p_contact_cta_clicked, false),
    p_report_json
  )
  on conflict (report_id) do nothing;

  get diagnostics v_inserted_count = row_count;

  if v_inserted_count = 0 then
    select count(*)::integer
    into v_completed_report_count
    from public.reports
    where session_id = p_session_id;
    return query select 'duplicate'::text, v_completed_report_count;
    return;
  end if;

  return query select 'persisted'::text, v_completed_report_count + 1;
end;
$$;

revoke all on function public.rolefit_completed_report_count(text) from public, anon, authenticated;
revoke all on function public.persist_rolefit_completed_report(text, text, text, text, text, text, text, text, text[], boolean, jsonb) from public, anon, authenticated;
grant execute on function public.rolefit_completed_report_count(text) to service_role;
grant execute on function public.persist_rolefit_completed_report(text, text, text, text, text, text, text, text, text[], boolean, jsonb) to service_role;
