# Production cutover checklist: Vercel hosts lamportpay.com (prepared 31 Oct 2026, updated 11 Nov 2026)

Status 11 Nov: Phase A open items are the merges below; Phases B-F not started.
The shortest safe path to the first real payment is the order of this file.

Owner decisions (31 Oct 2026): **`https://lamportpay.com` stays the one and only domain**: no
`app.` subdomain, no new URL structure, canonical URLs, redirects, sitemap or SEO setup changed
without need. The Lovable site keeps serving lamportpay.com until the Vercel replacement is
verified and the owner explicitly approves the switch. Lovable's old data is not migrated.

Each phase starts only after the one before it is done. **Bold** = needs the owner's explicit
approval at that moment; "Owner" = only the owner can do it (account access or secrets).

## Phase A: code and workflow (engineering, done or ready)

- [x] Integration branch `vercel-preview-migration`, CI green, protected Preview on Vercel.
- [x] No live-database fallback in the build (`src/lib/public-env.ts`).
- [x] Vercel never builds Production from a Git push (`scripts/vercel-ignore-build.sh`,
      `vercel.json`); Production builds only from `main`, deliberately.
- [x] Lovable path guard, CODEOWNERS, lockfile bot limited to Lovable branches.
- [x] SEO parity check (31 Oct): every route on `main` (the live site's code) exists on the
      integration branch; it only adds `/privacy`, `/terms` and `/api/csp-report`. Canonical
      URLs are `https://lamportpay.com/...` on both (`src/lib/seo.ts`); the sitemap gains
      `/privacy` and `/terms`; the Google Search Console verification tag is kept; Google Tag
      Manager is removed (owner-approved G1-3) and GA4 loads after consent.
- [x] Owner: import the two rulesets (`.github/rulesets/README.md`). Done; both active on GitHub,
      verified 4 Nov.
- [ ] Owner: in Lovable, switch the GitHub branch to `lovable/legacy`.
- [ ] **Approval:** merge PR #7 (revenue engine on devnet, fixes, LIVE wording, Hyperliquid
      testnet panel) and then PR #9 (Stables fixed-IP proxy) into `vercel-preview-migration`.
- [ ] **Approval:** commit Batch 1 and merge it into `vercel-preview-migration`: LIVE only on
      the Production deployment (`VERCEL_ENV=production`), double-payment protection including
      two open windows (`docs/security/double-payment-protection.md`), configurable priority fee,
      database clean-up migration. Apply migration `20261109100000` to dev first
      (`docs/migration/apply-batch1-migrations.md`).

## Phase B: production database (separate from development)

