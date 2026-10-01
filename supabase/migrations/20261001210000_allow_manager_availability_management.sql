-- Migration: 20261001210000_allow_manager_availability_management.sql
-- Description: Autoriser les managers et administrateurs à insérer et mettre à jour les disponibilités des collaborateurs.

DROP POLICY IF EXISTS "availabilities_write_manager" ON public.availabilities;
CREATE POLICY "availabilities_write_manager"
  ON public.availabilities
  FOR ALL
  TO authenticated
  USING (
    public.get_auth_user_role() IN ('manager', 'admin')
  )
  WITH CHECK (
    public.get_auth_user_role() IN ('manager', 'admin')
  );
