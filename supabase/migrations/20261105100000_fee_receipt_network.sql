-- Fee receipt evidence per payment, with the network it was seen on (5 Nov 2026).
--
-- Why: TEST MODE now moves the real LamportPay fee in devnet test USDC to the revenue wallet
-- (owner request, 5 Nov 2026), so every admin figure must tell a devnet test fee (never revenue)
-- from a mainnet fee (revenue). The receipt is written once by the server after it reads the
-- transaction on-chain, and can then never change.
--
--   payments.platform_fee_network      'solana' (mainnet: revenue) or 'solana-devnet' (test only)
--   payments.platform_fee_signature    the transaction that carried the fee (one payment each)
--   payments.platform_fee_received_at  when the server verified the fee on-chain
--   payment_fee_ledger.network         the same marker on the ledger's 'received' rows
--
-- Rollback:
--   drop trigger trg_payments_fee_receipt_immutable on public.payments;
--   drop function public.payments_fee_receipt_immutable();
--   alter table public.payments drop constraint payments_fee_receipt_complete;
--   drop index public.payments_platform_fee_signature_key;
--   alter table public.payments drop column platform_fee_network,
--     drop column platform_fee_signature, drop column platform_fee_received_at;
--   alter table public.payment_fee_ledger drop column network;

alter table public.payments
  add column platform_fee_network text
    check (platform_fee_network in ('solana', 'solana-devnet')),
  add column platform_fee_signature text,
  add column platform_fee_received_at timestamptz;

-- One transaction carries the fee of at most one payment.
create unique index payments_platform_fee_signature_key
  on public.payments (platform_fee_signature)
  where platform_fee_signature is not null;

-- A receipt is all or nothing: amount, network, transaction and time together.
alter table public.payments add constraint payments_fee_receipt_complete check (
  (platform_fee_received_at is null
     and platform_fee_network is null
     and platform_fee_signature is null)
  or (platform_fee_received_at is not null
     and platform_fee_network is not null
     and platform_fee_signature is not null
     and platform_fee_received_minor is not null)
);

-- Once recorded, the receipt is fixed (no second count, no edit).
create or replace function public.payments_fee_receipt_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.platform_fee_received_at is not null and (
       new.platform_fee_received_at is distinct from old.platform_fee_received_at
    or new.platform_fee_network is distinct from old.platform_fee_network
    or new.platform_fee_signature is distinct from old.platform_fee_signature
    or new.platform_fee_received_minor is distinct from old.platform_fee_received_minor
  ) then
    raise exception 'the fee receipt of payment % is fixed', old.id;
  end if;
  return new;
end;
$$;

create trigger trg_payments_fee_receipt_immutable
  before update on public.payments
  for each row execute function public.payments_fee_receipt_immutable();

revoke execute on function public.payments_fee_receipt_immutable() from public, anon, authenticated;

alter table public.payment_fee_ledger
  add column network text check (network in ('solana', 'solana-devnet'));
