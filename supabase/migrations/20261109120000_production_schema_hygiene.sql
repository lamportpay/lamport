-- Production schema hygiene (Implementation Batch 1, 9 Nov 2026).
-- From the production-readiness audit of 9 Nov 2026 and a replay of every migration on a
-- fresh database. Nothing here changes what a signed-in user or an admin can do through
-- the app; it removes access the app never uses and makes RLS cheaper to evaluate.
--
-- 1. The demo tables mock_kyc_submissions and mock_payout_transfers are dropped. No code
--    reads or writes them (their admin functions were removed; 20261007140000 already
--    revoked every grant). They held demo rows only. Dropped without CASCADE, so this
--    fails loudly if anything still depends on them.
-- 2. Role and invite rows change only through the server with the service role
--    (src/lib/admin.functions.ts). Signed-in users keep SELECT (RLS still limits it to
--    their own roles, or everything for an aal2 admin) and lose INSERT, UPDATE, DELETE,
--    TRUNCATE, REFERENCES and TRIGGER. The invite policy becomes read-only to match.
--    REFERENCES and TRIGGER, which no client path uses, are also removed from four other
--    tables.
-- 3. has_role() keeps its exact rules (self-only, aal2 for admin, service role) and now runs
--    with an empty search_path; every name in its body is schema-qualified.
-- 4. RLS policies call auth.uid() and has_role() once per statement instead of once per
--    row: (select auth.uid()) and (select public.has_role(...)). Same conditions.
-- 5. Indexes for foreign keys on tables that keep growing (audit log, case events, cases,
--    mode events). Without them, deleting an auth user (ON DELETE SET NULL) scans the
--    whole table. Not indexed, on purpose: business_settings.updated_by (one row) and
--    admin_invites.invited_by / accepted_by (a handful of rows).
--
-- SECURITY DEFINER review (no change needed): rate_limit_hit, rate_limit_prune,
-- trigger_payment_reconciliation, record_verified_wallet, stables_customers_identity_audit
-- and sync_web3_wallet all run with search_path = '' and are executable by the service
-- role only. rls_auto_enable() is Supabase's own; 20260926220000 removed its public grant.
--
-- Rollback: supabase/rollbacks/20261109120000_production_schema_hygiene.down.sql
-- (functional: has_role, policies, invite writes for the previous code, indexes).
-- The demo rows are not restored; they were sample data.

-- 1. Demo tables -------------------------------------------------------------------------
drop table if exists public.mock_payout_transfers;
drop table if exists public.mock_kyc_submissions;

-- 2. Grants ------------------------------------------------------------------------------
revoke insert, update, delete, truncate, references, trigger
  on public.user_roles, public.admin_invites from anon, authenticated;
revoke references, trigger
  on public.admin_audit_log, public.app_mode_events, public.identity_events, public.user_wallets
  from anon, authenticated;

drop policy if exists "Admins manage invites" on public.admin_invites;
drop policy if exists "Admins read invites" on public.admin_invites;
create policy "Admins read invites" on public.admin_invites
  for select to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));

-- 3. has_role with an empty search_path ---------------------------------------------------
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id
      and role = _role
      and (
        coalesce(auth.role(), '') = 'service_role'
        or (
          _user_id = auth.uid()
          and (_role <> 'admin'::public.app_role or coalesce(auth.jwt() ->> 'aal', '') = 'aal2')
        )
      )
  )
$$;
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

-- 4. RLS: evaluate auth.uid() and has_role() once per statement ----------------------------
alter policy "Admins append audit log" on public.admin_audit_log
  with check ((select public.has_role((select auth.uid()), 'admin'::public.app_role))
              and actor_id = (select auth.uid()));
alter policy "Admins read audit log" on public.admin_audit_log
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));
alter policy "Admins read mode events" on public.app_mode_events
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));
alter policy "Admins read early access signups" on public.early_access_signups
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));
alter policy "Users read own identity events" on public.identity_events
  using (user_id = (select auth.uid())
         or (select public.has_role((select auth.uid()), 'admin'::public.app_role)));
alter policy "Admins read ops alerts" on public.ops_alerts
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));
alter policy "Admins append payment case events" on public.payment_case_events
  with check ((select public.has_role((select auth.uid()), 'admin'::public.app_role))
              and actor_id = (select auth.uid()));
alter policy "Admins read payment case events" on public.payment_case_events
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));
alter policy "Admins open payment cases" on public.payment_cases
  with check ((select public.has_role((select auth.uid()), 'admin'::public.app_role))
              and opened_by = (select auth.uid()));
alter policy "Admins read payment cases" on public.payment_cases
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));
alter policy "Admins update payment cases" on public.payment_cases
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)))
  with check ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));
alter policy "Users read own payment events" on public.payment_events
  using (exists (
    select 1 from public.payments p
    where p.id = payment_events.payment_id
      and (p.user_id = (select auth.uid())
           or (select public.has_role((select auth.uid()), 'admin'::public.app_role)))));
alter policy "Admins read the fee ledger" on public.payment_fee_ledger
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));
alter policy "Users read own payment swaps" on public.payment_swaps
  using (exists (
    select 1 from public.payments p
    where p.id = payment_swaps.payment_id
      and (p.user_id = (select auth.uid())
           or (select public.has_role((select auth.uid()), 'admin'::public.app_role)))));
alter policy "Users read own payments" on public.payments
  using (user_id = (select auth.uid())
         or (select public.has_role((select auth.uid()), 'admin'::public.app_role)));
alter policy "Users read own Stables customer" on public.stables_customers
  using (user_id = (select auth.uid())
         or (select public.has_role((select auth.uid()), 'admin'::public.app_role)));
alter policy "Admins read Stables webhook events" on public.stables_webhook_events
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));
alter policy "Admins read support chats" on public.support_chats
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));
alter policy "Admins update support chats" on public.support_chats
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)))
  with check ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));
alter policy "Admins read all roles" on public.user_roles
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));
alter policy "Users can read own roles" on public.user_roles
  using (user_id = (select auth.uid()));
alter policy "Users read own wallets" on public.user_wallets
  using (user_id = (select auth.uid())
         or (select public.has_role((select auth.uid()), 'admin'::public.app_role)));
alter policy "own or admin read verified wallets" on public.verified_wallets
  using (user_id = (select auth.uid())
         or (select public.has_role((select auth.uid()), 'admin'::public.app_role)));

-- 5. Foreign-key indexes ------------------------------------------------------------------
create index if not exists admin_audit_log_actor_id_idx on public.admin_audit_log (actor_id);
create index if not exists payment_case_events_actor_id_idx on public.payment_case_events (actor_id);
create index if not exists payment_cases_opened_by_idx on public.payment_cases (opened_by);
create index if not exists app_mode_events_user_id_idx on public.app_mode_events (user_id);
