# Supabase — Setup

## 1. Exécuter le schéma

1. Aller sur https://supabase.com/dashboard → projet `natty-dev`
2. Sidebar → **SQL Editor** → **New query**
3. Copier-coller le contenu de `schema.sql`
4. Cliquer **Run** (raccourci ⌘⏎)
5. Vérifier en bas : "Success. No rows returned" → tout est OK

## 2. Vérifier les tables

Sidebar → **Table Editor** → tu dois voir :
- `profiles`
- `journal_entries`
- `hydration_logs`
- `reservations`

## 3. Activer l'auth par email

Sidebar → **Authentication** → **Providers** → **Email**
- `Enable Email provider` : ON
- `Confirm email` : **OFF** (pour tester rapidement — remettre ON en prod)
- Save

## 4. (Optionnel) Désactiver la confirmation d'email pour le dev

Sinon chaque test demande de cliquer sur un email de confirmation. Pour le dev :
- **Authentication** → **Providers** → **Email** → décocher "Confirm email"

## RLS — Qui voit quoi

Chaque table a des policies qui filtrent par `auth.uid()`. Concrètement :
- Un user A ne peut lire/écrire que **ses propres** profil, scans, résas, hydratation.
- Sans session (non loggué), la DB renvoie `0 rows` ou `permission denied`.
- La clé `publishable` utilisée côté mobile respecte ces policies — elle n'a pas de pouvoir "admin".

## Si tu dois reset

Pour tout effacer et rejouer le schéma :

```sql
drop table if exists public.reservations cascade;
drop table if exists public.hydration_logs cascade;
drop table if exists public.journal_entries cascade;
drop table if exists public.profiles cascade;
drop function if exists public.handle_new_user() cascade;
```

Puis re-exécute `schema.sql`.
