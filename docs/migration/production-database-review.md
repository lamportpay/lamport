# Production database: review of the 31 migrations (31 Oct 2026)

Review only. **Nothing has been applied to a production database**, and none exists yet: the
Supabase organisation is on the free plan, which allows two projects and already holds two
(LamportPay dev and an unrelated project). Creating the production project needs the Pro plan
and the owner's approval; applying these files to it needs a second explicit approval.

How it was checked: every file in `supabase/migrations/` read for what it creates, grants and
changes; searched for data changes (`insert`, `update`, `delete`, `drop`), scheduler and Vault
use, URLs, e-mail addresses, wallet addresses and project refs; the dev database's tables
compared with what the files create (read-only query, 31 Oct).

## Result

- The 31 files create exactly the 23 tables the dev database has (`admin_audit_log`,
  `admin_invites`, `app_mode_events`, `business_settings`, `early_access_signups`,
  `identity_events`, `jupiter_swap_orders`, `mock_kyc_submissions`, `mock_payout_transfers`,
  `ops_alerts`, `payment_case_events`, `payment_cases`, `payment_events`, `payment_fee_ledger`,
  `payment_swaps`, `payments`, `rate_limit_buckets`, `stables_customers`,
  `stables_webhook_events`, `support_chats`, `user_roles`, `user_wallets`, `verified_wallets`).
- No file references the live Lovable project or the dev project, no real e-mail address, no
  wallet address, no key. No customer data is created.
- Apply them **in file-name order, one file at a time**, to an empty project; stop at the first
  error. The dev database applied five of them under other names (the three Lovable files and
  `payment_controls_rate_limits` / `reconcile_scheduler` inside others), so production's
  migration history will match the repository, not dev's.

## Findings to settle before applying

