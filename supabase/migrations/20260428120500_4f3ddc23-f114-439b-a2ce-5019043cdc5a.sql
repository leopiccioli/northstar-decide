-- 1. Borrar cron muerto
SELECT cron.unschedule('send-legacy-notifications-batch');

-- 2. Bajar reminders a 2x/día
SELECT cron.unschedule('send-pending-reminders');
SELECT cron.schedule(
  'send-pending-reminders',
  '0 9,21 * * *',
  $cmd$
  select net.http_post(
    url:='https://bcokciysbyuaeodnsxas.supabase.co/functions/v1/send-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjb2tjaXlzYnl1YWVvZG5zeGFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NjA4NjYsImV4cCI6MjA4NTAzNjg2Nn0.o-FypP4qFfQLfx4E9BpXKnbnOPR2EgFqsihl6W2jUrw"}'::jsonb,
    body:='{}'::jsonb
  );
  $cmd$
);

-- 3. Limpiar basura acumulada
TRUNCATE net._http_response;
DELETE FROM cron.job_run_details WHERE start_time < now() - interval '7 days';

-- 4. Cron diario de limpieza
SELECT cron.schedule(
  'cleanup-system-logs-daily',
  '0 4 * * *',
  $cmd$
    DELETE FROM net._http_response WHERE created < now() - interval '7 days';
    DELETE FROM cron.job_run_details WHERE start_time < now() - interval '7 days';
  $cmd$
);