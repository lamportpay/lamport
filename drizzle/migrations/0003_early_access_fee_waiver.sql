-- Early-access fee waiver (owner decision 2026-10-15).
--
-- The first 10 people who joined early access from the website pay no
-- LamportPay fee. A signup is matched to the person who pays by the wallet they
-- had connected when they joined, or by the email they gave us. The payment row
-- records that the fee was waived and why, so a waived payment is never
-- confused with "no fee configured".

alter table public.early_access_signups
  add column if not exists wallet_address text;

comment on column public.early_access_signups.wallet_address is
  'Solana wallet that was connected when this person joined early access. Used to match the fee waiver to the wallet that actually pays; Solana addresses are case sensitive, so they are compared exactly.';

-- Exact-match lookup by wallet (the waiver check runs on every quote).
create index if not exists early_access_signups_wallet_idx
  on public.early_access_signups (wallet_address);

-- Why this payment's LamportPay fee is zero, and the signup's place in line.
alter table public.payments
  add column if not exists platform_fee_waiver text,
  add column if not exists platform_fee_waiver_rank integer;

comment on column public.payments.platform_fee_waiver is
  'Reason LamportPay charged no fee on this payment (early_access). Null when the fee was charged as configured.';
comment on column public.payments.platform_fee_waiver_rank is
  'Position in the early-access list (1 = first) that earned the waiver.';

-- Pricing is fixed once quoted (trg_payments_pricing_immutable), so the waiver
-- that came with the quote is frozen with it.
create or replace function public.payments_pricing_immutable()
 returns trigger
 language plpgsql
 set search_path to ''
as $function$
begin
  if old.pricing_snapshot is not null and (
       new.pricing_snapshot is distinct from old.pricing_snapshot
    or new.platform_fee_bps is distinct from old.platform_fee_bps
    or new.platform_fee_minor is distinct from old.platform_fee_minor
    or new.platform_fee_wallet is distinct from old.platform_fee_wallet
    or new.platform_fee_min_minor is distinct from old.platform_fee_min_minor
    or new.platform_fee_max_minor is distinct from old.platform_fee_max_minor
    or new.platform_fee_rule is distinct from old.platform_fee_rule
    or new.platform_fee_waiver is distinct from old.platform_fee_waiver
    or new.platform_fee_waiver_rank is distinct from old.platform_fee_waiver_rank
  ) then
    raise exception 'the pricing of payment % is fixed', old.id;
  end if;
  return new;
end;
$function$;
