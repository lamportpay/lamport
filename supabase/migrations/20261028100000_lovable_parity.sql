-- Bring this database level with what the app expects (28 Oct 2026).
--
-- Lovable kept four schema changes in drizzle/migrations/ instead of here, so they were
-- never applied to this project: verified_wallets (0000), early_access_signups (0002) and
-- the early-access fee waiver (0003). support_chats (0001) is already in
-- 20261015030000_support_chats.sql. This file adds the other three, in their original
-- order, unchanged except:
--   * every statement is safe to re-run (if not exists / or replace);
--   * early_access_signups.mobile is nullable: the site's form stopped asking for a
--     mobile number and the insert in src/routes/api/early-access.ts sends none
--     (the generated types already show it as nullable on the Lovable database).
-- Additive only: no table, column or row is dropped or changed.

-- ---------------------------------------------------------------- verified_wallets (0000)
create table if not exists public.verified_wallets (
  address text primary key,
  user_id uuid not null,
  first_name text,
  last_name text,
  email text,
  stables_customer_id text,
  first_payment_id uuid,
  verified_at timestamptz not null default now()
);
grant select on public.verified_wallets to authenticated;
grant all on public.verified_wallets to service_role;
alter table public.verified_wallets enable row level security;
drop policy if exists "own or admin read verified wallets" on public.verified_wallets;
create policy "own or admin read verified wallets" on public.verified_wallets
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- A wallet becomes permanently verified when a payment from it completes.
create or replace function public.record_verified_wallet()
returns trigger language plpgsql security definer set search_path to ''
as $$
declare addr text; c record;
begin
  if new.status <> 'COMPLETED' or (tg_op = 'UPDATE' and old.status = 'COMPLETED') then
    return new;
  end if;
  addr := coalesce(new.payer_wallet, new.funding_payer);
  select first_name, last_name, stables_customer_id into c
    from public.stables_customers where user_id = new.user_id;
  begin
    if addr is not null then
      insert into public.verified_wallets (address, user_id, first_name, last_name, stables_customer_id, first_payment_id)
      values (addr, new.user_id, c.first_name, c.last_name, c.stables_customer_id, new.id)
      on conflict (address) do nothing;
    end if;
    insert into public.verified_wallets (address, user_id, first_name, last_name, stables_customer_id, first_payment_id)
    select w.address, new.user_id, c.first_name, c.last_name, c.stables_customer_id, new.id
      from public.user_wallets w where w.user_id = new.user_id
    on conflict (address) do nothing;
  exception when others then
    raise warning 'record_verified_wallet failed for %: %', new.id, sqlerrm;
  end;
  return new;
end $$;
revoke all on function public.record_verified_wallet() from public, anon, authenticated;

drop trigger if exists trg_record_verified_wallet on public.payments;
create trigger trg_record_verified_wallet
  after insert or update of status on public.payments
  for each row execute function public.record_verified_wallet();

-- Wallets that already completed a payment.
insert into public.verified_wallets (address, user_id, first_name, last_name, stables_customer_id, first_payment_id, verified_at)
select distinct on (w.address) w.address, p.user_id, c.first_name, c.last_name, c.stables_customer_id, p.id, p.updated_at
  from public.payments p
  join public.user_wallets w on w.user_id = p.user_id
  left join public.stables_customers c on c.user_id = p.user_id
 where p.status = 'COMPLETED'
 order by w.address, p.updated_at
on conflict (address) do nothing;

-- ---------------------------------------------------------------- early_access_signups (0002)
create table if not exists public.early_access_signups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 255),
  mobile text check (mobile is null or char_length(mobile) between 6 and 25),
  created_at timestamptz not null default now()
);
create unique index if not exists early_access_signups_email_key
  on public.early_access_signups (lower(email));
grant select on public.early_access_signups to authenticated;
grant all on public.early_access_signups to service_role;
alter table public.early_access_signups enable row level security;
drop policy if exists "Admins read early access signups" on public.early_access_signups;
create policy "Admins read early access signups" on public.early_access_signups
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------- fee waiver (0003)
-- The first 10 early-access signups pay no LamportPay fee (owner decision 2026-10-15).
alter table public.early_access_signups
  add column if not exists wallet_address text;
comment on column public.early_access_signups.wallet_address is
  'Solana wallet that was connected when this person joined early access. Used to match the fee waiver to the wallet that actually pays; Solana addresses are case sensitive, so they are compared exactly.';
create index if not exists early_access_signups_wallet_idx
  on public.early_access_signups (wallet_address);

alter table public.payments
  add column if not exists platform_fee_waiver text,
  add column if not exists platform_fee_waiver_rank integer;
comment on column public.payments.platform_fee_waiver is
  'Reason LamportPay charged no fee on this payment (early_access). Null when the fee was charged as configured.';
comment on column public.payments.platform_fee_waiver_rank is
  'Position in the early-access list (1 = first) that earned the waiver.';

-- Pricing is fixed once quoted, so the waiver that came with the quote is frozen with it.
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
