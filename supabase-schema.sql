-- TruthAI Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'business')),
  stripe_customer_id text,
  checks_used_this_month int not null default 0,
  checks_reset_at timestamptz not null default date_trunc('month', now()),
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.users enable row level security;

create policy "Users can read own data"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own data"
  on public.users for update
  using (auth.uid() = id);

-- Documents table
create table public.documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null default 'Untitled',
  content text not null,
  word_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "Users can CRUD own documents"
  on public.documents for all
  using (auth.uid() = user_id);

-- Results table
create table public.results (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid references public.documents(id) on delete cascade not null,
  human_pct int not null check (human_pct between 0 and 100),
  ai_pct int not null check (ai_pct between 0 and 100),
  dialect text not null default 'other'
    check (dialect in ('emirati', 'gulf', 'msa', 'mixed', 'other')),
  confidence text not null default 'medium'
    check (confidence in ('high', 'medium', 'low')),
  sentence_data jsonb not null default '[]',
  markers_found jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table public.results enable row level security;

create policy "Users can read results for own documents"
  on public.results for select
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

create policy "Users can insert results for own documents"
  on public.results for insert
  with check (
    exists (
      select 1 from public.documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

-- Subscriptions table
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null unique,
  stripe_subscription_id text not null,
  plan text not null check (plan in ('pro', 'business')),
  status text not null,
  current_period_end timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can read own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- API Keys table (Pro+ only)
create table public.api_keys (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  key_hash text not null unique,
  key_prefix text not null,
  name text not null default 'Default',
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.api_keys enable row level security;

create policy "Users can manage own API keys"
  on public.api_keys for all
  using (auth.uid() = user_id);

-- Function: auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function: reset monthly check count
create or replace function public.reset_monthly_checks()
returns void language plpgsql as $$
begin
  update public.users
  set checks_used_this_month = 0,
      checks_reset_at = date_trunc('month', now())
  where checks_reset_at < date_trunc('month', now());
end;
$$;

-- Function: increment monthly check counter (call from API)
create or replace function public.increment_checks_used(uid uuid)
returns void language plpgsql security definer as $$
begin
  -- Reset if month changed
  update public.users
  set checks_used_this_month = 0,
      checks_reset_at = date_trunc('month', now())
  where id = uid and checks_reset_at < date_trunc('month', now());

  -- Increment
  update public.users
  set checks_used_this_month = checks_used_this_month + 1
  where id = uid;
end;
$$;
