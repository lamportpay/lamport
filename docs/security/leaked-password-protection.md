# Leaked-password protection (prepared 30 Oct 2026)

**Status:** the Supabase security advisor reports "Leaked Password Protection Disabled" on the dev
project. The project's organisation is on the **free** plan; Supabase documents leaked-password
protection (HaveIBeenPwned) as a paid-plan feature, so it cannot be switched on there today.

## What the app does now

`/auth/reset` (the only page where a password is chosen in the app; admin invites and password
resets both land there) checks the new password with `src/lib/password-check.ts` before saving it:

- HaveIBeenPwned range API with k-anonymity: only the first 5 hex characters of the SHA-1 leave the
  browser, with response padding on;
- a password found in any breach is refused with a clear message;
- if the service cannot be reached the check is skipped (fail open), because Supabase's own
  password rules still apply.

This is a browser-side check: it protects people choosing a password in the app, not someone
calling the Supabase API directly. Admin accounts are additionally protected by MFA.

## Owner steps (Supabase dashboard, per project; dev first, production later)

1. Make sure the project sits in a **company-owned** Supabase organisation on a plan that includes
   leaked-password protection (the dev project is currently in a contributor's personal
   organisation).
2. Authentication → Sign In / Providers → Email → Password security:
   - turn on **Prevent use of leaked passwords**;
   - minimum password length **12**;
   - required characters: lowercase, uppercase, digits (symbols optional).
3. Authentication → Multi-Factor: TOTP **enabled** (default) for admin MFA.
4. Check: Advisors → Security no longer lists `auth_leaked_password_protection`.
5. Existing passwords are not re-checked; ask admins to reset theirs once after step 2.
