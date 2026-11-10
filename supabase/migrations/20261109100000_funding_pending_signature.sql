-- Double-payment protection for Pay Now (Production readiness Batch 1, 9 Nov 2026;
-- revised in the 10 Nov review).
--
-- The wallet signs and sends the funding transaction itself. Until now the server
-- learnt the signature only when on-chain verification succeeded, so a failed
-- confirmation followed by a page reload let the customer build and send a
-- second payment. The signature is now stored as "pending" as soon as the wallet
-- returns it; while it may still land, no new funding transaction is built.
--
-- funding_pending_last_valid_block_height: the chain height after which the
--   pending transaction can no longer land, set at its first on-chain check
--   (chain height then + 151 blocks; see BLOCKHASH_VALIDITY_BLOCKS in
--   src/lib/solana-usdc.server.ts). Null until that check.
-- A pending signature never marks a payment as funded: funding_signature is
-- still written only after on-chain verification.
-- The index is deliberately NOT unique: a signature someone records on their
-- own payment must never block another payment (funding_signature stays unique).
--
-- funding_build_blockhash / funding_build_last_valid_block_height: the blockhash
--   of the funding transaction prepared last. While it can still land, the same
--   wallet gets exactly the same transaction again (same signature, processed
--   once) and another wallet is refused: two open windows cannot send two
--   different payments (10 Nov review).
--
-- Deploy order: apply this migration before the code that uses the columns.
-- Rollback (deploy the previous code first, then):
--   supabase/rollbacks/20261109100000_funding_pending_signature.down.sql

alter table public.payments
  add column if not exists funding_pending_signature text,
  add column if not exists funding_pending_at timestamptz,
  add column if not exists funding_pending_last_valid_block_height bigint,
  add column if not exists funding_build_blockhash text,
  add column if not exists funding_build_last_valid_block_height bigint;

create index if not exists payments_funding_pending_signature_idx
  on public.payments (funding_pending_signature)
  where funding_pending_signature is not null;

alter table public.payments
  drop constraint if exists payments_funding_pending_complete;
alter table public.payments
  add constraint payments_funding_pending_complete
  check ((funding_pending_signature is null) = (funding_pending_at is null));

comment on column public.payments.funding_pending_signature is
  'Wallet-returned funding signature not yet verified on-chain; blocks building another funding transaction while it can still land.';
