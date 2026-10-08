-- Migration: 20261008110000_add_weekly_schedule_to_profiles_down.sql
-- Description: Supprimer la colonne weekly_schedule de la table profiles.

ALTER TABLE public.profiles
DROP COLUMN IF EXISTS weekly_schedule;
