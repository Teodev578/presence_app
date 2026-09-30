-- Rollback: 20260930165500_harden_security_and_performance_down.sql
-- Description: Script de retour arrière restaurant l'état antérieur des politiques et fonctions.

-- 1. Restauration des politiques locations
DROP POLICY IF EXISTS "locations_insert_manager" ON public.locations;
DROP POLICY IF EXISTS "locations_update_manager" ON public.locations;
DROP POLICY IF EXISTS "locations_delete_manager" ON public.locations;

CREATE POLICY "locations_write_manager"
  ON public.locations
  FOR ALL
  TO authenticated
  USING (public.get_auth_user_role() = ANY (ARRAY['admin'::text, 'manager'::text]))
  WITH CHECK (public.get_auth_user_role() = ANY (ARRAY['admin'::text, 'manager'::text]));

-- 2. Restauration des politiques distinctes availabilities
DROP POLICY IF EXISTS "availabilities_select_authenticated" ON public.availabilities;

CREATE POLICY "availabilities_select_own"
  ON public.availabilities
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "availabilities_select_manager"
  ON public.availabilities
  FOR SELECT
  TO authenticated
  USING (
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
  );

-- 3. Restauration des politiques distinctes presences
DROP POLICY IF EXISTS "presences_select_authenticated" ON public.presences;

CREATE POLICY "presences_select_own"
  ON public.presences
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "presences_select_manager"
  ON public.presences
  FOR SELECT
  TO authenticated
  USING (
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
  );

-- 4. Restauration des permissions d'exécution par défaut
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_user_role() TO anon;
GRANT EXECUTE ON FUNCTION public.get_auth_user_team_id() TO anon;
