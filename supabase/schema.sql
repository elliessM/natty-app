-- ─────────────────────────────────────────────────────────────────
--  Natty — Schéma initial Supabase
--  À exécuter UNE FOIS dans : Supabase Dashboard → SQL Editor → New query → coller → Run
-- ─────────────────────────────────────────────────────────────────

-- ─── profiles ────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Anonyme',
  email text,
  goal text not null default 'muscle' check (goal in ('energy','muscle','weight','perf')),
  restrictions text[] not null default '{}',
  age int not null default 28 check (age between 12 and 100),
  sex text not null default 'M' check (sex in ('M','F','other')),
  height_cm int not null default 178 check (height_cm between 120 and 230),
  weight_kg int not null default 75 check (weight_kg between 30 and 200),
  target_weight_kg int not null default 72 check (target_weight_kg between 30 and 200),
  activity_level text not null default 'active' check (activity_level in ('sedentary','light','active','athlete')),
  has_onboarded boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-créer un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'Anonyme'),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── journal_entries ─────────────────────────────────────────────
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('scan','purchase','manual')),
  ts timestamptz not null default now(),
  food text not null,
  emoji text not null default '🍽️',
  image text,
  kcal numeric not null default 0,
  prot numeric not null default 0,
  glu numeric not null default 0,
  lip numeric not null default 0,
  created_at timestamptz not null default now()
);

create index journal_entries_user_ts_idx on public.journal_entries(user_id, ts desc);

alter table public.journal_entries enable row level security;

create policy "journal_select_own"
  on public.journal_entries for select
  using (auth.uid() = user_id);

create policy "journal_insert_own"
  on public.journal_entries for insert
  with check (auth.uid() = user_id);

create policy "journal_update_own"
  on public.journal_entries for update
  using (auth.uid() = user_id);

create policy "journal_delete_own"
  on public.journal_entries for delete
  using (auth.uid() = user_id);

-- ─── hydration_logs ──────────────────────────────────────────────
create table public.hydration_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  ml int not null default 0 check (ml >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);

alter table public.hydration_logs enable row level security;

create policy "hydration_select_own"
  on public.hydration_logs for select
  using (auth.uid() = user_id);

create policy "hydration_upsert_own"
  on public.hydration_logs for insert
  with check (auth.uid() = user_id);

create policy "hydration_update_own"
  on public.hydration_logs for update
  using (auth.uid() = user_id);

-- ─── reservations ────────────────────────────────────────────────
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  items jsonb not null,
  fridge_id text not null,
  fridge_name text not null,
  fridge_addr text not null,
  pickup_ts timestamptz not null,
  total numeric not null,
  cancelled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index reservations_user_pickup_idx on public.reservations(user_id, pickup_ts);

alter table public.reservations enable row level security;

create policy "reservations_select_own"
  on public.reservations for select
  using (auth.uid() = user_id);

create policy "reservations_insert_own"
  on public.reservations for insert
  with check (auth.uid() = user_id);

create policy "reservations_update_own"
  on public.reservations for update
  using (auth.uid() = user_id);

create policy "reservations_delete_own"
  on public.reservations for delete
  using (auth.uid() = user_id);
