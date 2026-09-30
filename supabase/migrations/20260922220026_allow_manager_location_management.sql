-- Migration: 20260922220026_allow_manager_location_management.sql
-- Description: Autorisation de gestion (INSERT, UPDATE, DELETE) des sites pour les gestionnaires et administrateurs.

DROP POLICY IF EXISTS "locations_write_manager" ON public.locations;
CREATE POLICY "locations_write_manager"
  ON public.locations
  FOR ALL
  TO authenticated
  USING (public.get_auth_user_role() = ANY (ARRAY['admin'::text, 'manager'::text]))
  WITH CHECK (public.get_auth_user_role() = ANY (ARRAY['admin'::text, 'manager'::text]));
