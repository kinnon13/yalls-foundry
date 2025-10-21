-- Create extension for UUID generation
create extension if not exists pgcrypto;

-- Ensure timestamp update helper exists
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

-- Create table for storing encrypted provider API keys
create table if not exists public.app_provider_secrets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  provider text not null,
  name text not null default 'default',
  enc_api_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_used_at timestamptz
);

-- Uniqueness per user+provider+name
create unique index if not exists app_provider_secrets_owner_provider_name_idx
  on public.app_provider_secrets(owner_user_id, provider, name);

-- Helpful index for lookups
create index if not exists app_provider_secrets_owner_idx
  on public.app_provider_secrets(owner_user_id);

-- Enable RLS
alter table public.app_provider_secrets enable row level security;

-- Policies (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'app_provider_secrets' AND policyname = 'Users can view own secrets'
  ) THEN
    CREATE POLICY "Users can view own secrets"
      ON public.app_provider_secrets
      FOR SELECT
      USING (auth.uid() = owner_user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'app_provider_secrets' AND policyname = 'Users can insert own secrets'
  ) THEN
    CREATE POLICY "Users can insert own secrets"
      ON public.app_provider_secrets
      FOR INSERT
      WITH CHECK (auth.uid() = owner_user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'app_provider_secrets' AND policyname = 'Users can update own secrets'
  ) THEN
    CREATE POLICY "Users can update own secrets"
      ON public.app_provider_secrets
      FOR UPDATE
      USING (auth.uid() = owner_user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'app_provider_secrets' AND policyname = 'Users can delete own secrets'
  ) THEN
    CREATE POLICY "Users can delete own secrets"
      ON public.app_provider_secrets
      FOR DELETE
      USING (auth.uid() = owner_user_id);
  END IF;
END $$;

-- Trigger to update updated_at automatically
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_app_provider_secrets_updated_at'
  ) THEN
    CREATE TRIGGER update_app_provider_secrets_updated_at
      BEFORE UPDATE ON public.app_provider_secrets
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;