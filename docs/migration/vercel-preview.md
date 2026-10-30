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

### Branches (29 Oct): one protected `main`, one working branch

There is no `develop`, so `vercel-preview-migration` is the shared working branch. `main` is
**not protected** yet (owner: Settings → Branches → add a rule for `main`: require a pull
request and the `CI` status check, block force pushes and deletion).

| Branch | Commits not in `main` or this branch | Open PR | Proposal (nothing deleted) |
|---|---|---|---|
| `fix/vercel-readiness` | 0 | lamportpay/lamport#1 → `main` | Keep until #1 is reviewed; its commit is already here |
| `claude/jolly-archimedes-f39xm5` | 0 | – | Safe to delete after approval |
| `fix/launch-blockers`, `fix/dependency-audit`, `docs/readme-accuracy`, `docs/readme-refresh`, `docs/update-project-documentation` | 0 (all in `main`) | – | Safe to delete after approval |
| `social-media` | 11 (unrelated history: 162 image/video files) | – | Keep; better moved to Drive or a separate assets repository |

## 2. Vercel project (company team only)

Status 29 Oct (night): project **`lamport`** (`prj_NpycYKRJJS6K2JPzfuSZEBjd6IRd`) created in the
company team `lamportpay-7634` (Hobby plan) with owner approval:

| Setting | Value (read back from Vercel) |
|---|---|
| Git | `lamportpay/lamport`, production branch `main` |
| Ignored Build Step | builds only `vercel-preview-migration` (`[ "$VERCEL_GIT_COMMIT_REF" = "vercel-preview-migration" ] && exit 1 \|\| exit 0`); `main`, including Lovable's pushes, is skipped, so no production deployment of `main` is made |
| Build | framework none (Nitro writes `.vercel/output`), install `npm ci`, build `npm run build`, Node 22.x |
| Deployment Protection | Vercel Authentication on all deployments except custom domains (there are none) |
| System environment variables | exposed (`VERCEL_URL`, `VERCEL_BRANCH_URL` for the wallet sign-in allowlist) |
| Environment variables | 22, all Preview and branch `vercel-preview-migration` only; 0 Production. Secrets stored as Vercel "sensitive" (write-only) |
| Domains | none |
| Deployments | none; `vercel.json` on this branch keeps `git.deploymentEnabled: false` |

