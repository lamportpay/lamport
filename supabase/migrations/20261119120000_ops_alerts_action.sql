-- Admin → Alerts (19 Nov 2026): keep what the team should do next with each operations alert,
-- so the admin can show it beside the title without a chat channel. Written by the alert rules
-- in src/lib/ops/ (IDs, statuses and instructions only, never customer details). Nullable:
-- rows written before this have none. Additive only; older code ignores the column.

alter table public.ops_alerts
  add column if not exists action text check (action is null or length(action) <= 2000);
