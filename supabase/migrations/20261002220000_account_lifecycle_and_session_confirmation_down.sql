-- Migration DOWN: 20261002220000_account_lifecycle_and_session_confirmation_down.sql
-- Description: Révocation du cycle de vie des comptes et restauration du schéma antérieur.

-- 1. Annulation de la planification pg_cron
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    BEGIN
      PERFORM cron.unschedule('daily-profile-lifecycle-cleanup');
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END;
$$;

-- 2. Suppression de la procédure stockée
DROP FUNCTION IF EXISTS public.cleanup_expired_profiles();

-- 3. Restauration des politiques RLS
DROP POLICY IF EXISTS "profiles_update_manager" ON public.profiles;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    (deleted_at IS NULL) AND (
      (id = (SELECT auth.uid()))
      OR (public.get_auth_user_role() = 'admin')
      OR (
        (public.get_auth_user_role() = 'manager')
        AND (team_id IS NOT NULL)
        AND (team_id = public.get_auth_user_team_id())
      )
    )
  );

-- 4. Restauration du trigger d'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 5. Suppression des index et colonnes
DROP INDEX IF EXISTS public.idx_profiles_status;
DROP INDEX IF EXISTS public.idx_profiles_archived_at;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS confirmed_at,
  DROP COLUMN IF EXISTS archived_at;
