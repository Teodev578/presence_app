-- Migration DOWN: Révocation de la procédure RPC admin_reject_unverified_account

DROP FUNCTION IF EXISTS public.admin_reject_unverified_account(UUID);
