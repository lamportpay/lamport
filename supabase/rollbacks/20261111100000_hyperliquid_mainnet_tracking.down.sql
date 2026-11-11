-- Rollback of 20261111100000_hyperliquid_mainnet_tracking.sql.
-- Deploy code that uses the testnet only first. Fails if mainnet rows exist (they are kept).
drop index if exists public.hyperliquid_test_events_agent_idx;
create index hyperliquid_test_events_agent_idx
  on public.hyperliquid_test_events (agent)
  where kind = 'approve_agent' and ok;

alter table public.hyperliquid_test_events
  drop constraint if exists hyperliquid_test_events_network_check;
alter table public.hyperliquid_test_events
  add constraint hyperliquid_test_events_network_check
  check (network = 'hyperliquid-testnet');
