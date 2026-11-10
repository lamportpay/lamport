-- Fee ledger: append-only against TRUNCATE too (30 Oct 2026), like admin_audit_log.
--
-- 20260930150000 refused UPDATE and DELETE row by row, but row triggers do not fire on TRUNCATE
-- and service_role still held UPDATE, DELETE and TRUNCATE. The app only inserts
-- (appendFeeLedger: INSERT ... ON CONFLICT DO NOTHING), so those privileges are not needed.
-- TRUNCATE is not reachable through the REST API; this closes it for direct connections too.
--
-- Rollback: drop trigger trg_fee_ledger_no_truncate on public.payment_fee_ledger;
--           grant update, delete, truncate on public.payment_fee_ledger to service_role;

create trigger trg_fee_ledger_no_truncate
  before truncate on public.payment_fee_ledger
  for each statement execute function public.fee_ledger_append_only();

revoke update, delete, truncate on public.payment_fee_ledger from anon, authenticated, service_role;
