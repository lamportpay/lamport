# Roadmap audit, 29 Oct 2026

Read-only comparison of the company tracker with the code on branch `vercel-preview-migration`
(`main` @ `bd4bcce` + `fix/vercel-readiness` + security round 3 + Preview prep). The Drive
tracker was **not** edited.

**Sources read:** Google Sheet `LamportPay_Project_Tracker` (tabs Overview, Business Model,
Progress, Roadmap, Phase 2 Detail, Phase 3 Detail, Carry-overs, Security, Current Work; last
modified 27 Oct), `docs/ROADMAP.md` (21 Oct), `docs/phase3-plan.md`, root `roadmap.md`
(Lovable task list), `src/content/roadmap-tracker.ts` (public `/roadmap`), `CLAUDE.md`,
`docs/security/pre-live-security-checklist.md`.

**Evidence used:** unit suite 538/538, integration suites 20 pass / 2 environment failures /
21 need a signed-in token (29 Oct, local); GitHub CI runs #254–#261 green; a fresh local build of
the 28 migrations with tamper tests; read-only queries on the dev Supabase project.

Labels: **Done and verified** · **Partially done** · **Not started** · **Blocked** ·
**Needs owner/provider confirmation**.

## Phase by phase (tracker tab "Roadmap", rows 5–16)

| Phase (row) | Tracker says | Audit | Evidence / gap |
|---|---|---|---|
| 0 Business and architecture (A5) | Done | Done and verified (design); sign-off is owner-recorded | Non-custodial design enforced in code: no server-side key or signing code; fee recipient can never be payer or deposit address (`src/lib/solana-usdc.server.ts:154`) |
| 1 Web3 MVP foundation (A6) | Done | Done and verified | Wallet adapters, Supabase auth, admin role checks, Solana verification; unit tests pass |
| 2 Stables sandbox flow (A7) | Engineering done; owner gate open | Partially done | Sandbox flow tested (dev: 21 COMPLETED sandbox payments; GB/US/IN/PH complete). Open: C01 revenue wallet (dev `revenue_wallet` is null), C02 click-through, C03 technical audit, C04 sign-off; E1–E3 with Stables |
| 3 Revenue engine (A8) | Current, C05–C10 implemented | Partially done | See next section |
| 4 Stables production go-live (A9) | Planned (next), blocked | Blocked | Stables production onboarding (N6); revenue wallet (N5); `/privacy` and `/terms` do not exist (N3); leaked-password protection off on dev (verified), live unknown (N4); LIVE locked in code (`LIVE_MODE_CODE_UNLOCKED = false`) |
| 5 Token expansion (A10) | Planned | Not started | Only Phase 1 Jupiter (read-only quotes in TEST). USDT paused by configuration only |
| 6 Compliance operations (A11) | Planned | Not started | Groundwork only: operations cases (`payment_cases`, 7 Oct) |
| 7 Advanced admin dashboard (A12) | Planned | Partially done (foundation) | Operational admin exists; mock tables still present (C28; dev `mock_kyc_submissions` has 4 rows) |
| 8 Automation and communication (A13) | Planned | Not started | No email provider in code; only Supabase Auth emails |
| 9 Multi-provider fiat (A14) | Planned | Not started | Stables only |
| 10 Security, QA, external audit (A15) | Planned | Not started | Internal self-reviews only (checklist rounds 1–3); no pen test or external audit |
| 11 Scaling and public launch (A16) | Planned | Not started | Groundwork: shared rate limits, 5-minute reconciliation scheduler |

## Phase 3 Revenue Engine (tabs "Phase 3 Detail" rows 5–21, "Carry-overs" rows 11–16)

| Item | Audit | Code / migration | Tests | Operational |
|---|---|---|---|---|
| Fee models: minimum, maximum, fixed (3.1, C05) | Done and verified; values = owner decision (X1) | `src/lib/payments/fee-math.ts` (`platformFee`, `splitTotal`; fixed = 0% with min = max); `20261001120000_fee_models.sql` records bounds + rule per payment | `fee-models.unit.test.ts`, `payments-service.unit.test.ts` ("applies a configured minimum fee… (C05)") | Bounds off on dev (null): plain 2% unchanged |
| Route / currency-specific fees (3.1) | Not started | Per-corridor rules exist for **limits and emergency controls** only (`limitsForCorridor`), not fees | – | Needs owner decision (Q1) |
| Immutable pricing snapshot (3.2) | Done and verified | `trg_payments_pricing_immutable` | Fresh-DB tamper test 29 Oct: changing fee or snapshot after quote refused | Active on dev |
| Ledger categories (3.3) | Done and verified | `payment_fee_ledger`: `lamportpay_fee` / `partner_fee` / `swap_fee`, `expected` / `received`; append-only | Tamper test: UPDATE and DELETE refused | Active on dev (216 rows, sandbox) |
| Append-only admin audit log (3.4, C06) | Done and verified | `20261001130000`, `20261001130100` | `audit-log-append-only.unit.test.ts`; tamper test: UPDATE, DELETE, TRUNCATE refused | Active on dev |
| Admin-editable payment limits (3.5, C07) | Done and verified (code, tests); not clicked through by an admin | `20261001140000`; Admin → Settings, per coin, reason + audit | `payment-limits-admin.unit.test.ts` | Dev uses `.env` defaults (`payment_limits` null) |
| CI on every push (3.9, C08) | Done and verified; branch protection needs owner confirmation | `.github/workflows/ci.yml` (push + pull request) | Runs #254–#261 green, incl. `main` @ `bd4bcce` and this branch @ `1107b7b` | Branch protection not checked (no tool access) |
| Reconciliation expected vs received + revenue-wallet balance (3.8, C10) | Partially done (built and unit-tested, not operational) | `src/lib/payments/revenue-reconciliation.ts`; on-chain balance via `readWalletHoldings` in `getRevenueReconciliation` | `revenue-reconciliation.unit.test.ts` | Blocked: no revenue wallet (C01), no funded fee payment, no real-money test |
| Revenue reporting (3.7) | Partially done | `getRevenueReport` (day/week/month), CSV export, daily report | No automated test for period grouping | No fee revenue exists yet |
| Revenue wallet (3.6) | Blocked by owner | Design decided (hardware wallet, fees only) | – | Address not provided |
| Phase gate (3.10) | Not started | – | – | Technical audit + sign-off |

