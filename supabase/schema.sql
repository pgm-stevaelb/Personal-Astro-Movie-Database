-- Personal Media Deck schema

-- Extensions
create extension if not exists "pgcrypto";

-- Helpers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Tables
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.titles (
  id uuid primary key default gen_random_uuid(),
  tmdb_id text unique not null,
  type text not null check (type in ('movie', 'tv')),
  title text not null,
  year text,
  poster text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_titles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title_id uuid not null references public.titles(id) on delete cascade,
  status text not null default 'planned' check (status in ('planned', 'watching', 'completed', 'dropped')),
  progress int default 0,
  rating int check (rating between 1 and 10),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, title_id)
);

create index if not exists user_titles_user_id_idx on public.user_titles(user_id);
create index if not exists user_titles_status_idx on public.user_titles(status);

-- Triggers
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_titles_updated_at
before update on public.titles
for each row execute function public.set_updated_at();

create trigger set_user_titles_updated_at
before update on public.user_titles
for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.titles enable row level security;
alter table public.user_titles enable row level security;

-- Profiles policies
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles insert by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Profiles update by owner"
  on public.profiles for update
  using (auth.uid() = id);

-- Titles policies
create policy "Titles are viewable by authenticated users"
  on public.titles for select
  using (auth.role() = 'authenticated');

create policy "Titles insert by authenticated users"
  on public.titles for insert
  with check (auth.role() = 'authenticated');

create policy "Titles update by authenticated users"
  on public.titles for update
  using (auth.role() = 'authenticated');

-- User titles policies
create policy "User titles are viewable by owner"
  on public.user_titles for select
  using (auth.uid() = user_id);

create policy "User titles insert by owner"
  on public.user_titles for insert
  with check (auth.uid() = user_id);

create policy "User titles update by owner"
  on public.user_titles for update
  using (auth.uid() = user_id);

create policy "User titles delete by owner"
  on public.user_titles for delete
  using (auth.uid() = user_id);
