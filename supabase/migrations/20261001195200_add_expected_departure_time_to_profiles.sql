-- Migration: 20261001195200_add_expected_departure_time_to_profiles.sql
-- Description: Ajouter expected_departure_time à la table profiles

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS expected_departure_time TIME NOT NULL DEFAULT '18:00:00'::TIME;
