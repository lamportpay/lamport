create table public.verified_wallets (
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
create policy "own or admin read verified wallets" on public.verified_wallets
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

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

create trigger trg_record_verified_wallet
  after insert or update of status on public.payments
  for each row execute function public.record_verified_wallet();

insert into public.verified_wallets (address, user_id, first_name, last_name, stables_customer_id, first_payment_id, verified_at)
select distinct on (w.address) w.address, p.user_id, c.first_name, c.last_name, c.stables_customer_id, p.id, p.updated_at
  from public.payments p
  join public.user_wallets w on w.user_id = p.user_id
  left join public.stables_customers c on c.user_id = p.user_id
 where p.status = 'COMPLETED'
 order by w.address, p.updated_at
on conflict (address) do nothing;