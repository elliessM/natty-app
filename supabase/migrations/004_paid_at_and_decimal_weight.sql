-- ─────────────────────────────────────────────────────────────────
--  004 — Sync du paiement + poids décimal
--  À exécuter dans : Supabase Dashboard → SQL Editor → New query → Run
--
--  1. paid_at : sans cette colonne, une commande payée redevenait
--     "paiement requis" après un pull cloud (retrait bloqué à tort).
--  2. weight_kg int → numeric : une pesée décimale (ex 74.5) faisait
--     échouer TOUT le push profil (favoris, hydratation, objectifs inclus).
-- ─────────────────────────────────────────────────────────────────

alter table public.reservations
  add column if not exists paid_at timestamptz;

alter table public.profiles
  alter column weight_kg type numeric(5,1),
  alter column target_weight_kg type numeric(5,1);

-- Optionnel : la table hydration_logs n'a jamais été utilisée
-- (l'hydratation vit dans profiles.hydration_today, cf. migration 002).
-- Décommenter pour la supprimer :
-- drop table if exists public.hydration_logs;
