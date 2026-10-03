-- Migration Down: 20261003003000_fix_profiles_update_manager_recursion_down.sql

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
