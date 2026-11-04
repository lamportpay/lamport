# LamportPay: project status and handoff

**As of 4 November 2026 (local-first work: section 3, "Local-first work from 2 November 2026").** Read this first, then `CLAUDE.md`
(the project rules, which win over anything else, this file included). Update this file at the
end of every work session: what changed, what is left, what needs approval.

## 1. Where the project stands

The whole USDC-to-bank payment flow is built and tested in **TEST mode** (Solana devnet and the
Stables sandbox) and runs on a protected **Vercel Preview**. LIVE mode is **locked in code**
(`src/lib/app-mode-lock.ts`). Stables has verified the business (KYB) and issued production API
access (owner, 30 Oct); nothing production-side is configured yet.

| Phase | Status |
| --- | --- |
| 0 Business and architecture | Done |
| 1 Web3 MVP foundation | Done |
| 2 Stables sandbox flow | Built and tested; owner sign-off open |
| 3 Revenue engine | Built and tested; to be checked once with real money |
| Pre-LIVE security and the move from Lovable to Vercel | Mostly done (see section 6) |
| **4 Stables production go-live, controlled** | **In progress: next is production setup** |
| 5 Token expansion, 6 Compliance ops, 7 Advanced admin, 8 Notifications, 9 More payout providers, 10 External audit, 11 Scaling | After LIVE |
| Hyperliquid route (BTC, ETH and others) | Design only |

## 2. Where everything lives

| What | Where |
| --- | --- |
| Code | GitHub `lamportpay/lamport` (public). **All current work is on `vercel-preview-migration`.** `main` still holds the Lovable code and is not deployed by Vercel |
| Project rules | `CLAUDE.md` |
| This status file | `docs/STATUS.md` |
| Older execution tracker (to 21 Oct) | `docs/ROADMAP.md` |
| Hosting | Vercel, company team, project `lamport`, Hobby plan. Preview only, behind Vercel login, built from this branch. Production: non-secret settings only (31 Oct), no deployment. Builds are decided by `scripts/vercel-ignore-build.sh` (Production only from `main`, deliberately; Previews only for this branch) and `vercel.json` (Git pushes auto-deploy only this branch, never `main`) |
| Database | Supabase dev project `gdksfksypkcfiohozzsx` (the one in `supabase/config.toml`). Every migration in `supabase/migrations/` (31 files) is reflected there, some applied under other names, so compare with `list_migrations` before building a new database. The 5-minute reconcile job is scheduled but does nothing until its Vault secrets are set. The Lovable live database must never be touched (`CLAUDE.md`) |
| Payout partner | Stables. Sandbox key on the Preview. Production access issued; the production key is not in Vercel yet |
| Solana RPC | Alchemy. Devnet key on the Preview; mainnet key only for Production later |
| Swap quotes | Jupiter, API key on the Preview (read-only quotes in TEST) |
| Company tracker, Stables questions and answers | Owner's Google Drive (private) |
| Windows PC: backup, VS Code, daily Git workflow | `docs/LOCAL-SETUP-WINDOWS.md` |
| Production cutover (lamportpay.com stays the domain) | `docs/migration/production-cutover-checklist.md`; migrations reviewed in `docs/migration/production-database-review.md` |
| Lovable / VS Code workflow | Audit: `docs/LOVABLE-VSCODE-WORKFLOW-AUDIT.md`. Phased fix (R0–R10), approvals and decisions D1–D7: `docs/LOVABLE-VSCODE-REMEDIATION-PLAN.md` |
| Owner-facing status docs | "LamportPay: road to LIVE" and "LamportPay work report" (private Claude docs, shared by the owner) |

Secrets are never in the repository: only the empty `.env.example`. Preview variables live in
Vercel (names in `docs/migration/vercel-preview.md`); local work needs your own `.env` with
**sandbox** keys only.

## 3. Work done from 29 to 31 October 2026