Preview variables loaded (names only): `LAMPORTPAY_MODE`, `VITE_LAMPORTPAY_MODE` (test),
`SUPABASE_PROJECT_ID`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`,
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (project `gdksfksypkcfiohozzsx`);
sensitive: `SUPABASE_SERVICE_ROLE_KEY`, `SOLANA_DEVNET_RPC_URL`, `JUPITER_API_KEY`,
`STABLES_API_KEY` (sandbox), `STABLES_WEBHOOK_SECRET`, `CRON_SECRET`; config: `STABLES_API_URL`
(sandbox), `PAYMENT_MAX_USDC`, `PAYMENT_MIN_USDT`, `PAYMENT_MAX_USDT`, `LAMPORTPAY_FEE_BPS`,
`LAMPORTPAY_REVENUE_WALLET`, `LAMPORTPAY_SWAP_FEE_BPS` (0), `PAYMENT_ENABLED_CURRENCIES` (usdc).
Deliberately not set: `SOLANA_RPC_URL` (mainnet; TEST MODE blocks mainnet calls),
`PAYMENT_MIN_USDC` (code default 15), `JUPITER_REFERRAL_ACCOUNT` (swap fee is 0), and every
LIVE-only variable. These values were shared in a chat session on 29 Oct: rotate the service-role
key, the Alchemy RPC key and the Jupiter key once Preview is verified (owner-approved plan).

Hobby is for non-commercial use, has one member and runs crons once a day; production needs a
paid plan. Remaining steps (7 below) wait for owner approval.

Owner steps, in the **company** Vercel team:

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

**Owner decision 29 Oct: no new project; Preview uses the existing project
`gdksfksypkcfiohozzsx`.** It needs **no schema change**: its schema still matches the 28 migration
files exactly (re-checked 29 Oct evening, same fingerprint). Nothing below has been changed on it.

Identity (verified): project `gdksfksypkcfiohozzsx`, name "LamportPay", region ap-southeast-2,
Postgres 17, in the Supabase organization "GhazanfarGw's Org" (**Free plan**; the same org holds
an unrelated project). It is not the live database: it has no early-access signups and no
support chats, while the live site collects both.

### Before the Preview URL is shared (owner decisions; nothing done)

- **Admins:** admin accounts on the dev project are listed in the private owner report, not
  here. Admin access now needs an authenticator-app code (30 Oct); keep Vercel Deployment
  Protection on, and remove the admin role from test accounts (owner decision).
- **Auth URLs:** Authentication → URL Configuration must list the Preview URL as a redirect URL
  (password reset and admin magic links use the page's own origin).
- **Leaked-password protection:** off; Supabase offers it on paid plans only.
- **Coins:** the project stores no coin list, so set `PAYMENT_ENABLED_CURRENCIES=usdc` in Preview
  (unset means USDC and USDT).
- **Scheduler:** `lamportpay-reconcile-payments` runs every 5 minutes and does nothing while the
  two Vault secrets are unset; leave them unset for Preview.

### Recovery plan (before any future change to this database)

1. Free plan: no point-in-time recovery. Before a change, the owner takes a dump on their own
   machine with the Supabase CLI (`supabase db dump` for the schema, `supabase db dump
   --data-only` for data), stored outside the repository; or the org moves to a paid plan with
   daily backups.
2. Changes only as reviewed files in `supabase/migrations/`, additive and safe to re-run, each
   with its rollback SQL written down; no destructive statements.
3. Record the schema fingerprint (md5 of `table.column nullability`, 279 lines today) before and
   after, and re-run the security advisors.
4. Stop if a change would touch payment rows, users or admin roles.

**Migration history (metadata only, not done):** the project's history lists 26 re-stamped
versions instead of the 28 file versions, so `supabase db push` would try to re-apply every file.
With approval it can be aligned without touching schema or data
(`supabase migration repair --status reverted <old versions>` then `--status applied <file
versions>`); afterwards `supabase db push --dry-run` must report nothing to apply.

### Earlier read-only assessment (29 Oct, morning)

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

## 7. First Preview deployment and live checks (29 Oct, night)

**Deployed:** `dpl_4jM185DamSwwKs6kirtjdfXctF2B`, target **preview**, commit `7d9bb25`, at
`lamport-ck56g1480-lamportpay-7634.vercel.app` and the branch alias
`lamport-git-vercel-preview-migration-lamportpay-7634.vercel.app` (Vercel Authentication on).
Created with an explicit preview deployment through the Vercel API.

**Incident (no impact):** the first Git-triggered build (`877c02e`, `dpl_Aw2tE93vEAg3HnKjy63DtVctn2VT`)
was classified by Vercel as **production**: aliases `lamport-kohl.vercel.app` and
`lamport-lamportpay-7634.vercel.app`, protected, and without the Preview-only variables (0
Production variables exist), so it holds no credentials. lamportpay.com, Lovable and `main`
were not touched. Git-triggered deployments were paused again (`7d9bb25`). Owner: in Vercel →
project `lamport` → Settings → Environments → Production, set branch tracking to `main`, and
delete that deployment if not wanted.

**Live checks on the Preview (GET via Vercel's authenticated fetch):**

| Check | Result |
|---|---|
| `/api/integration-status` | mode `test`, devnet, Stables sandbox, `realFunds: false`, LIVE unavailable, Jupiter configured, webhook verification on |
| Security headers (every response) | CSP `frame-ancestors 'none'`, HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy, `X-Robots-Tag: noindex` |
| `/api/solana/health?cluster=devnet` | reachable (Alchemy devnet) |
| `/api/solana/health?cluster=mainnet-beta` | refused: "TEST MODE: the mainnet-beta cluster is blocked" |
| `/api/cron/reconcile-payments` without the secret | 401 (request reached the app) |
| `/mcp` without OAuth | 401 (request reached the app) |
| `/api/kyc` signed out | 401 |
| `/pay`, `/admin/login` | 200; GTM tag present on both (open item) |
| Business settings | **failed: Supabase answered "Unregistered API key" for `SUPABASE_SERVICE_ROLE_KEY`**. The publishable key matches the project; the secret key does not. The app fails safe (status falls back to defaults; payment actions pause), so database features (sign-in records, payments, admin data) do not work on Preview until the key is replaced |

**Not testable from here:** POST endpoints (Stables webhook signatures, payment creation, the
read-only Jupiter ExactOut quote): the available fetch tool is GET-only and this environment
cannot reach `*.vercel.app` directly. These remain covered by unit tests (553) and the local
integration run.

**To finish Preview (owner):**
1. Supabase → project `gdksfksypkcfiohozzsx` → Project Settings → API Keys → copy (or create) a
   secret key, then Vercel → `lamport` → Settings → Environment Variables → edit
   `SUPABASE_SERVICE_ROLE_KEY` (Preview, branch `vercel-preview-migration`) and paste it there,
   not in chat. Then redeploy the Preview.
2. Supabase → Authentication → URL Configuration → add the Preview URL to Redirect URLs.
3. Set Vercel's production branch to `main` (above).

## 8. Preview connected to the database (30 Oct)

- **Key:** the owner's new `sb_secret_` key was saved as a Production-only variable; it was moved
  (owner approved) to Preview, branch `vercel-preview-migration`. The project again has no
  Production variables. The old key from the uploaded `.env` (Supabase answered "Unregistered API
  key") is out of date; the local `.env` needs the new one.
- **Result:** Preview `dpl_BWEVZbZyiv36iat34UY7QAvqbG2a` (`599b443`) reads business settings from
  the dev project: USDC only, fee 200 bps, 15–5,000 USDC (TEST profile), payout countries US, GB,
  IN, PH. Security checks from section 7 repeated with the same results.
- **PGRST303:** with the same valid key, Supabase refused one of two parallel requests with
  "JWT issued at future" (09:45 and 10:03 UTC; edge logs show the other request answered 200, and
  the database clock was correct). The three Supabase clients now share
  `src/integrations/supabase/fetch.ts`, which retries such a request once after 1 s
  (`tests/supabase-fetch.unit.test.ts`). If it keeps happening, report it to Supabase support
  with the project ref and those times.
- **Vercel production branch is now `main`.** `main` has an empty `vercel.json` (from Lovable), so
  each Lovable push to `main` makes a production build that fails at `build-container-init`
  (`invalid_vercel_json`, e.g. `dpl_2mtPYuiZiKnCg5x9FWu6pWRjJ3nt` for `e1b3e61`). Nothing is built
  or served and the Lovable site is unaffected; it stops once `main` gets a valid `vercel.json`.
- **Leftover production deployments** of `877c02e` (`dpl_Aw2t…`, `dpl_Hv4B…`, `dpl_9PUf…`):
  `*.vercel.app` only, behind Vercel login. Owner may delete them; do not use "Redeploy".
