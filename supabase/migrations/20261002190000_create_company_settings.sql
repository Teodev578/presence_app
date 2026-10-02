-- Migration: 20261002190000_create_company_settings.sql
-- Description: Création de la table company_settings (horaire général et paramètres d'organisation) avec RLS.

CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  company_name TEXT NOT NULL DEFAULT 'Mon Entreprise',
  expected_arrival_time TIME NOT NULL DEFAULT '09:00:00'::TIME,
  expected_departure_time TIME NOT NULL DEFAULT '18:00:00'::TIME,
  late_tolerance_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Indexation B-Tree
CREATE INDEX IF NOT EXISTS idx_company_settings_updated_at ON public.company_settings (updated_at);

-- Trigger d'horodatage
DROP TRIGGER IF EXISTS trg_company_settings_updated_at ON public.company_settings;
CREATE TRIGGER trg_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Activation inconditionnelle de Row Level Security
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "company_settings_select_authenticated" ON public.company_settings;
CREATE POLICY "company_settings_select_authenticated"
  ON public.company_settings
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "company_settings_insert_manager" ON public.company_settings;
CREATE POLICY "company_settings_insert_manager"
  ON public.company_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_auth_user_role() IN ('manager', 'admin'));

DROP POLICY IF EXISTS "company_settings_update_manager" ON public.company_settings;
CREATE POLICY "company_settings_update_manager"
  ON public.company_settings
  FOR UPDATE
  TO authenticated
  USING (public.get_auth_user_role() IN ('manager', 'admin'))
  WITH CHECK (public.get_auth_user_role() IN ('manager', 'admin'));

-- Ligne initiale d'organisation par défaut (Singleton)
INSERT INTO public.company_settings (id, company_name, expected_arrival_time, expected_departure_time)
VALUES ('00000000-0000-0000-0000-000000000001', 'Mon Entreprise', '09:00:00', '18:00:00')
ON CONFLICT (id) DO NOTHING;
