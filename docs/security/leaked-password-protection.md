# Leaked-password protection (30 Oct 2026; free-plan solution 19 Nov 2026)

**Status:** Supabase's own "Prevent use of leaked passwords" (HaveIBeenPwned) is a Pro-plan
feature, and the organisation is on the free plan, so the security advisor keeps reporting
`auth_leaked_password_protection`. The owner asked (19 Nov) for a solution without Pro. The app
now does the same check itself, everywhere a password is chosen or used in LamportPay, and the
free-plan password rules are switched on in Supabase.

## What the app does

All checks use `src/lib/password-check.ts`: HaveIBeenPwned's range API with k-anonymity (only the
first 5 hex characters of the password's SHA-1 leave the browser, with response padding). If the
service cannot be reached the check is skipped (fail open), because Supabase's rules still apply.

| Where | What happens with a leaked password |
| --- | --- |
| `/auth/reset` (every new password: resets, invites, the change below) | Refused with a clear message |
| `/auth` customer sign-in | Signs in, then goes straight to `/auth/reset?reason=breached` to choose a new one |
| `/admin/login` | Admin access refused; the page switches to "Reset admin password" (email link) |

The admin check covers passwords chosen before any of this existed, which Supabase's own setting
would not re-check either. Admin accounts also need the authenticator-app code (MFA): Supabase
refuses a password change from a session that has not passed it ("AAL2 session is required"), so
`/auth/reset` asks an MFA account for its current code before saving (fixed 19 Nov, after the
owner's first admin reset failed with that message).

## Supabase settings (free plan; Authentication → Sign In / Providers → Email)

Set 19 Nov 2026 on `gdksfksypkcfiohozzsx`:

- Minimum password length **12**; required characters **lowercase, uppercase letters and digits**
  (enforced by Supabase for every new password, including direct API calls; existing passwords
  keep working until they are changed).
- **Secure password change** on (a password change needs a sign-in from the last 24 hours).
- Leave "Require current password when updating" off: a reset link has no current password.

## What is still different from the Pro feature

The app's check runs in the browser, so someone calling the Supabase Auth API directly (with the
public key) could still choose a leaked password for an account of their own. That only weakens
their own account; anyone using LamportPay's pages is protected, and admin access always is. The
advisor warning stays until the organisation moves to Pro (also needed for a separate production
database, backups and no auto-pause); then turn the Supabase setting on as well.
