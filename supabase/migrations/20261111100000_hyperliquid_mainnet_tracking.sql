-- Hyperliquid follows the app mode (owner decision, 11 Nov 2026): TEST MODE uses the
-- testnet, LIVE MODE uses mainnet. The tracking table now accepts both networks, and a
-- trading key approved on one network is never accepted on the other (the server filters
-- approvals by network). Existing rows stay 'hyperliquid-testnet'.
--
-- Rollback: supabase/rollbacks/20261111100000_hyperliquid_mainnet_tracking.down.sql

alter table public.hyperliquid_test_events
  drop constraint if exists hyperliquid_test_events_network_check;
alter table public.hyperliquid_test_events
  add constraint hyperliquid_test_events_network_check
  check (network in ('hyperliquid-testnet', 'hyperliquid-mainnet'));

drop index if exists public.hyperliquid_test_events_agent_idx;
create index hyperliquid_test_events_agent_idx
  on public.hyperliquid_test_events (agent, network)
  where kind = 'approve_agent' and ok;
