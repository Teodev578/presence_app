-- Migration: 20260922154820_001_create_teams.sql
-- Description: Création de la table teams, des index et de la fonction utilitaire set_updated_at.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Indexation B-Tree pour les requêtes et les jointures
CREATE INDEX IF NOT EXISTS idx_teams_updated_at ON public.teams (updated_at);
CREATE INDEX IF NOT EXISTS idx_teams_deleted_at ON public.teams (deleted_at) WHERE deleted_at IS NULL;

-- Trigger d'horodatage automatique
DROP TRIGGER IF EXISTS trg_teams_updated_at ON public.teams;
CREATE TRIGGER trg_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Activation inconditionnelle de Row Level Security
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Politique d'accès en lecture pour les utilisateurs authentifiés
DROP POLICY IF EXISTS "teams_select_authenticated" ON public.teams;
CREATE POLICY "teams_select_authenticated"
  ON public.teams
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);
