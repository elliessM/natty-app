-- Migration 001 — ajout du flag has_onboarded
-- À exécuter dans Supabase Dashboard → SQL Editor → New query → Run
-- Safe à re-exécuter (idempotent).

alter table public.profiles
  add column if not exists has_onboarded boolean not null default false;
