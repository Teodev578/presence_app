-- Migration: 20261008110000_add_weekly_schedule_to_profiles.sql
-- Description: Ajouter la colonne weekly_schedule (JSONB) à la table profiles pour supporter la semaine type personnalisée.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS weekly_schedule JSONB DEFAULT NULL;
