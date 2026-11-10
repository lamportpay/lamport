-- Supabase's default privileges give anon and authenticated full table rights on every new
-- table. RLS already refuses them (no anon policy, authenticated policies are read/update
-- for admins or own rows only), but, as in 20261007140000_privilege_hardening.sql, the
-- grants themselves should be no broader than what the app uses.
revoke all on public.support_chats, public.early_access_signups, public.verified_wallets
  from anon, authenticated;
grant select, update on public.support_chats to authenticated;
grant select on public.early_access_signups to authenticated;
grant select on public.verified_wallets to authenticated;
grant all on public.support_chats, public.early_access_signups, public.verified_wallets
  to service_role;
