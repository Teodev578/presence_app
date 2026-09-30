-- Migration: 20260922154945_005_create_availabilities.sql
-- Description: Création de la table availabilities (disponibilités déclarées par semaine et jour).

CREATE TABLE IF NOT EXISTS public.availabilities (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_mutation_id UUID NOT NULL UNIQUE,
  week_start DATE NOT NULL CHECK (EXTRACT(isodow FROM week_start) = 1),
  day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
  slot TEXT NOT NULL DEFAULT 'full_day' CHECK (slot IN ('full_day', 'morning', 'afternoon')),
  note TEXT DEFAULT NULL,
  declared_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Indexation B-Tree et contraintes d'unicité partielle (un créneau actif par jour/semaine)
CREATE UNIQUE INDEX IF NOT EXISTS uidx_availabilities_active
  ON public.availabilities (user_id, week_start, day_of_week, slot)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_availabilities_user_id ON public.availabilities (user_id);
CREATE INDEX IF NOT EXISTS idx_availabilities_week ON public.availabilities (week_start);
CREATE INDEX IF NOT EXISTS idx_availabilities_sync ON public.availabilities (user_id, updated_at);

-- Trigger d'horodatage
DROP TRIGGER IF EXISTS trg_availabilities_updated_at ON public.availabilities;
CREATE TRIGGER trg_availabilities_updated_at
  BEFORE UPDATE ON public.availabilities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Activation inconditionnelle de Row Level Security
ALTER TABLE public.availabilities ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "availabilities_insert_own" ON public.availabilities;
CREATE POLICY "availabilities_insert_own"
  ON public.availabilities
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "availabilities_select_own" ON public.availabilities;
CREATE POLICY "availabilities_select_own"
  ON public.availabilities
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "availabilities_select_manager" ON public.availabilities;
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

DROP POLICY IF EXISTS "availabilities_update_own" ON public.availabilities;
CREATE POLICY "availabilities_update_own"
  ON public.availabilities
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