| Date | Work | Commits |
| --- | --- | --- |
| 29 Oct | Vercel readiness: `CRON_SECRET` for the cron route, recovery fallback without an AI gateway, Lovable-only tables ported into `supabase/migrations` | `0156935`, `7a6dcb0` |
| 29 Oct | Security round 3: wallet sign-in bound to our own domains, first-admin bootstrap limited to one confirmed email, rate limits on public RPC and AI routes | `1b12d7e` |
| 29 Oct | Preview preparation: public npm registry, Node 22, Vercel build settings, Git deployments limited to this branch | `1107b7b`, `877c02e`, `7d9bb25` |
| 29 Oct | Vercel project created, Preview variables set (owner), first protected Preview deployed; roadmap audit and provider checks | `59d9fcc`, `1f1983f`, `ba611b8`, `8b02b9b` |
| 29 Oct | Hyperliquid read-only price client; revenue report tests; funding-transaction fee guard tests | `ab1fb08`, `d732c75`, `cd8773b` |
| 30 Oct | Supabase "JWT issued at future" retried once; Preview connected to the dev database | `599b443`, `c99e253` |
| 30 Oct | Security round 4: Tag Manager off admin, admin authenticator sign-in (MFA), legal page drafts, breached-password check on reset, sensitive details removed from docs | `137b269`, `3f54f81`, `70883b5` |
| 30 Oct | Credential rotation checklist and verification script; Jupiter order check, Hyperliquid design, Stables production checklist; revenue engine verification | `23d0220`, `94fedbe`, `7b22cee`, `b79d786` |
| 30 Oct | Private security architecture review and remediation plan delivered to the owner (not in the repository) | – |
| 30 Oct | **G1 (owner-approved):** Stables confirms final statuses before a webhook applies them; 8 s Solana RPC timeout and no public fallback in LIVE; Google Tag Manager removed; Google Analytics only after consent; CSP report-only trial with a report endpoint | `eecbb6c`, `b358128`, `d46b25a`, `4f0f72f`, `47b420a`, `875cc9e` |
| 30 Oct | Owner decision D-7 recorded; client IPs kept out of rate-limit logs | `eebf53b`, `13f96bc` |
| 30 Oct | **G3 and G4 (owner-approved, dev database):** test admin accounts removed, admin rights need the authenticator code in the database too, fee ledger cannot be emptied; the admin set up the authenticator | `09c4de8` |
| 30 Oct | Recovery assistant never sends customer text to an AI service in LIVE; guard test for one migration trail; checklist rows closed | `6f8ed02`, `431cf47` |
| 30 Oct | Owner: Stables KYB verified and production API access issued | – |
| 30 Oct | Production alerts for webhook failures: secret missing, deliveries not applied, transfers with no webhook; sent to `OPS_ALERT_WEBHOOK_URL` by the reconcile job, no repeats (`ops_alerts`, applied to dev) | `18974f8` |
| 30 Oct | Stuck-payment alerts: one per payment with no update from Stables for 2 h (critical at 24 h), same rule as the admin, silenced by an open operations case; at most 10 messages per run | `f2b01ff` |
| 30 Oct | Ended-after-funds alerts: one per payment that failed, was cancelled or expired after funds reached Stables (critical); silenced by any operations case; taken off the channel 14 days after it ended, with a note | `b747d52` |
| 31 Oct | Lovable / VS Code / GitHub / Vercel workflow audit and phased remediation plan | `2856d67` |
| 31 Oct | **Remediation step 1 (owner "go"):** R0 verified backup of every branch (sent to the owner, not in the repository) | – |
| 31 Oct | R4: no live Supabase fallback in `vite.config.ts`; `src/lib/public-env.ts` stops `vite dev` / `vite build` on missing or inconsistent public config; CI builds with placeholders; the browser-bundle scan refuses the live ref | `73847d7` |
| 31 Oct | R6: `.github/CODEOWNERS` (owner reviews everything except the Lovable UI paths), `.github/lovable-allowed-paths.txt`, `scripts/check-lovable-paths.mjs` and the CI job `lovable-path-guard` (inert until a ruleset requires them) | `d7e9de6` |
| 31 Oct | R5: lockfile bot runs only on `lovable/*` and `lovable-sync`, never main; actions pinned to commits | `b48d85f` |
| 31 Oct | **Owner decision: `https://lamportpay.com` stays the only domain** (no `app.` subdomain; DNS, URLs, canonical, sitemap and SEO unchanged; Lovable keeps serving it until the replacement is verified and the switch is approved). Windows backup and VS Code guide; R1 refined (Production only from `main`, deliberately); R7 pull-request rules for this branch plus a local pre-push guard; 31 migrations reviewed for production; SEO parity check of `main` vs this branch; production cutover checklist | see `git log` |
| 31 Oct | **Owner approved all open approvals and said no further test runs.** R1: Vercel Ignored Build Step set and checked (Production skipped, this branch builds). R2: branch `lovable/legacy` created at `e1b3e61` (today's `main`). R3: rulesets ready to import (`.github/rulesets/`). Vercel Production: `LAMPORTPAY_MODE`/`VITE_LAMPORTPAY_MODE` = live (locked in code), USDC only, fee 200 bps, swap fee 0, minimum 15 | – |

Every code commit passed CI (secret scan, typecheck, lint, unit tests (770 on 31 Oct), build,
browser-bundle scan, dependency audit) and was deployed to the Preview and checked there.

### Local-first work from 2 November 2026

**Decision (3 Nov):** development continues locally on the owner's Windows PC (VS Code + Claude).
Nothing is pushed to GitHub or deployed to Vercel unless explicitly requested; a Vercel Preview is
used only with approval when something cannot be tested locally. `lamportpay.com`, DNS, Lovable,
the production database and Vercel Production stay untouched; LIVE stays locked.

| Item | State (4 Nov) |
| --- | --- |
| Working copy | `E:\lamport-main` (exFAT), full history (unshallowed 4 Nov, `git fsck` clean), remote `lamportpay/lamport`, local push guard on |
| Node | 22.23.4 portable in `C:\LamportPay\tools\node-v22.23.4-win-x64` (system Node 24 untouched) |
| `.env` | TEST mode; dev Supabase `gdksfksypkcfiohozzsx`; Stables **sandbox** (`sti_test_`); Solana devnet RPC; fee 200 bps, swap fee 0, USDC only; limits empty (code defaults); no live key; mainnet RPC line commented out |
| Local checks | `NITRO_NO_EXTERNALS=1` needed for `npm run build` on E:; shell-script tests need Git's `sh` on PATH; `analytics-consent` fails on Windows only (path separator) |

Local branches (not pushed; each starts from `57308cd`):

| Branch | Commit | Content | Verified locally |
| --- | --- | --- | --- |
| `feat/payment-limits-stables` | `5faf705` | Minimum 15 (Stables' minimum) and provisional maximum 5,000 until Stables confirms a maximum in writing; one source `src/lib/payments/limit-defaults.ts` for the server and the homepage calculator; tests and docs | typecheck, lint 0 errors, secret scan, 790/792 unit tests (2 Windows-only); build compiled 2 Nov |
| `feat/live-ready-wording` | `6dc9965` | Recovery help says "no real money" only in TEST builds; `docs/launch/live-wording.md` (app wording checked, public-page sandbox statements listed for the launch switch) | typecheck, lint 0 errors, secret scan, 789/790 unit tests (1 Windows-only) |
| `feat/swap-demo-quote-only` | `0c12ba2` | Swap demonstration quote-only in LIVE: `/api/jupiter/order` and `/execute` answer 403 in LIVE before sign-in or any Jupiter call (`src/lib/jupiter/demo-swap.server.ts`); `SwapPanelIsland` shows the quote-only preview in LIVE builds; TEST, quotes and payment swaps unchanged | typecheck, lint 0 errors, secret scan, 795/796 unit tests (CI selection; 1 Windows-only), 6 new tests |
| `docs/local-state-2026-11-04` | this branch | This section | – |

**Consolidated 4 Nov (decision: `vercel-preview-migration` is the one development branch):** all
four commits merged into local `vercel-preview-migration` with their original SHAs (fast-forward to
`5faf705`, then merge commits `b3838bc`, `481c08e`, `bd8ed52`; no conflicts). Checks on the
result: secret scan clean; typecheck; lint 0 errors; 797/798 unit tests (CI selection; the failure
is the Windows-only `analytics-consent` path check); build OK (`NITRO_NO_EXTERNALS=1`); CI audit
gate passes (no high or critical; `npm audit` lists 1 low and 8 moderate, several through
`@solana/web3.js`). The old branches stay until deletion is approved. Pushed 4 Nov as review branch
`review/consolidate-2026-11-04` (`a2a8de4`), PR #2 into this branch; GitHub CI green (every step,
including all unit tests on Linux); merged with a merge commit: GitHub `vercel-preview-migration` =
`3746062`, `main` unchanged at `e1b3e61`. Vercel built `3746062` successfully (commit status
"Deployment has completed"); the dashboard did not render the environment and URL in the session
used, so Preview vs Production is by design (the build guard allows Production only from `main`)
but not yet confirmed on screen. The repository rulesets are **not active on GitHub** (none
listed); only the local guard enforces pull requests. Fixed outbound IP for Stables:
`docs/integrations/stables-fixed-ip.md` (decision 4 Nov: own small proxy server with one static
IPv4, to be approved before anything is created).

**Later on 4 Nov (local commits on `vercel-preview-migration`, after `3746062`):**

| Commit | Change | Evidence |
| --- | --- | --- |
| `7ebd822` | `analytics-consent` test compares repo paths with `/` on every OS (the Windows failure was the test's path separator, not the app) | Passes on Windows; still fails when a second gtag loader exists (probe file, removed) |
| `d85e1e1` | USDC only when `PAYMENT_ENABLED_CURRENCIES` is unset; swaps re-check the coin before any Stables/chain/Jupiter call (409 `currency_disabled`) | Unit tests; suites covering USDT turn it on explicitly |
| `a0aacb4` | Hyperliquid reads Testnet only (`api.hyperliquid-testnet.xyz/info`); new read-only order book and spot balances; guard refuses Mainnet and `/exchange` | Unit tests; answer shapes checked against the live testnet API (read-only calls) |
| `c90ea7a` | Optional `STABLES_PROXY_URL` (Stables calls only, fails closed); `undici` declared at the locked 7.30.1 | Unit tests with a mocked transport; no proxy exists yet |
| this commit | `docs/ENVIRONMENT-CHECKLIST.md`, `docs/security/github-branch-protection.md`, this section | – |

Jupiter Mainnet gap check: fee validation (swap fee 0; 50–255 bps bounds), single-use expiring
orders, never-twice relay, signer/transaction checks, 15 s timeouts and 502/503 split were already
in place and tested; added the USDC-only default and the swap-time coin check above. No real swap
or broadcast was made. Not verified: the Vercel Preview environment and URL for `3746062` (the
dashboard did not load in the browser session; commit status says the deployment completed).

Backup (4 Nov), `C:\LamportPay\backups\2026-11-04\` with `BACKUP-MANIFEST.txt` and `SHA256SUMS.txt`:
full-history bundle of the three branches (86.7 MB, complete history, restore-tested: same SHAs
and commit counts), a 27 KB bundle of the two feature commits, and a source ZIP per branch
(tracked files only). An encrypted `.env` backup (OpenSSL AES-256, password held by the owner) is
in `C:\LamportPay\backups\private\`. C:, D: and E: are partitions of **one** physical disk, so an
off-disk copy (USB drive or private cloud) is still open (owner). The old unencrypted `.env` copy
in `E:\LamportPay-backups\2026-11-02\` is deleted once the owner's decrypt test matches.

Local tooling notes (4 Nov): on this PC run Vitest and tsc directly with Node 22
(`node node_modules/vitest/vitest.mjs run …`, `node --max-old-space-size=3072
node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`); through `cmd`/`npx` they crashed
with low free memory.

Next (local, one branch each): Stables production integration (config, KYC, payouts, webhooks;
needs Stables' answer on the IP allowlist), Jupiter production, Solana mainnet RPC and wallet
flows; Hyperliquid only after its scope is approved. LIVE stays locked.

Decisions 3 Nov: minimum 15; maximum 5,000 provisional until Stables confirms in writing; the
homepage swap demo becomes quote-only in LIVE (no real swap from the demonstration); the 2%
LamportPay fee stays as is, no Stables developer fee until Stables confirms how it works and
settles in writing.

## 4. What is built (and where the code is)

| Area | What it does | Code |
| --- | --- | --- |
| Payment flow | Quote first, bank details checked by Stables, Stables-hosted KYC, transfer only for a verified sender, Pay Now (one user-signed transaction), status, receipts | `src/lib/payments/service.server.ts`, `src/routes/api/payments/`, `src/routes/pay.tsx`, `src/routes/_authenticated/` |
| Payment states | Forward-only state machine that mirrors Stables | `src/lib/payments/state.ts`, `ledger.server.ts` |
| Fees and revenue | One 2% fee taken out of the total; optional min/max; fee ledger; reconciliation; reports | `src/lib/payments/fee-math.ts`, `fees.server.ts`, `fee-ledger.server.ts`, `revenue-*.ts` |
| Stables | Client with Idempotency-Key on writes, Svix-signed webhooks, config | `src/lib/stables/`, `src/routes/api/public/stables-webhook.ts` |
| Operations alerts | Webhook failures, stuck payments and payments ended after funds pushed to the team's channel | `src/lib/ops/`, `docs/architecture/operations-and-recovery.md` §3a |
| Status sync | Webhooks, live sync while a payment is open, background reconciliation | `syncPaymentWithStables` in `service.server.ts`, `src/routes/api/cron/reconcile-payments.ts`, `scripts/reconcile-payments.mjs` |
| Solana | RPC with timeout and mode guard; balances; deposit and fee checks | `src/lib/solana-rpc.server.ts`, `src/lib/solana-usdc.server.ts`, `src/lib/payments/wallet-holdings.server.ts` |
| Jupiter | Quotes; swap orders (blocked in TEST) | `src/lib/jupiter/` |
| Hyperliquid | Read-only prices, not used by any page | `src/lib/hyperliquid/info.server.ts` |
| TEST / LIVE | Mode from `LAMPORTPAY_MODE`; LIVE lock; guards on every provider call | `src/lib/app-mode.ts`, `app-mode.server.ts`, `app-mode-lock.ts`, `docs/security/test-live-mode.md` |
| Sign-in | Wallet sign-in (Sign in with Solana); admin password plus authenticator code | `src/lib/wallet-sign-in.ts`, `src/lib/identity/`, `src/routes/admin.login.tsx`, `src/lib/admin-guard.ts` |
| Admin | Payments, operations cases, alerts, limits, emergency pause, fees and revenue, users and roles, exports, audit log | `src/components/admin/`, `src/routes/_authenticated/admin*`, `src/lib/admin*.functions.ts` |
| Security | Headers and CSP trial, CSP reports, shared rate limits, webhook checks | `src/lib/security-headers.ts`, `src/lib/csp-report.server.ts`, `src/lib/payments/rate-limit.server.ts` |
| Database | 31 migrations, RLS, append-only audit log and fee ledger | `supabase/migrations/` |
| Tests | 61 test files; the unit run (`npm run test:unit`) covers 56 of them, 665 tests | `tests/` |
| Scripts | Secret scan, bundle scan, dependency audit, credential check, Stables sandbox probes, reconcile | `scripts/` |
| CI | Runs on every push and pull request | `.github/workflows/ci.yml` |

## 5. Decisions in force

The product rules are in `CLAUDE.md` (non-custodial; one 2% fee taken out of the total; KYC on
Stables' hosted page; own account or named beneficiary; USDC only for now; minimum 15). Added on
30 Oct:

- **D-7:** a final webhook status is applied only after Stables confirms it; on a mismatch
  Stables' status applies (forward-only).
- **G1, G2, G3, G4 approved.** G1, G3 and G4 are done; G2 (key rotation) waits on the owner.
- **Revenue wallet:** keep the one configured on the Preview; the same address goes to Production.
- **Supabase:** the dev project stays in the CTO's account; the owner will buy the paid plan.
- **Duplicate payment creation:** accepted as low risk (an extra unfunded draft only).

Added on 3 Nov:

- **Limits follow the payout partner:** minimum **15** (Stables' 15 USD-equivalent minimum);
  maximum **5,000** per payment for now. Stables sets no fixed per-transfer maximum and agrees one
  with the integrator (Stables' answer, Questions sheet Q5), so 5,000 stands until that figure is
  agreed. Default in `src/lib/payments/limit-defaults.ts`; `.env` and Admin → Settings can still
  override it. Any environment that sets `PAYMENT_MAX_*=none` must clear that value for the
  maximum to apply.

## 6. Security status

Full list: `docs/security/pre-live-security-checklist.md`. Closed on 29–30 Oct: wallet sign-in
domain binding, admin bootstrap, admin MFA (code and database), Tag Manager, analytics consent,
webhook status confirmation, RPC timeout and LIVE fail-closed, fee ledger TRUNCATE, IPs in logs,
AI assistant in LIVE, migration trail, npm registry, cron secret name.

Still open:

| Item | Who |
| --- | --- |
| G2: rotate the keys that were shared in a `.env` file (`docs/security/credential-rotation-2026-10-30.md`) | Owner, then engineering verifies |
| **Correction (4 Nov):** the rotation note says the shared values are not in the git history. They are: a `.env` was committed in `5898da4` and `b23c674` (10 Oct) and removed in `4762a69` (12 Oct), so the history of the public repository holds the Alchemy key, the Supabase `sb_secret_jgY7…` key and the Stables sandbox `whsec_…` secret. All three are still in the local `.env`. Rotation is the fix (history is not rewritten); the Alchemy key matters most because the same key serves mainnet RPC | Owner rotates, engineering verifies |
| A Stables **production** key (`sti_live_…`) was pasted into a chat on 3 Nov: revoke it in Stables → API keys and create the production key only when it goes into Vercel Production | Owner |
| Enforce the CSP after a wallet session on `/pay` shows no violations | Engineering |
| Leaked-password protection (needs the paid Supabase plan) | Owner |
| Move Lovable's GitHub sync to the branch `lovable/legacy` (created 31 Oct; plan R2) | Owner, in Lovable |
| Import the two rulesets in `.github/rulesets/` (see its README; plan R3 and R7) | Owner, in GitHub |
| Independent security review before scaling | External |

## 7. Approvals needed to go LIVE

None of these may be done without the owner's explicit approval (`CLAUDE.md`).

1. **Production database:** create a separate Supabase project for real money (paid plan), built
   from `supabase/migrations/` with no test data.
2. **IP allowlist:** the owner checks in the Stables production dashboard whether production API
   keys need one. If yes: Vercel Pro with Static IPs, or a fixed-IP proxy.
3. **Production secrets:** the owner enters them in Vercel → Environment Variables → Production
   (Stables production key and webhook secret, Supabase production keys, Alchemy mainnet key).
   Engineering sets the non-secret values.
4. **Release and Production deployment:** a pull request merging `vercel-preview-migration` into
   `main`, only after Lovable syncs `lovable/legacy` (plan R2) and `main` is protected (R3):
   Lovable's preview runs whatever `main` holds against the live database. Merging deploys
   nothing; the Production deployment of `main` is a separate, deliberate step, verified behind
   Vercel login while lamportpay.com still serves Lovable.
5. **Domain:** `lamportpay.com` stays the domain. Its DNS moves from Lovable to Vercel only after
   that verification and the owner's explicit approval; pointing DNS back is the rollback
   (`docs/migration/production-cutover-checklist.md`, phase E).
6. **LIVE unlock:** a reviewed change to `src/lib/app-mode-lock.ts`, the owner approval
   variable and `LAMPORTPAY_MODE=live`.
7. **Controlled real-money test:** 15 USDC from the owner's wallet to the owner's own GBP bank
   account (`docs/integrations/stables-production-checklist.md`, section D).
8. **Soft launch:** invited users, low limits, USDC only.

## 8. What is left

**Lovable / VS Code workflow** (`docs/LOVABLE-VSCODE-REMEDIATION-PLAN.md`): R0, R1, R4, R5, R6 done;
R2, R3 and R7 ready (31 Oct, owner approval). Owner: switch Lovable to `lovable/legacy`, import the
two rulesets (the integration-branch ruleset now also requires pull requests: R7). Then R8 (`main`
catches up through one pull request); R9/R10 after the live move.

**Blocking the production database (31 Oct):** the Supabase organisation is on the free plan and
already has its two free projects (LamportPay dev and an unrelated project), so a production
project cannot be created until the organisation is on Pro. Pro also brings backups, no
auto-pause and leaked-password protection. Lovable's old data is not migrated (owner, 31 Oct).

**Owner steps before the live test (in order; full list in `docs/migration/production-cutover-checklist.md`):**
Supabase Pro → engineering creates the production project and, after approval, applies the
reviewed migrations; Lovable branch switch and rulesets → engineering merges into `main`; Production
secrets in Vercel (`STABLES_API_URL`, `STABLES_API_KEY`, `STABLES_WEBHOOK_SECRET`,
`SUPABASE_SERVICE_ROLE_KEY`, `SOLANA_RPC_URL`, `CRON_SECRET`, `LAMPORTPAY_REVENUE_WALLET`, optional
`JUPITER_API_KEY` and `OPS_ALERT_WEBHOOK_URL`; new keys, never ones from the shared `.env`); the
Stables IP-allowlist answer. Then a deliberate Production deployment (LIVE still locked), verified
behind Vercel login; then, with approval, the DNS switch of lamportpay.com; then the LIVE unlock at
the real-money test with the owner. Stables webhooks reach production once lamportpay.com points to
Vercel (custom domains are not behind Vercel login).

**Before the real-money test:** the approvals above (1 to 6); G2; production webhook in the
Stables dashboard; `OPS_ALERT_WEBHOOK_URL` in Production (owner picks the channel; webhook-failure,
stuck-payment and ended-after-funds alerts are built); background job secrets (alerts only run with the job). No further TEST-mode run (owner, 31 Oct:
the earlier sandbox runs and 770 unit tests stand).

**Before inviting users:** the real-money test; CSP enforced; lawyer review of `/terms` and
`/privacy`; early-access fee waiver cap or confirmation; Stables' production country list.

**After LIVE:** paying in SOL through Jupiter (needs the ExactOut fix), USDT, Hyperliquid route,
notifications, compliance operations, advanced admin, more payout providers, external audit.

## 9. Open questions with Stables

Answered in the owner's Drive sheet (22 of 55): refunds and returned payouts are manual through
Stables operations; no integrator fee (our fee stays in the user-signed transaction); no wallet
verification for the Travel Rule; minimum 15 USD; KYC under 10 minutes for individuals; local
rails same day, SWIFT up to 3 days; AUD available in production.

Still to ask: the production country list (#37–39), status webhooks in production (#54),
`actual_payout` in production (#55), the GBP multiple-of-20 rule (#51), per-corridor limits
(#53), and the legal questions (#23–25, #31–36, #47).

Added 3–4 Nov (dashboard and production checklist checked 3 Nov):

- **Maximum per transfer:** Stables sets no fixed maximum and agrees one with the integrator (Q5).
  We use 5,000 USD provisionally; written confirmation of 5,000, and what a higher maximum needs.
- **IP allowlist:** the production checklist requires allowlisted server IPs for `sti_live_` keys,
  and the dashboard says production accepts calls only from allowlisted addresses. Ask whether
  they accept a Vercel deployment, or which fixed-IP setup they require.
- **Developer fee:** the dashboard now shows a "Developer fee balance" with "Request payout" (in
  September Stables called integrator fees upcoming). Ask how it is set per transfer, in which
  currency and how often it settles. No change until answered in writing.

## 10. Working on this project

```sh
git checkout vercel-preview-migration
npm ci
npm run dev        # http://localhost:8080, with your own .env (sandbox keys only; the three
                   # VITE_SUPABASE_* values for the dev project are required, see .env.example)
npm test
npm run lint
```

- Full local CI: `node scripts/check-repo-secrets.mjs`, `npm run typecheck`, `npm run lint:ci`,
  `npm run test:unit`, `npm run build`, `node scripts/check-client-bundle.mjs`,
  `node scripts/check-audit.mjs`.
- Work on a feature branch from `vercel-preview-migration` and open a pull request into it
  (plan R7; `docs/LOCAL-SETUP-WINDOWS.md` section 6). After the owner imports the rulesets, direct
  pushes to `vercel-preview-migration` and `main` are refused; locally, `git config core.hooksPath
  .githooks` refuses them too. Never push to `main`, deploy to Production, switch on LIVE, change
  DNS or touch the Lovable live database without the owner's approval.
- Never print or commit secrets; never put a server key in a `VITE_` variable.
- Sandbox walkthrough: `docs/stables-sandbox-runbook.md`. Manual test matrix:
  `docs/testing/manual-sandbox-matrix.md`.

**Known gotchas**

- `npm run dev` / `npm run build` stop with "LamportPay public configuration is not valid" when a
  `VITE_SUPABASE_*` value is missing or inconsistent: there is no default since 31 Oct
  (`src/lib/public-env.ts`). Never add one back.
- Lovable may change only `.github/lovable-allowed-paths.txt`; keep it and `.github/CODEOWNERS`
  in step (a test checks every tracked file).
- The root `AGENTS.md` notes below its "Start here" section were written by Lovable while the
  app ran on Lovable Cloud; where they conflict with `CLAUDE.md`, `CLAUDE.md` wins.
- Supabase MCP `execute_sql` / `apply_migration` hang on DELETE and DROP; run those by hand.
- Vercel Hobby keeps runtime logs for 1 hour only.
- Stables sandbox: GBP transfers need multiples of 20 USDC; most non-GBP corridors stay
  `in_progress`; only `transfer.created` webhooks arrive, so status relies on live sync and
  reconciliation.
- `src/routeTree.gen.ts` is generated by the build; commit it when routes change.
- No Stables webhook has been stored in the dev database for any transfer created since 2 Oct
  (36 transfers; the last delivery of any kind arrived 8 Oct). Status has relied on live sync
  and reconciliation. Check the sandbox endpoint in the Stables dashboard (URL, enabled, signing
  secret equal to the Preview's `STABLES_WEBHOOK_SECRET`) and its delivery log; the
  `webhook_missing` alert reports this once the background job runs.
