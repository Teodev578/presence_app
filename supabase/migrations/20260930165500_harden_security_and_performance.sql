-- Migration: 20260930165500_harden_security_and_performance.sql
-- Description: Durcissement de sécurité (search_path, révocation RPC) et optimisation RLS (fusion des politiques permissives).
-- Conforme aux standards : .agents/rules/05-supabase-rls-and-schema.md

-- ============================================================================
-- 1. Sécurisation des search_path sur les fonctions PL/pgSQL & SQL (CWE-426)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END;
$$;

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

CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = (SELECT auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.get_auth_user_team_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT team_id FROM public.profiles WHERE id = (SELECT auth.uid());
$$;

-- ============================================================================
-- 2. Révocation des permissions RPC publiques sur les fonctions internes
-- ============================================================================

-- handle_new_user est un trigger interne à auth.users : aucun rôle externe ne doit pouvoir l'appeler via REST
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- get_auth_user_role et get_auth_user_team_id ne doivent pas être exécutables de façon anonyme
REVOKE EXECUTE ON FUNCTION public.get_auth_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_auth_user_team_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_auth_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_user_team_id() TO authenticated;

-- ============================================================================
-- 3. Optimisation des politiques RLS (Suppression des doublons permissifs)
-- ============================================================================

-- 3.1 Presences : Fusion de presences_select_own et presences_select_manager
DROP POLICY IF EXISTS "presences_select_own" ON public.presences;
DROP POLICY IF EXISTS "presences_select_manager" ON public.presences;
DROP POLICY IF EXISTS "presences_select_authenticated" ON public.presences;

CREATE POLICY "presences_select_authenticated"
  ON public.presences
  FOR SELECT
  TO authenticated
  USING (
    (user_id = (SELECT auth.uid()))
    OR (
      user_id IN (
        SELECT p.id
        FROM public.profiles p
        WHERE p.team_id = (
          SELECT pm.team_id
          FROM public.profiles pm
          WHERE pm.id = (SELECT auth.uid())
            AND pm.role IN ('manager', 'admin')
            AND pm.deleted_at IS NULL
        )
        AND p.deleted_at IS NULL
      )
    )
  );

-- 3.2 Availabilities : Fusion de availabilities_select_own et availabilities_select_manager
DROP POLICY IF EXISTS "availabilities_select_own" ON public.availabilities;
DROP POLICY IF EXISTS "availabilities_select_manager" ON public.availabilities;
DROP POLICY IF EXISTS "availabilities_select_authenticated" ON public.availabilities;

CREATE POLICY "availabilities_select_authenticated"
  ON public.availabilities
  FOR SELECT
  TO authenticated
  USING (
    (user_id = (SELECT auth.uid()))
    OR (
      (user_id IN (
        SELECT p.id
        FROM public.profiles p
        WHERE p.team_id = (
          SELECT pm.team_id
          FROM public.profiles pm
          WHERE pm.id = (SELECT auth.uid())
            AND pm.role IN ('manager', 'admin')
            AND pm.deleted_at IS NULL
        )
        AND p.deleted_at IS NULL
      ))
      AND (deleted_at IS NULL)
    )
  );

-- 3.3 Locations : Éviter le chevauchement du SELECT de locations_write_manager (ALL)
DROP POLICY IF EXISTS "locations_write_manager" ON public.locations;
DROP POLICY IF EXISTS "locations_insert_manager" ON public.locations;
DROP POLICY IF EXISTS "locations_update_manager" ON public.locations;
DROP POLICY IF EXISTS "locations_delete_manager" ON public.locations;

CREATE POLICY "locations_insert_manager"
  ON public.locations
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_auth_user_role() = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY "locations_update_manager"
  ON public.locations
  FOR UPDATE
  TO authenticated
  USING (public.get_auth_user_role() = ANY (ARRAY['admin'::text, 'manager'::text]))
  WITH CHECK (public.get_auth_user_role() = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY "locations_delete_manager"
  ON public.locations
  FOR DELETE
  TO authenticated
  USING (public.get_auth_user_role() = ANY (ARRAY['admin'::text, 'manager'::text]));
