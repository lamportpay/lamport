-- Hyperliquid TESTNET test tracking (owner request 2026-11-07).
--
-- One row per test action a signed-in customer runs from the app: a check run
-- (every read endpoint), approving a browser agent key, placing a spot limit
-- order or cancelling one. Testnet only: no real funds. The server relays
-- actions already signed in the customer's browser; no key is ever stored.
--
-- (signer, nonce) is unique, so the same signed action is never relayed twice.
-- ok is null while the action is with Hyperliquid, then true / false.
-- Written by the server (service role) only; RLS on with no policies.
--
-- Rollback: drop table public.hyperliquid_test_events;

create table public.hyperliquid_test_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('checks', 'approve_agent', 'order', 'cancel')),
  network text not null default 'hyperliquid-testnet' check (network = 'hyperliquid-testnet'),
  account text check (account ~ '^0x[0-9a-f]{40}$'),
  agent text check (agent ~ '^0x[0-9a-f]{40}$'),
  signer text check (signer ~ '^0x[0-9a-f]{40}$'),
  nonce bigint check (nonce > 0),
  request jsonb not null default '{}'::jsonb,
  ok boolean,
  response jsonb,
  error text check (char_length(error) <= 500),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint hyperliquid_test_events_signed check ((signer is null) = (nonce is null))
);

create unique index hyperliquid_test_events_signer_nonce_key
  on public.hyperliquid_test_events (signer, nonce)
  where signer is not null;

create index hyperliquid_test_events_user_created_idx
  on public.hyperliquid_test_events (user_id, created_at desc);

create index hyperliquid_test_events_agent_idx
  on public.hyperliquid_test_events (agent)
  where kind = 'approve_agent' and ok;

alter table public.hyperliquid_test_events enable row level security;
revoke all on public.hyperliquid_test_events from anon, authenticated;
grant all on public.hyperliquid_test_events to service_role;
