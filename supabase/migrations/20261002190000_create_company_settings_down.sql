-- Migration DOWN: 20261002190000_create_company_settings_down.sql
-- Description: Suppression réversible de la table company_settings.

DROP TABLE IF EXISTS public.company_settings CASCADE;
