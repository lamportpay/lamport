# Stables production onboarding checklist (prepared 30 Oct 2026)

For the move from the Stables **sandbox** to **production**. Nothing here has been started: no
production account, key or webhook exists, and LIVE mode stays locked in code
(`src/lib/app-mode-lock.ts`). IDs in brackets refer to the company tracker (tabs "Stables
Questions", "Carry-overs", "Roadmap").

## A. With Stables (business and legal)

- [ ] Production agreement signed; exclusivity question settled (P12).
- [ ] KYB of Lamport Pay Ltd completed in Stables production.
- [ ] Terms of use and privacy policy reviewed by a lawyer (P11). Drafts are at `/terms` and
      `/privacy` with a "draft" notice; set `LEGAL_REVIEWED` in `src/lib/legal.ts` after review.
- [ ] Production corridors and customer eligibility by country confirmed (P1); production
      `PAYOUT_COUNTRIES` list agreed (C36).
- [ ] Per-customer and per-payment limits in production.
- [ ] Partner fee schedule as returned in production quotes; the old "integrator fee" idea (P8) is
      superseded by LamportPay's own on-chain fee.
- [ ] Support and escalation contacts, incident process, response times.

## B. Technical answers from Stables

- [ ] Production base URL and API key (`sti_live_…`), created by the owner in the production
      dashboard and entered only as a Vercel **Production** variable. Never in chat or documents.
- [ ] Webhook endpoint on the production domain, its signing secret, and which status events
      production sends (sandbox sends only `transfer.created`) (P2, P18).
- [ ] `actual_payout` in production transfer responses (P19).
- [ ] Idempotency and retry rules, rate limits, any IP allow-list.
- [ ] Travel Rule data required per corridor and amount.
- [ ] Supported deposit networks and tokens (USDC on Solana now; USDT later; Arbitrum if the
      Hyperliquid route is pursued).
- [ ] Refund flow for a failed payout; differences between sandbox and production (#48).

## C. LamportPay readiness (internal)

- [ ] **Production database:** a new Supabase project in a company-owned organisation on a paid
      plan (backups, leaked-password protection), built from the migrations, no copied test
      data, admin MFA migration applied, admins enrolled with an authenticator.
- [ ] **Hosting:** Vercel Production environment with Production-scoped variables only, the custom
      domain, the webhook route reachable (public routes not behind Vercel login), cron secret
      and the database scheduler's Vault secrets set.
- [ ] **Revenue wallet** (C01): company hardware-wallet address in `LAMPORTPAY_REVENUE_WALLET`.
- [ ] **Configuration:** USDC only; production limits; production payout countries; fee bounds
      as decided (X1).
- [ ] **Security:** credential rotation completed (`docs/security/credential-rotation-2026-10-30.md`);
      `main` protected; GTM/consent decision applied; independent security review (Phase 10).
- [ ] **Operations:** emergency payment controls tested in production config; reconciliation
      scheduler running; alerting on webhook failures, stuck payments and payments ended after funds (built 30 Oct,
      `src/lib/ops/`; needs `OPS_ALERT_WEBHOOK_URL` in Production and the scheduler's Vault
      secrets).
- [ ] **LIVE unlock:** reviewed PR changing the code lock, owner approval variable, and
      `LAMPORTPAY_MODE=live`, deployed only with explicit owner approval.

## D. Controlled real-money test (C14, #49)

Owner-approved, after A–C:

1. Pause new payments for everyone else (payment controls) or restrict the corridor.
2. One payment of the minimum amount (15 USDC) from the owner's own wallet to the owner's own
   bank account in one corridor (GBP suggested; it completed in the sandbox).
3. Record: Stables transfer id, deposit and fee transaction signatures, the fee received in the
   revenue wallet, the bank credit, the reconciliation and revenue reports.
4. Pass when the payout arrives, the fee ledger shows expected = received, the revenue-wallet
   balance increased by the fee, and the status timeline is complete. Otherwise pause and open an
   operations case.

## E. Go / no-go

Owner sign-off on A–D (tracker C04, Phase 4 gate) before any public LIVE launch.
