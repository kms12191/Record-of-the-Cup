-- Record of the Cup initial Supabase schema
-- Run this in Supabase Dashboard > SQL Editor before using user-owned data.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  avatar_url text,
  preferred_types text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  drink_type text not null check (drink_type in ('cocktail', 'wine', 'whiskey')),
  source text not null,
  external_id text,
  drink_name text not null,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.drink_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  drink_type text not null check (drink_type in ('cocktail', 'wine', 'whiskey')),
  source text not null,
  external_id text,
  drink_name text not null,
  image_url text,
  rating numeric(2, 1) check (rating >= 0 and rating <= 5),
  tasted_at timestamptz not null default now(),
  short_note text,
  flavor_tags text[] not null default '{}',
  occasion text,
  location text,
  price numeric(10, 2) check (price is null or price >= 0),
  pairing text,
  would_drink_again boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.drink_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  record_id uuid references public.drink_records(id) on delete set null,
  drink_type text not null check (drink_type in ('cocktail', 'wine', 'whiskey')),
  source text not null,
  external_id text,
  drink_name text not null,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_drink_types text[] not null default '{}',
  preferred_flavors text[] not null default '{}',
  avoided_flavors text[] not null default '{}',
  preferred_strength text check (preferred_strength in ('low', 'medium', 'high') or preferred_strength is null),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);



-- Public cocktail catalog imported from TheCocktailDB.
-- App clients can read this table, while import scripts use the service_role key to upsert rows.
create table if not exists public.cocktails (
  external_id text primary key,
  name text not null,
  name_ko text,
  category text,
  category_ko text,
  alcoholic text,
  alcoholic_ko text,
  glass text,
  glass_ko text,
  instructions text,
  instructions_ko text,
  image_url text,
  ingredients jsonb not null default '[]'::jsonb,
  ingredients_ko jsonb not null default '[]'::jsonb,
  source text not null default 'cocktaildb',
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- Public wine catalog imported from external wine APIs.
-- App clients can read this table, while import scripts use the service_role key to upsert rows.
create table if not exists public.wines (
  id uuid primary key default gen_random_uuid(),
  external_id text not null,
  wine_type text not null check (wine_type in ('red', 'white', 'sparkling', 'rose', 'dessert', 'port')),
  wine_type_ko text,
  name text not null,
  name_ko text,
  winery text,
  winery_ko text,
  location text,
  country text,
  region text,
  rating_average numeric(2, 1) check (rating_average is null or (rating_average >= 0 and rating_average <= 5)),
  rating_reviews text,
  image_url text,
  wineapi_id text,
  wineapi_status text not null default 'pending' check (wineapi_status in ('pending', 'matched', 'skipped', 'error')),
  wineapi_attempt_count integer not null default 0,
  wineapi_attempted_at timestamptz,
  wineapi_error text,
  wineapi_confidence numeric(4, 3),
  body text,
  acidity text,
  elaborate text,
  classification text,
  alcohol_content text,
  description text,
  grapes jsonb not null default '[]'::jsonb,
  pairings jsonb not null default '[]'::jsonb,
  scores jsonb not null default '[]'::jsonb,
  price_range jsonb,
  prices jsonb not null default '[]'::jsonb,
  wineapi_raw_data jsonb,
  wineapi_updated_at timestamptz,
  source text not null default 'sampleapis',
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, external_id, wine_type)
);



-- WineAPI enrichment columns. Safe to run after the initial wines table already exists.
alter table public.wines add column if not exists wineapi_id text;
alter table public.wines add column if not exists wineapi_status text not null default 'pending' check (wineapi_status in ('pending', 'matched', 'skipped', 'error'));
alter table public.wines add column if not exists wineapi_attempt_count integer not null default 0;
alter table public.wines add column if not exists wineapi_attempted_at timestamptz;
alter table public.wines add column if not exists wineapi_error text;
alter table public.wines add column if not exists wineapi_confidence numeric(4, 3);
alter table public.wines add column if not exists body text;
alter table public.wines add column if not exists acidity text;
alter table public.wines add column if not exists elaborate text;
alter table public.wines add column if not exists classification text;
alter table public.wines add column if not exists alcohol_content text;
alter table public.wines add column if not exists description text;
alter table public.wines add column if not exists grapes jsonb not null default '[]'::jsonb;
alter table public.wines add column if not exists pairings jsonb not null default '[]'::jsonb;
alter table public.wines add column if not exists scores jsonb not null default '[]'::jsonb;
alter table public.wines add column if not exists price_range jsonb;
alter table public.wines add column if not exists prices jsonb not null default '[]'::jsonb;
alter table public.wines add column if not exists wineapi_raw_data jsonb;
alter table public.wines add column if not exists wineapi_updated_at timestamptz;



