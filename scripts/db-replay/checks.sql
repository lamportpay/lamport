-- Access-control checks after every migration (local replay database only).
\set ON_ERROR_STOP 1
\set QUIET 1
create schema if not exists t;
create or replace function t.ok(name text, cond boolean) returns void language plpgsql as $$
begin if cond is not true then raise exception 'FAILED: %', name; end if; raise notice 'pass: %', name; end $$;
create or replace function t.denied(name text, stmt text) returns void language plpgsql as $$
begin
  begin execute stmt; exception when insufficient_privilege then raise notice 'pass: % (denied)', name; return; end;
  raise exception 'FAILED: % was allowed', name;
end $$;
grant usage on schema t to authenticated, anon, service_role; grant execute on all functions in schema t to authenticated, anon, service_role;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'user@test.invalid'),
  ('00000000-0000-0000-0000-00000000000b', 'admin@test.invalid');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000000b', 'admin');
insert into public.payments (user_id, destination_country, destination_currency, source_amount_minor)
values ('00000000-0000-0000-0000-00000000000a', 'GB', 'gbp', 15000000);
insert into public.admin_invites (email) values ('invitee@test.invalid');

-- ordinary user, own session
begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated","aal":"aal1"}', true);
set local role authenticated;
select t.ok('user sees own payment', (select count(*) from public.payments) = 1);
select t.ok('user sees no roles', (select count(*) from public.user_roles) = 0);
select t.ok('user is not admin', not public.has_role('00000000-0000-0000-0000-00000000000a', 'admin'));
select t.ok('user cannot ask about another user', not public.has_role('00000000-0000-0000-0000-00000000000b', 'admin'));
select t.ok('user sees no invites', (select count(*) from public.admin_invites) = 0);
rollback;

-- admin with authenticator code (aal2)
begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;
select t.ok('aal2 admin is admin', public.has_role('00000000-0000-0000-0000-00000000000b', 'admin'));
select t.ok('aal2 admin reads all payments', (select count(*) from public.payments) = 1);
select t.ok('aal2 admin reads roles', (select count(*) from public.user_roles) = 1);
select t.ok('aal2 admin reads invites', (select count(*) from public.admin_invites) = 1);
insert into public.admin_audit_log (actor_id, action, entity_type) values ('00000000-0000-0000-0000-00000000000b', 'replay_test', 'test');
select t.ok('aal2 admin appends own audit row', true);
rollback;

-- admin account with password only (aal1)
begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated","aal":"aal1"}', true);
set local role authenticated;
select t.ok('aal1 admin is not admin', not public.has_role('00000000-0000-0000-0000-00000000000b', 'admin'));
select t.ok('aal1 admin reads no other payments', (select count(*) from public.payments) = 0);
select t.ok('aal1 admin still reads own role row', (select count(*) from public.user_roles) = 1);
rollback;

-- server (service role)
begin;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
set local role service_role;
select t.ok('service role sees admin', public.has_role('00000000-0000-0000-0000-00000000000b', 'admin'));
insert into public.admin_invites (email) values ('second@test.invalid');
delete from public.admin_invites where email = 'second@test.invalid';
select t.ok('service role manages invites', true);
rollback;

begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;
select t.denied('aal2 admin inserting a role', $$insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000000a', 'admin')$$);
select t.denied('aal2 admin deleting roles', $$delete from public.user_roles$$);
select t.denied('aal2 admin truncating roles', $$truncate public.user_roles$$);
select t.denied('aal2 admin inserting an invite', $$insert into public.admin_invites (email) values ('x@test.invalid')$$);
select t.denied('aal2 admin updating invites', $$update public.admin_invites set status = 'accepted'$$);
select t.denied('aal2 admin deleting invites', $$delete from public.admin_invites$$);
rollback;
begin;
set local role anon;
select t.denied('anon reading roles', $$select 1 from public.user_roles$$);
select t.denied('anon reading invites', $$select 1 from public.admin_invites$$);
rollback;
select t.ok('mock tables are gone', to_regclass('public.mock_kyc_submissions') is null and to_regclass('public.mock_payout_transfers') is null);
select t.ok('has_role search_path is empty', (select proconfig from pg_proc where oid = 'public.has_role(uuid,public.app_role)'::regprocedure) = array['search_path=""']);
begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated","aal":"aal1"}', true);
set local role authenticated;
select t.denied('ordinary user truncating roles', $$truncate public.user_roles$$);
select t.denied('ordinary user truncating invites', $$truncate public.admin_invites$$);
select t.denied('ordinary user writing a pending funding signature', $$update public.payments set funding_pending_signature = 'sig', funding_pending_at = now()$$);
rollback;

-- Funding pending-signature rules (20261109100000)
create or replace function t.raises(name text, stmt text, state text) returns void language plpgsql as $$
begin
  begin execute stmt; exception when others then
    if sqlstate = state then raise notice 'pass: % (%)', name, state; return; end if;
    raise exception 'FAILED: % raised % (%), expected %', name, sqlstate, sqlerrm, state;
  end;
  raise exception 'FAILED: % was accepted', name;
end $$;
begin;
insert into public.payments (user_id, destination_country, destination_currency, source_amount_minor)
values ('00000000-0000-0000-0000-00000000000a', 'GB', 'gbp', 15000000);
select t.raises('pending signature needs its timestamp',
  $$update public.payments set funding_pending_signature = 'replay-sig-2', funding_pending_at = null$$, '23514');
update public.payments set funding_pending_signature = 'replay-sig-1', funding_pending_at = now();
select t.ok('the same pending signature on two payments is allowed (never blocks another payment)',
  (select count(*) from public.payments where funding_pending_signature = 'replay-sig-1') = 2);
update public.payments set funding_pending_signature = null, funding_pending_at = null
 where funding_pending_signature = 'replay-sig-1';
select t.ok('pending signature can be cleared',
  not exists (select 1 from public.payments where funding_pending_signature is not null));
rollback;
