-- Migration: 20261003001500_prevent_archiving_privileged_roles.sql
-- Description: Interdit formellement l'archivage ou la mise en sommeil des rôles privilégiés (admin, manager).
--              Ces comptes doivent impérativement être rétrogradés en collaborateur ('employee') avant archivage.
-- Conforme aux standards : .agents/rules/05-supabase-rls-and-schema.md

-- 1. Fonction trigger de vérification d'éligibilité à l'archivage
CREATE OR REPLACE FUNCTION public.check_profile_archive_eligibility()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Empêcher le passage au statut archivé/désactivé pour les managers et administrateurs
  IF NEW.status IN ('archived', 'disabled') AND NEW.role IN ('admin', 'manager') THEN
    RAISE EXCEPTION 'Impossible d''archiver un gestionnaire ou un administrateur. Son rôle doit être modifié en collaborateur au préalable.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Déclencheur sur mise à jour
DROP TRIGGER IF EXISTS trg_check_profile_archive_eligibility ON public.profiles;
CREATE TRIGGER trg_check_profile_archive_eligibility
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_archive_eligibility();

-- 3. Contrainte d'intégrité déclarative au niveau de la table
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_prevent_archive_privileged_roles;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_prevent_archive_privileged_roles
  CHECK (status NOT IN ('archived', 'disabled') OR role = 'employee');
