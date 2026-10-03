-- Migration Down: 20261003001500_prevent_archiving_privileged_roles_down.sql

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_prevent_archive_privileged_roles;

DROP TRIGGER IF EXISTS trg_check_profile_archive_eligibility ON public.profiles;

DROP FUNCTION IF EXISTS public.check_profile_archive_eligibility();
