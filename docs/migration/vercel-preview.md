# Vercel Preview migration (testing branch `vercel-preview-migration`)

Status 29 Oct 2026. Lovable, `main`, lamportpay.com, the live (Lovable Cloud) database and every
production credential are unchanged. Nothing in this file has been applied to any existing
database, and no Vercel deployment exists yet.

## 1. What the branch contains

| Commit | What |
|---|---|
| `bd4bcce` | `main` at branch time (Lovable sync, 28 Oct) |
| `0156935` (merge `7a6dcb0`) | `fix/vercel-readiness`: `CRON_SECRET` for the cron route, recovery fallback without an AI gateway, valid `vercel.json`, Lovable-only schema moved into `supabase/migrations` |
| `1b12d7e` (merge `5632f35`) | Security round 3: wallet sign-in host allowlist, admin bootstrap + confirmed-email checks, public RPC / AI rate limits |
| `1107b7b` | Public npm registry for `package-lock.json` (+ `.npmrc`), Node 22 (`engines`), `vercel.json` install/build commands with Git deployments **paused**, seroval 1.6.12 / fast-uri 3.1.9 security patches |

`bun.lock` still resolves from Lovable's private mirror and is left alone so Lovable keeps
working; Vercel uses `npm ci` (set in `vercel.json`), never bun.

## 2. Vercel project (company team only)

Not created yet: the Vercel connector available to the engineering agent is a personal account
and was not used. Owner steps, in the **company** Vercel team:

1. Vercel → Add New → Project → Import `lamportpay/lamport` (requires the Vercel GitHub app on the
   `lamportpay` org with access to this repository only).
2. Framework preset: leave as detected; the build writes Vercel's Build Output API
   (`.vercel/output`, Nitro preset `vercel`). Install `npm ci`, build `npm run build` and Node
   22.x come from `vercel.json` / `package.json` `engines`.
3. Settings → Git → Ignored Build Step, custom command (builds only this branch):
   `[ "$VERCEL_GIT_COMMIT_REF" = "vercel-preview-migration" ] && exit 1 || exit 0`
4. Add **no** Production environment variables and **no** domain. Vercel Cron only runs on
   production deployments, so it stays off.
5. Settings → Deployment Protection: keep Vercel Authentication on Preview deployments.
6. Settings → Environment Variables: scope every variable to **Preview** and the
   `vercel-preview-migration` branch (names in section 4). Turn on "Automatically expose System
   Environment Variables" (`VERCEL_URL`, `VERCEL_BRANCH_URL` are part of the wallet sign-in
   allowlist).
7. After the Preview database and variables are approved: change `git.deploymentEnabled` in
   `vercel.json` to `true` on this branch (a reviewed commit) and push. That push is the first
   deployment.

Importing the repository can start one production build of `main`. With no Production variables
and no domain it serves nothing usable on `*.vercel.app` only; cancel it if it starts.

## 3. Database for Preview

**Recommended: a new, company-owned Supabase project** (for example `lamportpay-preview`), filled
with the migrations below and made-up test data only.

The existing dev project `gdksfksypkcfiohozzsx` was assessed read-only on 29 Oct:

| Check | Result |
|---|---|
| Schema parity | Column-level schema (279 columns, names + nullability) identical to a fresh build of the 28 migration files (md5 match) |
| RLS / grants | RLS on all 22 tables; no `anon` grants; 25 policies, none for `anon` |
| Advisors | Leaked-password protection **off**; `has_role` callable by signed-in users (accepted, self-only); three service-only tables without policies (intended) |
| Scheduler | `lamportpay-reconcile-payments` every 5 min, inert (no Vault secrets) |
| Data | Sandbox only: 83 payments (80 USDC, 3 USDT), 9 auth users (4 admins), 0 early-access signups, 0 support chats |
| Fees | 200 bps stored, no revenue wallet → fee off |
| Ownership | Personal Supabase org, shared with local development |
| Migration history | Applied versions were re-stamped (do not match file names), so `supabase db push` against it would try to re-apply everything |

It can serve a short Preview smoke test without any schema change, but it is not isolated
(shared with development, personal org, team admin accounts) and its Auth settings (Site URL,
redirect URLs) would have to change. Use it only with explicit owner approval.

### Ordered migration plan for a fresh database

Apply **all 28 files in `supabase/migrations/` in file-name order** (for example
`supabase link --project-ref <new-ref>` then `supabase db push`). **Do not apply
`drizzle/migrations/`**: its four files are superseded by `20261028100000_lovable_parity.sql`
(`support_chats` was already in `20261015030000`), and applying them on top fails with
"relation already exists".

Verified 29 Oct on a throwaway local Postgres 16 with stand-ins for Supabase's auth schema,
roles, Vault, pg_cron and pg_net: all 28 files apply with no error; 22 tables, all with RLS, no
`anon` grants; every table, column, enum and RPC function matches `src/integrations/supabase/types.ts`
(generated from the live Lovable database) except `payment_case_events` (below). Re-run on the
real Supabase project (Postgres 17) and then:

- Auth → enable leaked-password protection; Site URL and redirect URLs = the Preview URL;
  custom SMTP if more than a few test emails are needed.
- Leave the Vault secrets `lamportpay_reconcile_url` / `lamportpay_cron_secret` unset (scheduler
  inert) unless Deployment Protection is bypassed for it.
