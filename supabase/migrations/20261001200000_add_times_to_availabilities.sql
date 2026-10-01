-- Migration: 20261001200000_add_times_to_availabilities.sql
-- Description: Ajouter start_time et end_time à la table availabilities

ALTER TABLE public.availabilities
ADD COLUMN IF NOT EXISTS start_time TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS end_time TIME DEFAULT NULL;
