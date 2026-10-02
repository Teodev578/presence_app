-- Migration: 20261002220000_account_lifecycle_and_session_confirmation.sql
-- Description: Cycle de vie des comptes utilisateurs, validation de session, archivage réversible, désactivation 30j et purge automatique 7j.
-- Conforme aux standards : .agents/rules/05-supabase-rls-and-schema.md

-- ============================================================================
-- 1. Évolution de la table public.profiles
-- ============================================================================

-- Ajout des colonnes avec valeur par défaut transitoire 'active' pour préserver l'accès des comptes existants
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending_validation', 'active', 'archived', 'disabled')),
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- Bascule de la valeur par défaut à 'pending_validation' pour toute nouvelle inscription
ALTER TABLE public.profiles
  ALTER COLUMN status SET DEFAULT 'pending_validation';

-- Indexation B-Tree pour les requêtes de filtrage par statut et calculs d'échéances
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles (status);
CREATE INDEX IF NOT EXISTS idx_profiles_archived_at ON public.profiles (archived_at);

-- ============================================================================
-- 2. Mise à jour de la fonction trigger à l'inscription auth.users
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
    'pending_validation'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN public.profiles.full_name = '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 3. Politiques RLS (Row Level Security) sur public.profiles
-- ============================================================================

-- 3.1 Lecture : l'utilisateur accède à son profil ; les managers voient leur équipe et les profils sans équipe ; les admins voient tout
ALTER POLICY "profiles_select_authenticated"
  ON public.profiles
  USING (
    (deleted_at IS NULL) AND (
      (id = (SELECT auth.uid()))
      OR (public.get_auth_user_role() = 'admin')
      OR (
        (public.get_auth_user_role() = 'manager')
        AND (
          (team_id IS NOT NULL AND team_id = public.get_auth_user_team_id())
          OR (team_id IS NULL)
        )
      )
    )
  );

-- 3.2 Modification par les managers et administrateurs (validation, affectation d'équipe, archivage)
DROP POLICY IF EXISTS "profiles_update_manager" ON public.profiles;
CREATE POLICY "profiles_update_manager"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'manager')
    )
  );

-- ============================================================================
-- 4. Procédure stockée de nettoyage et d'expiration des comptes
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_profiles()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INT := 0;
  v_disabled_count INT := 0;
BEGIN
  -- 1. Suppression définitive des comptes auth.users non validés après 7 jours (cascade sur profiles)
  DELETE FROM auth.users
  WHERE id IN (
    SELECT p.id
    FROM public.profiles p
    WHERE p.status = 'pending_validation'
      AND p.created_at < (clock_timestamp() - INTERVAL '7 days')
  );
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- 2. Désactivation des comptes archivés depuis plus de 30 jours (données préservées)
  UPDATE public.profiles
  SET status = 'disabled',
      is_active = false,
      updated_at = clock_timestamp()
  WHERE status = 'archived'
    AND archived_at IS NOT NULL
    AND archived_at < (clock_timestamp() - INTERVAL '30 days');
  GET DIAGNOSTICS v_disabled_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'purged_unvalidated_count', v_deleted_count,
    'deactivated_archived_count', v_disabled_count,
    'executed_at', clock_timestamp()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_expired_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_profiles() TO authenticated, service_role;

-- ============================================================================
-- 5. Planification automatique quotidienne via pg_cron
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule('daily-profile-lifecycle-cleanup');
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  PERFORM cron.schedule(
    'daily-profile-lifecycle-cleanup',
    '0 3 * * *',
    'SELECT public.cleanup_expired_profiles();'
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron scheduling warning: %', SQLERRM;
END;
$$;
