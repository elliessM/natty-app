-- Migration 002 — étend profiles pour sync complet (goals, paramètres, favoris…)
-- Idempotent : safe à re-exécuter.

alter table public.profiles
  add column if not exists weight_history jsonb not null default '[]'::jsonb,
  add column if not exists hydration_goal_ml int not null default 2000,
  add column if not exists steps_goal int not null default 8000,
  add column if not exists weigh_in_day int not null default 1 check (weigh_in_day between 1 and 7),
  add column if not exists weigh_in_hour int not null default 8 check (weigh_in_hour between 0 and 23),
  add column if not exists notifications_enabled boolean not null default true,
  add column if not exists notif_prefs jsonb not null default
    '{"hydration":true,"meals":true,"weighIn":true,"reservations":true}'::jsonb,
  add column if not exists unit_system text not null default 'metric'
    check (unit_system in ('metric','imperial')),
  add column if not exists language text not null default 'fr'
    check (language in ('fr','en')),
  add column if not exists credits_eur numeric not null default 0,
  add column if not exists favorites jsonb not null default '[]'::jsonb,
  add column if not exists hydration_today jsonb not null default
    '{"day":null,"ml":0}'::jsonb;
