-- ============================================================
-- FLACON — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Profiles table (extends Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  fragella_api_key text,
  currency text default '€',
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Fragrances table
create table if not exists public.fragrances (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  brand text not null,
  concentration text default 'EdP',
  family text default 'Other',
  season jsonb default '["Ganzjährig"]'::jsonb,
  notes jsonb default '[]'::jsonb,
  image_url text,
  launch_year integer,
  size_ml numeric,
  purchase_price numeric,
  market_price numeric,
  purchase_date date,
  fill_level integer default 100,
  rating jsonb,
  tier text check (tier in ('S', 'A', 'B', 'C', 'D')),
  tier_rank integer,
  notes_text text default '',
  is_wishlist boolean default false,
  fragella_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_fragrances_user_id on public.fragrances(user_id);
create index if not exists idx_fragrances_is_wishlist on public.fragrances(is_wishlist);
create index if not exists idx_fragrances_tier on public.fragrances(tier);
create index if not exists idx_fragrances_brand on public.fragrances(brand);

-- 3. Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.fragrances enable row level security;

-- Profiles: users can only read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Fragrances: users can only CRUD their own fragrances
create policy "Users can view own fragrances"
  on public.fragrances for select
  using (auth.uid() = user_id);

create policy "Users can insert own fragrances"
  on public.fragrances for insert
  with check (auth.uid() = user_id);

create policy "Users can update own fragrances"
  on public.fragrances for update
  using (auth.uid() = user_id);

create policy "Users can delete own fragrances"
  on public.fragrances for delete
  using (auth.uid() = user_id);

-- 4. Enable Realtime
alter publication supabase_realtime add table public.fragrances;
