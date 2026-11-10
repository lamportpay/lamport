-- Minimal stand-in for the objects a Supabase project provides before any app migration
-- runs. FOR LOCAL MIGRATION REPLAY ONLY: never run this against a real project.
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin noinherit bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname='authenticator') then create role authenticator noinherit login; end if;
end $$;
grant anon, authenticated, service_role to authenticator;
create schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
-- Supabase's default privileges on public (why the app migrations revoke grants)
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text, phone text,
  raw_user_meta_data jsonb default '{}'::jsonb,
  raw_app_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  last_sign_in_at timestamptz
);
create table auth.identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null, provider_id text not null,
  identity_data jsonb default '{}'::jsonb, email text,
  last_sign_in_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now(),
  unique (provider_id, provider)
);
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
create function auth.role() returns text language sql stable as $$
  select nullif(auth.jwt() ->> 'role', '') $$;
grant execute on all functions in schema auth to anon, authenticated, service_role;

create schema vault;
create table vault.secrets (id uuid primary key default gen_random_uuid(), name text unique, secret text, description text);
create view vault.decrypted_secrets as select id, name, secret as decrypted_secret, description from vault.secrets;
create function vault.create_secret(new_secret text, new_name text default null, new_description text default '')
returns uuid language sql as $$ insert into vault.secrets(name, secret, description) values (new_name, new_secret, new_description) returning id $$;
