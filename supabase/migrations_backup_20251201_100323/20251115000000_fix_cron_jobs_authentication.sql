-- Migration: Fix Cron Jobs Authentication
-- Description: Add authentication headers to cron jobs for process-reminders and appointment-status-updater
-- Date: 2025-11-15

-- Eliminar los cron jobs existentes
SELECT cron.unschedule('process-appointment-reminders');
SELECT cron.unschedule('appointment-status-updater');
-- Recrear cron job para process-reminders con autenticación
SELECT cron.schedule(
  'process-appointment-reminders',
  '*/30 * * * *', -- Cada 30 minutos
  $$
  SELECT
    net.http_post(
      url := 'https://dkancockzvcqorqbwtyh.supabase.co/functions/v1/process-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYW5jb2NrenZjcW9ycWJ3dHloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTM5MDQsImV4cCI6MjA3MjM4OTkwNH0.tUZY4n2QLQCM3mLn4MrR-mN4fMhJkkHizy993SKx-o4',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYW5jb2NrenZjcW9ycWJ3dHloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTM5MDQsImV4cCI6MjA3MjM4OTkwNH0.tUZY4n2QLQCM3mLn4MrR-mN4fMhJkkHizy993SKx-o4'
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 10000
    );
  $$
);
-- Recrear cron job para appointment-status-updater con autenticación
SELECT cron.schedule(
  'appointment-status-updater',
  '*/30 * * * *', -- Cada 30 minutos
  $$
  SELECT
    net.http_post(
      url := 'https://dkancockzvcqorqbwtyh.supabase.co/functions/v1/appointment-status-updater',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYW5jb2NrenZjcW9ycWJ3dHloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTM5MDQsImV4cCI6MjA3MjM4OTkwNH0.tUZY4n2QLQCM3mLn4MrR-mN4fMhJkkHizy993SKx-o4',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYW5jb2NrenZjcW9ycWJ3dHloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTM5MDQsImV4cCI6MjA3MjM4OTkwNH0.tUZY4n2QLQCM3mLn4MrR-mN4fMhJkkHizy993SKx-o4'
      ),
      body := jsonb_build_object(
        'source', 'cron_job',
        'timestamp', extract(epoch from now())
      ),
      timeout_milliseconds := 10000
    );
  $$
);
-- Comentario de validación
COMMENT ON EXTENSION pg_cron IS 'Cron jobs configurados con autenticación: process-appointment-reminders y appointment-status-updater ejecutándose cada 30 minutos';
