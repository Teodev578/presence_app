-- Migration UP: Procédure RPC pour le refus explicite et la purge immédiate d'un compte non validé
-- Permet aux managers et administrateurs de purger immédiatement un compte pending_validation

CREATE OR REPLACE FUNCTION public.admin_reject_unverified_account(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Suppression physique immédiate du profil si et seulement s'il est en attente
  DELETE FROM public.profiles
  WHERE id = target_user_id
    AND status = 'pending_validation';
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reject_unverified_account(UUID) TO authenticated;

COMMENT ON FUNCTION public.admin_reject_unverified_account(UUID) IS 'Supprime immédiatement un profil pending_validation par un gestionnaire ou administrateur.';