create index if not exists cocktails_name_idx
  on public.cocktails (name);

create index if not exists cocktails_category_ko_idx
  on public.cocktails (category_ko);

create index if not exists cocktails_alcoholic_ko_idx
  on public.cocktails (alcoholic_ko);

create index if not exists wines_wineapi_id_idx
  on public.wines (wineapi_id);

create index if not exists wines_wineapi_pending_idx
  on public.wines (rating_average desc nulls last, updated_at desc)
  where wineapi_status = 'pending';

create index if not exists wines_type_rating_idx
  on public.wines (wine_type, rating_average desc nulls last);

create index if not exists wines_name_idx
  on public.wines (name);

create unique index if not exists favorites_unique_external_drink
  on public.favorites (user_id, drink_type, source, external_id)
  where external_id is not null;

create index if not exists favorites_user_created_at_idx
  on public.favorites (user_id, created_at desc);

create index if not exists drink_records_user_tasted_at_idx
  on public.drink_records (user_id, tasted_at desc);

create index if not exists drink_records_user_type_idx
  on public.drink_records (user_id, drink_type);

create index if not exists drink_notes_user_created_at_idx
  on public.drink_notes (user_id, created_at desc);


-- Client API privileges. RLS policies below still restrict rows to each owner.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.favorites to authenticated;
grant select, insert, update, delete on public.drink_records to authenticated;
grant select, insert, update, delete on public.drink_notes to authenticated;
grant select, insert, update, delete on public.user_preferences to authenticated;
grant select on public.cocktails to anon, authenticated;
grant select, insert, update on public.cocktails to service_role;
grant select on public.wines to anon, authenticated;
grant select, insert, update on public.wines to service_role;

alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.drink_records enable row level security;
alter table public.drink_notes enable row level security;
alter table public.user_preferences enable row level security;
alter table public.cocktails enable row level security;
alter table public.wines enable row level security;




drop policy if exists "Cocktail catalog is readable by everyone" on public.cocktails;
create policy "Cocktail catalog is readable by everyone"
  on public.cocktails
  for select
  using (true);

drop policy if exists "Wine catalog is readable by everyone" on public.wines;
create policy "Wine catalog is readable by everyone"
  on public.wines
  for select
  using (true);

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
  on public.profiles
  for delete
  using (auth.uid() = id);

drop policy if exists "Users can view own favorites" on public.favorites;
create policy "Users can view own favorites"
  on public.favorites
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own favorites" on public.favorites;
create policy "Users can insert own favorites"
  on public.favorites
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own favorites" on public.favorites;
create policy "Users can update own favorites"
  on public.favorites
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own favorites" on public.favorites;
create policy "Users can delete own favorites"
  on public.favorites
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view own drink records" on public.drink_records;
create policy "Users can view own drink records"
  on public.drink_records
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own drink records" on public.drink_records;
create policy "Users can insert own drink records"
  on public.drink_records
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own drink records" on public.drink_records;
create policy "Users can update own drink records"
  on public.drink_records
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own drink records" on public.drink_records;
create policy "Users can delete own drink records"
  on public.drink_records
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view own drink notes" on public.drink_notes;
create policy "Users can view own drink notes"
  on public.drink_notes
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own drink notes" on public.drink_notes;
create policy "Users can insert own drink notes"
  on public.drink_notes
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own drink notes" on public.drink_notes;
create policy "Users can update own drink notes"
  on public.drink_notes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own drink notes" on public.drink_notes;
create policy "Users can delete own drink notes"
  on public.drink_notes
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view own preferences" on public.user_preferences;
create policy "Users can view own preferences"
  on public.user_preferences
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own preferences" on public.user_preferences;
create policy "Users can insert own preferences"
  on public.user_preferences
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own preferences" on public.user_preferences;
create policy "Users can update own preferences"
  on public.user_preferences
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own preferences" on public.user_preferences;
create policy "Users can delete own preferences"
  on public.user_preferences
  for delete
  using (auth.uid() = user_id);

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at();

drop trigger if exists drink_records_set_updated_at on public.drink_records;
create trigger drink_records_set_updated_at
  before update on public.drink_records
  for each row
  execute function public.update_updated_at();

drop trigger if exists drink_notes_set_updated_at on public.drink_notes;
create trigger drink_notes_set_updated_at
  before update on public.drink_notes
  for each row
  execute function public.update_updated_at();

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row
  execute function public.update_updated_at();


drop trigger if exists cocktails_set_updated_at on public.cocktails;
create trigger cocktails_set_updated_at
  before update on public.cocktails
  for each row
  execute function public.update_updated_at();

drop trigger if exists wines_set_updated_at on public.wines;
create trigger wines_set_updated_at
  before update on public.wines
  for each row
  execute function public.update_updated_at();

