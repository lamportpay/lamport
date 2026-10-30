-- Admin MFA (30 Oct 2026): the admin role only counts for a session that passed the
-- authenticator-app step, i.e. Supabase assurance level aal2 (auth.jwt() ->> 'aal').
--
-- has_role() is the single admin check: every admin RLS policy (has_role(auth.uid(), 'admin'))
-- and every admin server function calls it with the admin's own session. So with this change a
-- password-only (aal1) session of an admin account reads and changes nothing an admin can,
-- whether through the app or the REST API directly.
--
-- Unchanged: the self-only rule from 20260929130000_has_role_self_only.sql; the service role
-- (server code acting for the platform, e.g. granting an invited admin's role); roles other
-- than admin. Same signature, SECURITY DEFINER and grants (CREATE OR REPLACE keeps them).
--
-- Rollback: re-run the definition from 20260929130000_has_role_self_only.sql.

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id
      and role = _role
      and (
        coalesce(auth.role(), '') = 'service_role'
        or (
          _user_id = auth.uid()
          and (_role <> 'admin' or coalesce(auth.jwt() ->> 'aal', '') = 'aal2')
        )
      )
  )
$$;