Exit criteria (Phase 3 Detail rows 17–21): X1 open (owner values); X2 blocked (wallet +
real-money test); X3 blocked by X2; X4 met at database level (audit log, pricing snapshot and
fee ledger refuse changes); X5 not started.

## Discrepancies to resolve (not changed anywhere)

1. **Authority:** the Roadmap tab (A2) names `docs/MASTER_PLAN.md` as authoritative; that file
   has never been in the repository. `docs/ROADMAP.md` defers to "MASTER_PLAN and the Google
   Sheet".
2. **Stale tabs:** Phase 3 Detail (30 Sep) still marks 3.4/3.5/3.8/3.9 Partial/Planned while the
   Roadmap tab and Carry-overs say C05–C10 were implemented 1 Oct. Security (30 Sep): S33
   headers are now set (no CSP), S34 rate limits are now platform-wide, S37 CI now runs on
   GitHub. Carry-overs C08 "not run on GitHub" and C35 (holdings rate limit) are done.
3. **Minimum:** Progress C13 and Business Workflow 4.0 say minimum 100; current rule is 15.
4. **Payout recipient:** Business Model B14 says own account only; owner decision 11 Oct allows
   a named beneficiary.
5. **Fee wording (owner to resolve):** Business Model B17 says "2% of the amount converted…
   shown as 'LamportPay fee — 2%'". `CLAUDE.md`, `docs/ROADMAP.md` and the code use 2% of the
   **total sent**, taken out of it, and the `/pay` UI shows the amount only. The public MCP
   tool `quote_transfer` advertises an invented "Stables payout fee 1% (min $1)"; Stables'
   real fees come from the live quote and are confidential.
6. **Sign-up:** Security S12 says public self sign-up is disabled; wallet sign-in creates an
   account on first signature (`src/lib/identity/wallet-session.server.ts`).
7. **Hosting:** Roadmap E9 says "Hosting is Lovable/Cloudflare, not Vercel"; Carry-over C22 and
   this migration target Vercel. Owner to record the decision.
8. **Hyperliquid:** the homepage and white paper show a Hyperliquid route "in progress"; it has
   no phase in the internal roadmap (0–11) and no integration code.
9. **USDT:** "paused" is configuration only; with `PAYMENT_ENABLED_CURRENCIES` unset the code
   enables USDC **and** USDT.
10. **Two roadmaps:** the public `/roadmap` (13 phases, "Security review and go-live" current)
    and the internal 0–11 numbering differ by design (`docs/ROADMAP.md`), but describe
    different current phases.

## Fee wording: conflicts to resolve before any wording change

Source of truth in force: `CLAUDE.md` and `docs/ROADMAP.md` (owner decisions 30 Sep): one
LamportPay fee of **2% of the total the user sends, taken out of it** (150 sent → 3.00 fee →
147.00 to Stables), charged once, collected on-chain in the user's own transaction; Stables,
Jupiter and network costs are separate; the `/pay` UI shows the fee amount, not a percentage.
Code and tests agree (`fee-math.ts`, `fees.unit.test.ts`, `funding-transaction.unit.test.ts`).

| Where | Says | Conflict | Proposed correction (for review; nothing changed) |
|---|---|---|---|
| Tracker, Business Model B17 | "2% of the amount converted… Added on top… shown as 'LamportPay fee — 2%'" | Base (converted vs total) and display (percentage) | "2% of the total the user sends, taken out of it; shown as the fee amount" |
| Tracker, Stables Questions P8 | "LamportPay's 0.5% fee… as integrator_fee in the quote" | Rate and mechanism (Stables-collected 0.5% vs own on-chain 2%) | Mark P8 superseded by the 30 Sep decision |
| Public MCP tool `quote_transfer` (`src/lib/mcp/tools/quote-transfer.ts`) | "Indicative Stables payout fee 1% (min $1)" | Invents a partner fee; Stables' real fees come from the live quote and are confidential | Drop the partner-fee figure; say partner fees come from the live quote |
| Admin settings description (`BusinessSettingsAdmin.tsx`) | "added on top of the Stables quote" | Consistent arithmetic (fee is on top of the amount sent to Stables) but reads like "on top of what you send" | Optional: "taken out of what the user sends; Stables receives its quoted amount" |
| Tracker, Business Model B14 | Own account only | Superseded by the 11 Oct beneficiary decision | Update |

## Priorities (do not start later phases early)

1. Phase 2/3 gates the owner holds: revenue wallet (C01), click-through (C02), technical audit
   (C03), sign-off (C04); fee model values (X1).
2. Security items before any real money: GTM limited to the marketing site after consent, admin
   MFA, leaked-password protection, CSP (report-only first), legal pages, independent review.
3. Phase 4 only after the above and Stables production onboarding; then the controlled
   real-money test (C14), which also proves C10 reconciliation and revenue reporting.
4. Phases 5–11 stay planned.
