-- Migration: 20260922154925_004_create_presences.sql
-- Description: Création de la table presences (pointages, horodatages, coordonnées GPS et Outbox idempotence).

CREATE TABLE IF NOT EXISTS public.presences (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id),
  client_mutation_id UUID NOT NULL UNIQUE,
  work_date DATE NOT NULL,
  check_in_time TIMESTAMPTZ NOT NULL,
  check_out_time TIMESTAMPTZ DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'late', 'completed')),
  check_in_lat DOUBLE PRECISION NOT NULL,
  check_in_lng DOUBLE PRECISION NOT NULL,
  check_in_accuracy DOUBLE PRECISION NOT NULL,
  check_out_lat DOUBLE PRECISION DEFAULT NULL,
  check_out_lng DOUBLE PRECISION DEFAULT NULL,
  check_out_accuracy DOUBLE PRECISION DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Indexation B-Tree et contraintes d'unicité partielle (règle un pointage actif par jour calendaire)
CREATE UNIQUE INDEX IF NOT EXISTS uidx_presences_user_workdate_active
  ON public.presences (user_id, work_date)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_presences_user_id ON public.presences (user_id);
CREATE INDEX IF NOT EXISTS idx_presences_work_date ON public.presences (work_date);
CREATE INDEX IF NOT EXISTS idx_presences_location ON public.presences (location_id);
CREATE INDEX IF NOT EXISTS idx_presences_sync ON public.presences (user_id, updated_at);

-- Trigger d'horodatage
DROP TRIGGER IF EXISTS trg_presences_updated_at ON public.presences;
CREATE TRIGGER trg_presences_updated_at
  BEFORE UPDATE ON public.presences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Activation inconditionnelle de Row Level Security
ALTER TABLE public.presences ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "presences_insert_own" ON public.presences;
CREATE POLICY "presences_insert_own"
  ON public.presences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "presences_select_own" ON public.presences;
CREATE POLICY "presences_select_own"
  ON public.presences
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "presences_select_manager" ON public.presences;
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

DROP POLICY IF EXISTS "presences_update_own" ON public.presences;
CREATE POLICY "presences_update_own"
  ON public.presences
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