- First admin: set `ADMIN_BOOTSTRAP_EMAIL` (Preview scope) to a confirmed test account, claim, then
  remove the variable.

**Schema drift on live:** in `types.ts`, `payment_case_events` on the live database has `event`
(nullable) and `detail` (NOT NULL) columns that no migration creates, and `action` is nullable.
The code never writes `detail`; if it has no default, case-history inserts on live fail (the
error is only logged). Owner check in the Lovable Cloud SQL editor before any data export.

## 4. Preview environment variable names

Required (Preview scope, test values only):
`LAMPORTPAY_MODE`, `VITE_LAMPORTPAY_MODE` (both `test`), `SUPABASE_URL`,
`SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_ID`,
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`,
`STABLES_API_URL` (sandbox), `STABLES_API_KEY` (`sti_test_` only), `STABLES_WEBHOOK_SECRET`
(a separate sandbox endpoint for Preview), `CRON_SECRET` (Preview-only value),
`LAMPORTPAY_TEST_URL` (the exact approved Preview URL), `PAYMENT_ENABLED_CURRENCIES` = `usdc`
(unset means USDC **and** USDT).

Optional: `SOLANA_DEVNET_RPC_URL`, `JUPITER_API_KEY`, `JUPITER_REFERRAL_ACCOUNT`,
`LAMPORTPAY_FEE_BPS`, `LAMPORTPAY_FEE_MIN`, `LAMPORTPAY_FEE_MAX`, `LAMPORTPAY_REVENUE_WALLET`
(a devnet test wallet, never the company wallet), `LAMPORTPAY_SWAP_FEE_BPS` (0),
`PAYMENT_MIN_USDC`, `PAYMENT_MAX_USDC`, `PAYMENT_MIN_USDT`, `PAYMENT_MAX_USDT`,
`PAYOUT_COUNTRIES`, `PAYOUT_ESTIMATE_MINUTES`, `SOLANA_FEE_RESERVE_LAMPORTS`,
`SWAP_MAX_PRICE_IMPACT_BPS`, `SWAP_MAX_SLIPPAGE_BPS`, `SWAP_SIZE_BUFFER_BPS`,
`ADMIN_BOOTSTRAP_EMAIL` (once).

Never in Preview: `LAMPORTPAY_LIVE_APPROVED_BY`, `LAMPORTPAY_LIVE_APPROVED_AT`,
`LAMPORTPAY_LIVE_URL`, `SOLANA_RPC_URL`, `LAMPORTPAY_SHARED_DB`, `LOVABLE_CRON_SECRET`,
`LOVABLE_CRON_SECRET_PREVIOUS`, `LOVABLE_API_KEY`, `LOVABLE_SANDBOX`, `NITRO_PRESET`, any
`sti_live_` key.

Provided by Vercel: `VERCEL`, `VERCEL_URL`, `VERCEL_BRANCH_URL`, `VERCEL_PROJECT_PRODUCTION_URL`,
`NODE_ENV`.

## 5. Integrations on Preview

| Integration | Today (Lovable) | Preview |
|---|---|---|
| Cron reconcile | `LOVABLE_CRON_SECRET` | `CRON_SECRET` (route verified 29 Oct: no/wrong token 401, correct `Bearer` passes auth). Vercel Cron does not run on Preview; live sync on `/pay` covers status |
| Stables webhooks | Svix, `/api/public/stables-webhook` | Separate sandbox endpoint + secret; needs Vercel's protection bypass, otherwise rely on live sync |
| AI recovery assistant | Lovable AI gateway (`LOVABLE_API_KEY`) | Fixed steps per status (no AI). A direct provider is an owner decision |
| Ask AI / support chats | Built-in FAQ; complaints/emails stored in `support_chats` | Same code; empty table |
| Auth / email | Supabase Auth (password, admin magic link, server-side wallet sign-in) | Preview project; redirect URLs = Preview URL |
| MCP `/mcp` | Supabase OAuth issuer from `VITE_SUPABASE_PROJECT_ID`; demo tools | Works only if the Preview project's OAuth server is enabled; texts still say "demo" |
| Jupiter | Read-only quotes in TEST | Same (`JUPITER_API_KEY` optional) |
| GTM / GA | `GTM-M8XDHCH4` on every page before consent | Unchanged (open security item) |

## 6. Real data later (not part of Preview)

No real customer data goes to Preview. At cutover, with owner approval:

1. Confirm the live database (Lovable Cloud; the code names `zmcbnknjatrfwrcfvtzt`) and what
   Lovable exposes (connection string for `pg_dump`, or per-table CSV).
2. Export read-only: `auth.users` + `auth.identities` (keeps password hashes, wallet links and
   user IDs), then `public` data. Keep every `id` and `created_at` unchanged.
3. Restore into an access-restricted copy built from the 28 migrations, never into Preview.
4. Verify before anyone uses it: row counts per table; min/max `created_at`; md5 of the
   early-access order (`id` ordered by `created_at, id`) and of the first 10 (fee-waiver ranks);
   payments and fee-ledger totals by status and coin; `platform_fee_waiver_rank` per payment;
   orphan foreign keys; append-only tables unchanged.
5. Personal data (emails, names, chat contents) is handled only in that restricted copy; delete
   export files after verification.
