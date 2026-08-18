-- Supabase-only RoleFit persistence for Contact leads and retained safe runtime events.
-- Browser roles remain unable to write these records directly.

create or replace function public.persist_rolefit_contact_lead(
  p_lead_id text,
  p_name text,
  p_email text,
  p_company_name text,
  p_message text,
  p_source_context text,
  p_report_id text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.leads (
    lead_id,
    name,
    email,
    company_name,
    message,
    source_context,
    report_id
  )
  values (
    p_lead_id,
    p_name,
    p_email,
    p_company_name,
    p_message,
    p_source_context,
    nullif(p_report_id, '')
  )
  on conflict (lead_id) do nothing;

  return true;
end;
$$;

create or replace function public.persist_rolefit_runtime_event(
  p_session_id text,
  p_event_name text,
  p_mode text,
  p_status text,
  p_report_id text,
  p_duration_ms integer,
  p_provider text,
  p_model text,
  p_error_code text,
  p_details jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.runtime_logs (
    session_id,
    event_name,
    mode,
    status,
    report_id,
    duration_ms,
    provider,
    model,
    error_code,
    details
  )
  values (
    nullif(p_session_id, ''),
    p_event_name,
    nullif(p_mode, ''),
    p_status,
    nullif(p_report_id, ''),
    p_duration_ms,
    nullif(p_provider, ''),
    nullif(p_model, ''),
    nullif(p_error_code, ''),
    coalesce(p_details, '{}'::jsonb)
  );

  return true;
end;
$$;

revoke all on function public.persist_rolefit_contact_lead(text, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.persist_rolefit_runtime_event(text, text, text, text, text, integer, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.persist_rolefit_contact_lead(text, text, text, text, text, text, text) to service_role;
grant execute on function public.persist_rolefit_runtime_event(text, text, text, text, text, integer, text, text, text, jsonb) to service_role;
