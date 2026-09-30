-- Migration: 20260922154856_003_create_locations.sql
-- Description: Création de la table locations (sites géographiques et cercles de tolérance).

CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Indexation B-Tree
CREATE INDEX IF NOT EXISTS idx_locations_active ON public.locations (is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_locations_updated_at ON public.locations (updated_at);

-- Trigger d'horodatage
DROP TRIGGER IF EXISTS trg_locations_updated_at ON public.locations;
CREATE TRIGGER trg_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Activation inconditionnelle de Row Level Security
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Politiques RLS initiales
DROP POLICY IF EXISTS "locations_select_authenticated" ON public.locations;
CREATE POLICY "locations_select_authenticated"
  ON public.locations
  FOR SELECT
  TO authenticated
  USING (
    (public.get_auth_user_role() = ANY (ARRAY['admin'::text, 'manager'::text]))
    OR ((deleted_at IS NULL) AND (is_active = true))
  );

DROP POLICY IF EXISTS "locations_write_admin" ON public.locations;
CREATE POLICY "locations_write_admin"
  ON public.locations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
