-- Setup hourly cron to invoke Edge Function process-reminders
-- Idempotent: enables extensions, creates invoker fn, and schedules if missing

begin;
-- Required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;
-- Function that invokes the Edge Function via HTTP using pg_net
create or replace function public.invoke_process_reminders()
returns void
language plpgsql
security definer
as $$
declare
  service_role_key text;
  supabase_url text;
  function_url text;
begin
  service_role_key := current_setting('app.settings.service_role_key', true);
  supabase_url := current_setting('app.settings.supabase_url', true);

  if service_role_key is null or supabase_url is null then
    raise notice 'Missing configuration: set app.settings.service_role_key and app.settings.supabase_url';
    return;
  end if;

  function_url := supabase_url || '/functions/v1/process-reminders';

  perform net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb
  );
exception when others then
  raise warning 'Failed to invoke process-reminders: %', sqlerrm;
end;
$$;
-- Schedule hourly if not already present
do $$
begin
  if not exists (select 1 from cron.job where jobname = 'process-appointment-reminders-hourly') then
    perform cron.schedule(
      'process-appointment-reminders-hourly',
      '0 * * * *',
      'select public.invoke_process_reminders();'
    );
  end if;
end; $$;
comment on function public.invoke_process_reminders() is 'Invokes Edge Function process-reminders to send 24h/1h reminders';
commit;
