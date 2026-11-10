-- Rollback of supabase/migrations/20261109120000_production_schema_hygiene.sql.
-- Not a migration (the Supabase CLI never runs this folder). Run by hand, in one
-- transaction. Functional rollback: it restores what the previous code needs,
-- not every grant the database used to have.
--
-- Restored: has_role with search_path=public (same rules); the per-row RLS
-- expressions; the read-and-write invite policy and INSERT/UPDATE/DELETE on
-- admin_invites for signed-in users (the previous cancelAdminInvite deleted with
-- the admin's session). Indexes added by the migration are dropped.
-- Not restored, on purpose: write grants on user_roles (no code ever used
-- them), TRUNCATE/REFERENCES/TRIGGER (never needed), and the demo tables
-- mock_kyc_submissions / mock_payout_transfers (no code uses them; their rows
-- were sample data; recreate from 20260825170332 and 20260825172141 if ever needed).
begin;

-- has_role as in 20261030120000_admin_role_requires_mfa.sql
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id
      and role = _role
      and (
        coalesce(auth.role(), '') = 'service_role'
        or (
          _user_id = auth.uid()
          and (_role <> 'admin' or coalesce(auth.jwt() ->> 'aal', '') = 'aal2')
        )
      )
  )
$$;

-- Invites: read-and-write policy and grants for the previous code.
drop policy if exists "Admins read invites" on public.admin_invites;
drop policy if exists "Admins manage invites" on public.admin_invites;
create policy "Admins manage invites" on public.admin_invites
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));
grant insert, update, delete on public.admin_invites to authenticated;

-- RLS expressions as before the migration.
alter policy "Admins append audit log" on public.admin_audit_log
  with check (public.has_role(auth.uid(), 'admin'::public.app_role) and actor_id = auth.uid());
alter policy "Admins read audit log" on public.admin_audit_log
  using (public.has_role(auth.uid(), 'admin'::public.app_role));
alter policy "Admins read mode events" on public.app_mode_events
  using (public.has_role(auth.uid(), 'admin'::public.app_role));
alter policy "Admins read early access signups" on public.early_access_signups
  using (public.has_role(auth.uid(), 'admin'::public.app_role));
alter policy "Users read own identity events" on public.identity_events
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'::public.app_role));
alter policy "Admins read ops alerts" on public.ops_alerts
  using (public.has_role(auth.uid(), 'admin'::public.app_role));
alter policy "Admins append payment case events" on public.payment_case_events
  with check (public.has_role(auth.uid(), 'admin'::public.app_role) and actor_id = auth.uid());
alter policy "Admins read payment case events" on public.payment_case_events
  using (public.has_role(auth.uid(), 'admin'::public.app_role));
alter policy "Admins open payment cases" on public.payment_cases
  with check (public.has_role(auth.uid(), 'admin'::public.app_role) and opened_by = auth.uid());
alter policy "Admins read payment cases" on public.payment_cases
  using (public.has_role(auth.uid(), 'admin'::public.app_role));
alter policy "Admins update payment cases" on public.payment_cases
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));
alter policy "Users read own payment events" on public.payment_events
  using (exists (
    select 1 from public.payments p
    where p.id = payment_events.payment_id
      and (p.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role))));
alter policy "Admins read the fee ledger" on public.payment_fee_ledger
  using (public.has_role(auth.uid(), 'admin'::public.app_role));
alter policy "Users read own payment swaps" on public.payment_swaps
  using (exists (
    select 1 from public.payments p
    where p.id = payment_swaps.payment_id
      and (p.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role))));
alter policy "Users read own payments" on public.payments
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'::public.app_role));
alter policy "Users read own Stables customer" on public.stables_customers
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'::public.app_role));
alter policy "Admins read Stables webhook events" on public.stables_webhook_events
  using (public.has_role(auth.uid(), 'admin'::public.app_role));
alter policy "Admins read support chats" on public.support_chats
  using (public.has_role(auth.uid(), 'admin'::public.app_role));
alter policy "Admins update support chats" on public.support_chats
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));
alter policy "Admins read all roles" on public.user_roles
  using (public.has_role(auth.uid(), 'admin'::public.app_role));
alter policy "Users can read own roles" on public.user_roles
  using (auth.uid() = user_id);
alter policy "Users read own wallets" on public.user_wallets
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'::public.app_role));
alter policy "own or admin read verified wallets" on public.verified_wallets
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role));

drop index if exists public.admin_audit_log_actor_id_idx;
drop index if exists public.payment_case_events_actor_id_idx;
drop index if exists public.payment_cases_opened_by_idx;
drop index if exists public.app_mode_events_user_id_idx;

commit;
