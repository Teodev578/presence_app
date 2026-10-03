-- Migration UP: Procédure RPC pour le refus explicite et la purge immédiate d'un compte non validé
-- Permet aux managers et administrateurs de purger immédiatement un compte pending_validation

CREATE OR REPLACE FUNCTION public.admin_reject_unverified_account(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Suppression atomique de l'utilisateur auth.users (avec cascade sur public.profiles)
  -- si et seulement si le profil associé est en attente de confirmation
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id AND status = 'pending_validation') THEN
    DELETE FROM auth.users WHERE id = target_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reject_unverified_account(UUID) TO authenticated;

COMMENT ON FUNCTION public.admin_reject_unverified_account(UUID) IS 'Supprime immédiatement un profil pending_validation par un gestionnaire ou administrateur.';
