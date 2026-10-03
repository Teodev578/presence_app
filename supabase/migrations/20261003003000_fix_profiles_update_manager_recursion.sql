-- Migration: 20261003003000_fix_profiles_update_manager_recursion.sql
-- Description: Élimine la récursion infinie (erreur 42P17) dans la politique RLS profiles_update_manager
--              en utilisant la fonction SECURITY DEFINER public.get_auth_user_role().
-- Conforme aux standards : .agents/rules/05-supabase-rls-and-schema.md

DROP POLICY IF EXISTS "profiles_update_manager" ON public.profiles;

CREATE POLICY "profiles_update_manager"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    public.get_auth_user_role() IN ('admin', 'manager')
  )
  WITH CHECK (
    public.get_auth_user_role() IN ('admin', 'manager')
  );
