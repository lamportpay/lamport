-- Rollback of supabase/migrations/20261109100000_funding_pending_signature.sql.
-- Not a migration (the Supabase CLI never runs this folder). Run by hand, in one
-- transaction, only AFTER the code that reads these columns is no longer deployed.
-- Loses only pending markers (unverified signatures); verified funding is untouched.
begin;
drop index if exists public.payments_funding_pending_signature_idx;
alter table public.payments drop constraint if exists payments_funding_pending_complete;
alter table public.payments
  drop column if exists funding_pending_signature,
  drop column if exists funding_pending_at,
  drop column if exists funding_pending_last_valid_block_height,
  drop column if exists funding_build_blockhash,
  drop column if exists funding_build_last_valid_block_height;
commit;
