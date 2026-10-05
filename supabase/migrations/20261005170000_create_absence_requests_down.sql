-- Migration Down: 20261005170000_create_absence_requests_down.sql

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.absence_requests;
  END IF;
END $$;

DROP TABLE IF EXISTS public.absence_requests CASCADE;
