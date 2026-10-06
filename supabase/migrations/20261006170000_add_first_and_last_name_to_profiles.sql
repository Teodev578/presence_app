-- Migration: 20261006170000_add_first_and_last_name_to_profiles.sql
-- Description: Ajout des colonnes first_name et last_name sur public.profiles,
--              backfill déterministe depuis full_name et mise à jour du trigger handle_new_user().
-- Standard: .agents/rules/05-supabase-rls-and-schema.md

-- ============================================================================
-- 1. Ajout des colonnes first_name et last_name
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_name TEXT NOT NULL DEFAULT '';

-- ============================================================================
-- 2. Backfill des profils existants à partir de full_name
-- ============================================================================

UPDATE public.profiles
SET
  first_name = COALESCE(NULLIF(SPLIT_PART(TRIM(full_name), ' ', 1), ''), ''),
  last_name = COALESCE(NULLIF(TRIM(SUBSTRING(TRIM(full_name) FROM LENGTH(SPLIT_PART(TRIM(full_name), ' ', 1)) + 1)), ''), '')
WHERE (first_name = '' OR last_name = '') AND full_name IS NOT NULL AND full_name <> '';

-- ============================================================================
-- 3. Mise à jour de la fonction trigger handle_new_user()
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first_name TEXT := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name TEXT := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  v_full_name TEXT := COALESCE(
    NULLIF(TRIM(CONCAT_WS(' ', v_first_name, v_last_name)), ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
BEGIN
  -- Si first_name et last_name sont absents mais que full_name est fourni
  IF v_first_name = '' AND v_last_name = '' AND v_full_name <> '' THEN
    v_first_name := COALESCE(NULLIF(SPLIT_PART(TRIM(v_full_name), ' ', 1), ''), '');
    v_last_name := COALESCE(NULLIF(TRIM(SUBSTRING(TRIM(v_full_name) FROM LENGTH(SPLIT_PART(TRIM(v_full_name), ' ', 1)) + 1)), ''), '');
  END IF;

  INSERT INTO public.profiles (id, email, first_name, last_name, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    v_full_name,
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
    'pending_validation'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = CASE WHEN public.profiles.first_name = '' THEN EXCLUDED.first_name ELSE public.profiles.first_name END,
    last_name = CASE WHEN public.profiles.last_name = '' THEN EXCLUDED.last_name ELSE public.profiles.last_name END,
    full_name = CASE WHEN public.profiles.full_name = '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END;
  RETURN NEW;
END;
$$;
