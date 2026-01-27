-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create series table (parent for episodes)
create table if not exists public.series (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  cover_image text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create content types enum
create type content_type as enum ('movie', 'short', 'episode', 'other');

-- Create content table (stores all content: movies, shorts, episodes, etc)
create table if not exists public.content (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type content_type not null,
  name text not null,
  cover_image text,
  rating numeric(3,1) check (rating >= 0 and rating <= 10),
  duration integer, -- in minutes
  series_id uuid references public.series(id) on delete cascade,
  season integer,
  episode integer,
  watched_date date not null default current_date,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.series enable row level security;
alter table public.content enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Series policies
create policy "Users can view their own series"
  on public.series for select
  using (auth.uid() = user_id);

create policy "Users can insert their own series"
  on public.series for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own series"
  on public.series for update
  using (auth.uid() = user_id);

create policy "Users can delete their own series"
  on public.series for delete
  using (auth.uid() = user_id);

-- Content policies
create policy "Users can view their own content"
  on public.content for select
  using (auth.uid() = user_id);

create policy "Users can insert their own content"
  on public.content for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own content"
  on public.content for update
  using (auth.uid() = user_id);

create policy "Users can delete their own content"
  on public.content for delete
  using (auth.uid() = user_id);

-- Create indexes for better query performance
create index if not exists idx_series_user_id on public.series(user_id);
create index if not exists idx_content_user_id on public.content(user_id);
create index if not exists idx_content_series_id on public.content(series_id);
create index if not exists idx_content_watched_date on public.content(watched_date);
create index if not exists idx_content_type on public.content(type);
