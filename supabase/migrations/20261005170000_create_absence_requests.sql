-- Migration: 20261005170000_create_absence_requests.sql
-- Description: Table absence_requests pour la gestion des demandes d'absence avec validation hiérarchique.

CREATE TABLE IF NOT EXISTS public.absence_requests (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_mutation_id UUID NOT NULL UNIQUE,
  week_start DATE NOT NULL CHECK (EXTRACT(isodow FROM week_start) = 1),
  days SMALLINT[] NOT NULL,
  note TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'validated', 'refused', 'cancelled')),
  decided_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT NULL,
  decided_at TIMESTAMPTZ DEFAULT NULL,
  decision_note TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Indexation B-Tree optimisée
CREATE INDEX IF NOT EXISTS idx_absence_requests_user_week
  ON public.absence_requests (user_id, week_start)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_absence_requests_sync
  ON public.absence_requests (user_id, updated_at);

CREATE INDEX IF NOT EXISTS idx_absence_requests_status
  ON public.absence_requests (status)
  WHERE deleted_at IS NULL;

-- Trigger de mise à jour automatique de updated_at
DROP TRIGGER IF EXISTS trg_absence_requests_updated_at ON public.absence_requests;
CREATE TRIGGER trg_absence_requests_updated_at
  BEFORE UPDATE ON public.absence_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Activation inconditionnelle de Row Level Security
ALTER TABLE public.absence_requests ENABLE ROW LEVEL SECURITY;

-- 1. Lecture de ses propres demandes par le collaborateur
DROP POLICY IF EXISTS "absence_requests_select_own" ON public.absence_requests;
CREATE POLICY "absence_requests_select_own"
  ON public.absence_requests
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- 2. Lecture des demandes par les gestionnaires et administrateurs de l'équipe
DROP POLICY IF EXISTS "absence_requests_select_manager" ON public.absence_requests;
CREATE POLICY "absence_requests_select_manager"
  ON public.absence_requests
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
    OR EXISTS (
      SELECT 1 FROM public.profiles admin_p
      WHERE admin_p.id = (SELECT auth.uid())
        AND admin_p.role = 'admin'
        AND admin_p.deleted_at IS NULL
    )
  );

-- 3. Insertion de sa propre demande par le collaborateur (statut 'submitted' obligatoire)
DROP POLICY IF EXISTS "absence_requests_insert_own" ON public.absence_requests;
CREATE POLICY "absence_requests_insert_own"
  ON public.absence_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND status = 'submitted'
  );

-- 4. Annulation par le collaborateur (mutation vers 'cancelled' autorisée)
DROP POLICY IF EXISTS "absence_requests_cancel_own" ON public.absence_requests;
CREATE POLICY "absence_requests_cancel_own"
  ON public.absence_requests
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND status = 'cancelled'
  );

-- 5. Validation ou refus par le gestionnaire ou administrateur
DROP POLICY IF EXISTS "absence_requests_decide_manager" ON public.absence_requests;
CREATE POLICY "absence_requests_decide_manager"
  ON public.absence_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles m
      WHERE m.id = (SELECT auth.uid())
        AND m.role IN ('manager', 'admin')
        AND m.deleted_at IS NULL
    )
  )
  WITH CHECK (
    status IN ('validated', 'refused')
    AND decided_by = (SELECT auth.uid())
  );

-- Ajout à la publication Realtime CDC
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.absence_requests;
  END IF;
END $$;
