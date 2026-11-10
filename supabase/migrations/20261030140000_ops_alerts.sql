-- Operations alerts that are pushed to the team (30 Oct 2026): webhook deliveries that failed
-- to apply, transfers with no webhook at all, a missing webhook secret. One row per alert
-- key; the reconcile job opens, updates and resolves it and records when the team was last
-- told, so a 5-minute schedule does not repeat the same message. Holds IDs and counts only,
-- never customer details. Keep in sync with src/lib/ops/.

create table if not exists public.ops_alerts (
  key text primary key check (length(key) between 1 and 100),
  severity text not null check (severity in ('warning', 'critical')),
  title text not null check (length(title) between 1 and 300),
  detail jsonb not null default '{}'::jsonb,
  opened_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  notified_at timestamptz,
  notified_severity text check (notified_severity in ('warning', 'critical')),
  notify_count integer not null default 0 check (notify_count >= 0)
);

create index if not exists ops_alerts_open_idx on public.ops_alerts (opened_at desc)
  where resolved_at is null;

-- The webhook-missing check looks deliveries up by transfer ID.
create index if not exists stables_webhook_events_object_idx
  on public.stables_webhook_events (event_object_id);

alter table public.ops_alerts enable row level security;

revoke all on public.ops_alerts from anon, authenticated;
grant select on public.ops_alerts to authenticated;
grant all on public.ops_alerts to service_role;

create policy "Admins read ops alerts" on public.ops_alerts
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
