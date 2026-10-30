# LamportPay: project status and handoff

**As of 30 October 2026, branch `vercel-preview-migration`.** Read this first, then `CLAUDE.md`
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
| Hosting | Vercel, company team, project `lamport`, Hobby plan. Preview only, behind Vercel login, built from this branch. Production has no variables and no deployment |
| Database | Supabase dev project `gdksfksypkcfiohozzsx` (the one in `supabase/config.toml`). Every migration in `supabase/migrations/` (31 files) is reflected there, some applied under other names, so compare with `list_migrations` before building a new database. The 5-minute reconcile job is scheduled but does nothing until its Vault secrets are set. The Lovable live database must never be touched (`CLAUDE.md`) |
| Payout partner | Stables. Sandbox key on the Preview. Production access issued; the production key is not in Vercel yet |
| Solana RPC | Alchemy. Devnet key on the Preview; mainnet key only for Production later |
| Swap quotes | Jupiter, API key on the Preview (read-only quotes in TEST) |
| Company tracker, Stables questions and answers | Owner's Google Drive (private) |
| Owner-facing status docs | "LamportPay: road to LIVE" and "LamportPay work report" (private Claude docs, shared by the owner) |

Secrets are never in the repository: only the empty `.env.example`. Preview variables live in
Vercel (names in `docs/migration/vercel-preview.md`); local work needs your own `.env` with
**sandbox** keys only.

## 3. Work done on 29 and 30 October 2026

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
| 30 Oct | Stuck-payment alerts: one per payment with no update from Stables for 2 h (critical at 24 h), same rule as the admin, silenced by an open operations case; at most 10 messages per run | this session |

Every code commit passed CI (secret scan, typecheck, lint, 659 unit tests, build, browser-bundle
scan, dependency audit) and was deployed to the Preview and checked there.

## 4. What is built (and where the code is)

| Area | What it does | Code |
| --- | --- | --- |
| Payment flow | Quote first, bank details checked by Stables, Stables-hosted KYC, transfer only for a verified sender, Pay Now (one user-signed transaction), status, receipts | `src/lib/payments/service.server.ts`, `src/routes/api/payments/`, `src/routes/pay.tsx`, `src/routes/_authenticated/` |
| Payment states | Forward-only state machine that mirrors Stables | `src/lib/payments/state.ts`, `ledger.server.ts` |
| Fees and revenue | One 2% fee taken out of the total; optional min/max; fee ledger; reconciliation; reports | `src/lib/payments/fee-math.ts`, `fees.server.ts`, `fee-ledger.server.ts`, `revenue-*.ts` |
| Stables | Client with Idempotency-Key on writes, Svix-signed webhooks, config | `src/lib/stables/`, `src/routes/api/public/stables-webhook.ts` |
| Operations alerts | Webhook failures and stuck payments pushed to the team's channel | `src/lib/ops/`, `docs/architecture/operations-and-recovery.md` §3a |
| Status sync | Webhooks, live sync while a payment is open, background reconciliation | `syncPaymentWithStables` in `service.server.ts`, `src/routes/api/cron/reconcile-payments.ts`, `scripts/reconcile-payments.mjs` |
| Solana | RPC with timeout and mode guard; balances; deposit and fee checks | `src/lib/solana-rpc.server.ts`, `src/lib/solana-usdc.server.ts`, `src/lib/payments/wallet-holdings.server.ts` |
| Jupiter | Quotes; swap orders (blocked in TEST) | `src/lib/jupiter/` |
| Hyperliquid | Read-only prices, not used by any page | `src/lib/hyperliquid/info.server.ts` |
| TEST / LIVE | Mode from `LAMPORTPAY_MODE`; LIVE lock; guards on every provider call | `src/lib/app-mode.ts`, `app-mode.server.ts`, `app-mode-lock.ts`, `docs/security/test-live-mode.md` |
| Sign-in | Wallet sign-in (Sign in with Solana); admin password plus authenticator code | `src/lib/wallet-sign-in.ts`, `src/lib/identity/`, `src/routes/admin.login.tsx`, `src/lib/admin-guard.ts` |
| Admin | Payments, operations cases, alerts, limits, emergency pause, fees and revenue, users and roles, exports, audit log | `src/components/admin/`, `src/routes/_authenticated/admin*`, `src/lib/admin*.functions.ts` |
| Security | Headers and CSP trial, CSP reports, shared rate limits, webhook checks | `src/lib/security-headers.ts`, `src/lib/csp-report.server.ts`, `src/lib/payments/rate-limit.server.ts` |
| Database | 31 migrations, RLS, append-only audit log and fee ledger | `supabase/migrations/` |
| Tests | 61 test files; the unit run (`npm run test:unit`) covers 56 of them, 659 tests | `tests/` |
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

## 6. Security status

Full list: `docs/security/pre-live-security-checklist.md`. Closed on 29–30 Oct: wallet sign-in
domain binding, admin bootstrap, admin MFA (code and database), Tag Manager, analytics consent,
webhook status confirmation, RPC timeout and LIVE fail-closed, fee ledger TRUNCATE, IPs in logs,
AI assistant in LIVE, migration trail, npm registry, cron secret name.

Still open:

| Item | Who |
| --- | --- |
| G2: rotate the keys that were shared in a `.env` file (`docs/security/credential-rotation-2026-10-30.md`) | Owner, then engineering verifies |
| Enforce the CSP after a wallet session on `/pay` shows no violations | Engineering |
| Leaked-password protection (needs the paid Supabase plan) | Owner |
| Protect `main` on GitHub (ruleset in `.github/rulesets/main.json`) | Owner |
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
4. **Production deployment:** a pull request merging `vercel-preview-migration` into `main`.
5. **Domain:** move the domain and DNS from Lovable to Vercel.
6. **LIVE unlock:** a reviewed change to `src/lib/app-mode-lock.ts`, the owner approval
   variable and `LAMPORTPAY_MODE=live`.
7. **Controlled real-money test:** 15 USDC from the owner's wallet to the owner's own GBP bank
   account (`docs/integrations/stables-production-checklist.md`, section D).
8. **Soft launch:** invited users, low limits, USDC only.

## 8. What is left

**Before the real-money test:** the approvals above (1 to 6); G2; production webhook in the
Stables dashboard; `OPS_ALERT_WEBHOOK_URL` in Production (owner picks the channel; webhook-failure and
stuck-payment alerts are built); background job secrets (alerts only run with the job); the TEST-mode end-to-end run on the Preview (owner clicks, engineering verifies).

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
(#53), whether production keys need an IP allowlist, and the legal questions (#23–25, #31–36, #47).

## 10. Working on this project

```sh
git checkout vercel-preview-migration
npm ci
npm run dev        # http://localhost:8080, with your own .env (sandbox keys only)
npm test
npm run lint
```

- Full local CI: `node scripts/check-repo-secrets.mjs`, `npm run typecheck`, `npm run lint:ci`,
  `npm run test:unit`, `npm run build`, `node scripts/check-client-bundle.mjs`,
  `node scripts/check-audit.mjs`.
- Work on `vercel-preview-migration` or a branch from it. Never push to `main`, deploy to
  Production, switch on LIVE, or touch the Lovable live database without the owner's approval.
- Never print or commit secrets; never put a server key in a `VITE_` variable.
- Sandbox walkthrough: `docs/stables-sandbox-runbook.md`. Manual test matrix:
  `docs/testing/manual-sandbox-matrix.md`.

**Known gotchas**

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
