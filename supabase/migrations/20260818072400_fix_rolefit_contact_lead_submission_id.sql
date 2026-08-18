-- Fix the required internal lead submission identifier without changing Contact form fields.

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
    submission_id,
    name,
    email,
    company_name,
    message,
    source_context,
    report_id
  )
  values (
    p_lead_id,
    gen_random_uuid(),
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