- [ ] Owner: Supabase organisation on **Pro** (the free plan's two projects are used).
- [ ] **Approval:** create project "LamportPay Production" (region to decide; London `eu-west-2`
      suits a UK company, with Vercel functions moved to `lhr1` to sit next to it).
- [x] P1 (demo tables) settled by migration `20261109120000_production_schema_hygiene.sql`
      (drops them; 9 Nov).
- [ ] **Approval:** apply all 35 migrations in file order with the Supabase CLI
      (`supabase db push`, commands in `docs/migration/apply-batch1-migrations.md`); run the
      checks listed there and in `docs/migration/production-database-review.md`. The same set
      replays cleanly on a local Postgres (`scripts/db-replay/run.sh`).
- [ ] Owner: dashboard settings (P5: Web3 provider, Site URL, redirect URLs, MFA,
      leaked-password protection).

## Phase C: Vercel Production configuration

- [x] Non-secret settings (31 Oct): `LAMPORTPAY_MODE` / `VITE_LAMPORTPAY_MODE` = live (locked in
      code), `PAYMENT_ENABLED_CURRENCIES` = usdc, `LAMPORTPAY_FEE_BPS` = 200,
      `LAMPORTPAY_SWAP_FEE_BPS` = 0, `PAYMENT_MIN_USDC` = 15. No `PAYMENT_MAX_*` (decision 4 Nov:
      no LamportPay maximum, Stables decides); leave it unset in Production.
- [ ] Engineering after B: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
      `VITE_SUPABASE_PROJECT_ID`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PROJECT_ID`
      (production project), `STABLES_API_URL` = `https://api.stables.money`,
      `LAMPORTPAY_LIVE_URL` = `https://lamportpay.com`.
- [ ] Owner: secrets, all new (never values from the earlier shared `.env`):
      `SUPABASE_SERVICE_ROLE_KEY`, `STABLES_API_KEY` (`sti_live_`), `STABLES_WEBHOOK_SECRET`,
      `SOLANA_RPC_URL` (Alchemy mainnet), `CRON_SECRET`, `LAMPORTPAY_REVENUE_WALLET` (the company
      wallet, unchanged), optional `JUPITER_API_KEY`, `OPS_ALERT_WEBHOOK_URL`.
- [x] Stables' production key needs an IP allowlist (production checklist and dashboard, 3 Nov).
      Decision 4 Nov: one free Oracle Cloud "Always Free" server with a reserved IPv4 as the
      proxy (`docs/integrations/stables-fixed-ip.md`; Vercel Static IPs rejected on cost).
- [x] Oracle account and server (7 Nov): reserved IP `130.210.11.66`, proxy only to the Stables
      API hosts, password protected; outbound IP and rules verified (PR #9).
- [ ] Owner: send `130.210.11.66` to Stables for the production allowlist; wait for written
      confirmation. Move the Oracle account to pay-as-you-go so the free server is not reclaimed
      when idle.
- [ ] Production holds production values only: no sandbox Stables key or URL, no
      `SOLANA_DEVNET_RPC_URL`, no `LAMPORTPAY_TEST_URL` test links. The TEST environment
      (local and the Preview, dev database, devnet, Stables sandbox) stays as it is for
      development and later tests. Optional priority-fee settings
      `SOLANA_COMPUTE_UNIT_LIMIT` / `SOLANA_PRIORITY_FEE_MICROLAMPORTS` (defaults are safe).
- [ ] Owner: `STABLES_PROXY_URL` (secret) in Vercel Production. LIVE refuses to start without it
      and without `STABLES_WEBHOOK_SECRET` (gates added 5 Nov). Full list of names and where each
      goes: `docs/ENVIRONMENT-CHECKLIST.md`.

## Phase D: release to `main` and a verified Production deployment (lamportpay.com unchanged)

- [ ] **Approval:** pull request `vercel-preview-migration` → `main`; merge after CI and a code
      owner's review (ruleset "Protect main"), with a **merge commit**, not squash, so both branches
      keep the same history and later releases don't conflict. Merging deploys nothing
      (`vercel.json`). Close the superseded PR #1.
- [ ] **Approval:** create the Production deployment of `main` (Vercel → Deployments → Create
      Deployment → branch `main`, or by API). It is reachable only at the Vercel Production URL
      behind Vercel login; lamportpay.com still serves Lovable. LIVE stays locked.
- [ ] Verify behind login, read-only: pages and routes load; `/api/integration-status` shows
      mode live, blocked only by the code lock; headers; sitemap and robots; titles, meta and
      canonical tags equal to the live site's for every route in the sitemap.
- [ ] Vault secrets for the 5-minute reconcile job (review P2).

## Phase E: domain switch (only with the owner's explicit approval)

- [ ] Decide first: the sitemap and `robots.txt` on both branches still name
      `https://lamportpay.lovable.app/sitemap.xml` while canonical URLs say `lamportpay.com`.
      Whether to point them at `https://lamportpay.com` at the switch is an SEO decision for
      the owner; nothing changes until then.
- [ ] **Approval:** add `lamportpay.com` (and `www` if it is in use today) to the
      Vercel project. Vercel then shows the exact DNS records.
- [ ] **Approval, Owner at the registrar:** change those DNS records at a quiet time. Keep the
      Lovable project and its domain settings untouched, so pointing DNS back is the rollback.
- [ ] After DNS: HTTPS certificate issued; every sitemap URL answers 200 with the same title and
      canonical as before; Search Console shows no new errors; Stables production webhook set
      to `https://lamportpay.com/api/public/stables-webhook` (Owner, in the Stables dashboard).

## Phase F: LIVE and the first real payment (owner present)

- [ ] **Approval:** LIVE unlock (reviewed change to `src/lib/app-mode-lock.ts`,
      `LAMPORTPAY_LIVE_APPROVED_BY` / `_AT`).
- [ ] **Approval:** the 15 USDC real-money test to the team's GBP bank account
      (`docs/integrations/stables-production-checklist.md` section D and
      `docs/testing/real-money-test-plan.md`, including section E: interrupted confirmation),
      then the soft launch.

## Later (after the switch is stable)

- Retire Lovable: R9/R10 in `docs/LOVABLE-VSCODE-REMEDIATION-PLAN.md` (remove Lovable hosts,
  build path, cron names, AI gateway, MCP server; disconnect Lovable's GitHub app). Only with the
  owner's approval, once lamportpay.com has run on Vercel without problems.