| # | Finding | Recommendation |
| --- | --- | --- |
| P1 | `20260825170332_…` (Lovable's first file) inserts demo rows: 4 fake KYC submissions (example.com addresses) and 4 fake payout transfers into `mock_kyc_submissions` / `mock_payout_transfers`; `20260825172141_…` updates those demo rows. The app never reads these two tables (only the generated types mention them) | Production must start with no test data: add one migration that drops the two `mock_*` tables (apply to dev first; a drop has to be run by hand, the MCP tool hangs on it), or delete the demo rows right after building production. Owner decision |
| P2 | `20261007130000_reconcile_scheduler.sql` creates the `pg_cron` and `pg_net` extensions and schedules the 5-minute reconcile job; it does nothing until two Vault secrets exist | After the Production deployment: `lamportpay_reconcile_url` = `https://lamportpay.com/api/cron/reconcile-payments`, `lamportpay_cron_secret` = Production `CRON_SECRET` (owner enters the secret) |
| P3 | `20261030120000_admin_role_requires_mfa.sql`: admin rights need an authenticator (aal2) session | The first admin is claimed once with `ADMIN_BOOTSTRAP_EMAIL` and enrols TOTP before any admin page works |
| P4 | Backfills in `20261002100000_wallet_identity.sql` and `20261028100000_lovable_parity.sql` copy existing rows | No-ops on an empty database; nothing to do |
| P5 | Settings that are not in migrations | Supabase dashboard of the production project: Authentication → Web3 (Solana) provider on, Site URL `https://lamportpay.com`, redirect URLs for `https://lamportpay.com/**` and the Vercel Production URL, MFA (TOTP) on, leaked-password protection on (Pro), new sign-ups allowed |
| P6 | Expected advisor notices (same as dev): RLS on service-role-only tables with no policy (`business_settings`, `jupiter_swap_orders`, `rate_limit_buckets`); `has_role` callable by signed-in users (needed by the policies; answers only for the caller) | Run the security advisor after applying and compare with dev; anything new blocks LIVE |

## Files

| # | File | What it does | Data changes |
| --- | --- | --- | --- |
| 1 | `20260825170332_d9572f9a…` | Roles (`app_role`, `user_roles`, `has_role`), Lovable demo tables `mock_kyc_submissions`, `mock_payout_transfers` | Demo rows (P1) |
| 2 | `20260825170355_d58180c2…` | Grants on `has_role` | – |
| 3 | `20260825172141_20e5d425…` | `admin_audit_log`, `admin_invites`; tracking columns on the demo transfers | Updates demo rows (P1) |
| 4 | `20260926120000_stables_payments` | `stables_customers`, `payments`, `payment_events`, `stables_webhook_events` | – |
| 5 | `20260926150000_payments_fix_round` | Settled payout, payer wallet, reconciliation columns | – |
| 6 | `20260926170000_travel_rule` | Travel Rule columns on payments | – |
| 7 | `20260926190000_customer_name` | Name on the Stables customer record | – |
| 8 | `20260926200000_usdt_source` | USDT allowed as source (check widened) | – |
| 9 | `20260926220000_revoke_rls_auto_enable` | Revokes public execute on `rls_auto_enable()` | – |
| 10 | `20260926230000_phase2_grants_hardening` | Least-privilege grants on payment tables | – |
| 11 | `20260928120000_payment_swaps` | `payment_swaps` | – |
| 12 | `20260929120000_jupiter_swap_orders` | `jupiter_swap_orders` (one relay per order) | – |
| 13 | `20260929130000_has_role_self_only` | `has_role` answers only for the caller | – |
| 14 | `20260930120000_business_settings_platform_fee` | `business_settings`; fee columns on payments | – |
| 15 | `20260930150000_fee_ledger_pricing_snapshot` | Append-only `payment_fee_ledger`, immutable pricing snapshot | – |
| 16 | `20261001120000_fee_models` | Fee minimum/maximum (off by default) | – |
| 17 | `20261001130000_admin_audit_log_append_only` | Audit log refuses UPDATE/DELETE/TRUNCATE | – |
| 18 | `20261001130100_admin_audit_log_revoke_anon` | No grant for signed-out visitors | – |
| 19 | `20261001140000_payment_limits_admin` | Admin-editable payment limits | – |
| 20 | `20261002100000_wallet_identity` | `user_wallets`, `identity_events`, triggers on `auth.identities` | Backfill (P4) |
| 21 | `20261003100000_app_mode_events` | Append-only TEST/LIVE audit trail | – |
| 22 | `20261007100000_payment_cases` | `payment_cases`, `payment_case_events` (operations cases) | – |
| 23 | `20261007120000_payment_controls_rate_limits` | Emergency payment controls; `rate_limit_buckets`, `rate_limit_hit()` | – |
| 24 | `20261007130000_reconcile_scheduler` | `pg_cron`, `pg_net`, 5-minute reconcile job reading Vault | Job (P2) |
| 25 | `20261007140000_privilege_hardening` | Removes broad grants | – |
| 26 | `20261015030000_support_chats` | `support_chats` | – |
| 27 | `20261028100000_lovable_parity` | `verified_wallets`, `early_access_signups` (schema only; Lovable's data stays on Lovable) | Backfill (P4) |
| 28 | `20261028100100_new_tables_grants` | Least-privilege grants on the new tables | – |
| 29 | `20261030120000_admin_role_requires_mfa` | Admin role needs aal2 (P3) | – |
| 30 | `20261030130000_fee_ledger_no_truncate` | Fee ledger refuses TRUNCATE | – |
| 31 | `20261030140000_ops_alerts` | `ops_alerts`; index for webhook look-ups | – |

## After applying (checks, all read-only)

1. `list_migrations` shows 31 entries in file order (or 32 with the P1 migration).
2. The 23 tables above exist (21 if P1 drops the demo tables); every table has RLS on.
3. Security advisor: only the P6 notices.
4. Every table is empty (dev: all 23 tables have RLS on, checked 31 Oct); rows appear only from
   the first admin, the first settings save and real use.
