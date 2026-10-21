# LamportPay

**From your Solana wallet to a bank account. Non-custodial.**

LamportPay is a cash-out route for people who hold crypto on Solana but pay rent, school fees and family bills in local currency. Instead of moving funds to an exchange or trusting a stranger on a P2P marketplace, the user pays out from their own wallet in one guided flow:

```
Your wallet ──(Jupiter swap, only if needed)──▶ USDC in your wallet
            ──(one transaction, signed by you)──▶ licensed payout partner
            ──▶ fiat conversion ──▶ your bank account (or a named beneficiary's)
```

LamportPay orchestrates the route. It never holds customer funds, keys or identity documents: the user signs every movement of money, and KYC and fiat payout are handled by our licensed payout partner, [Stables](https://stables.money).

> **Status: Devnet / Sandbox.** The full flow runs end to end on Solana devnet and the partner's sandbox. No real funds move. Live mode (mainnet + production partner) is built behind a server-side switch and stays off until an independent security audit and a controlled real-money test are complete.

- Live app: https://lamportpay.com (Convert → `/pay`)
- Submitted to: Colosseum Crypto World's Fair 2026 (Solana track)

---

## Why we built it

Getting value from a wallet into a bank account still means one of two compromises: hand custody to an exchange, or depend on a counterparty you don't know. We wanted a route where the user keeps control the whole way, sees the full cost before signing, and knows exactly which bank account will be paid.

## What works today (Devnet / Sandbox)

- **Wallet connect and sign-in** (Phantom, Solflare) with Sign in with Solana: one message signature, never a transaction or key
- **Quote first:** rate, LamportPay fee, partner fee and the exact bank amount, shown before anything is signed
- **Swap only when needed:** any supported Solana token → USDC through Jupiter Swap V2 (`order` / `execute`), signed by the user; funds stay in the user's wallet, and the step is skipped for users who already hold USDC
- **Partner KYC** through the payout partner's hosted verification; we store a status and a link, never ID documents
- **Bank details validated** by the partner; payouts go to the verified sender's own account by default, or to a named beneficiary with a stated purpose
- **One user-signed transaction** sends the exact settlement amount to the partner's single-use deposit address and the LamportPay fee to its revenue wallet; no treasury wallet, no custody
- **Deposit detection on-chain**, then payout status mirrored from partner webhooks (signature-verified, idempotent) plus scheduled reconciliation
- **Receipt** for every payment
- **Admin app:** payments, fee and revenue settings, limits, append-only audit log, operations cases, emergency controls
- **Devnet / Live separation** enforced server-side: devnet + sandbox keys vs. mainnet + production

## Payout corridors

| Corridor | Currency | Status |
| --- | --- | --- |
| United States | USD | Sandbox |
| United Kingdom | GBP | Sandbox |
| India | INR | Sandbox |
| Philippines | PHP | Sandbox |
| Nigeria | NGN | Planned |
| Pakistan | PKR | Planned |

## Business rules (configurable, not hard-coded)

- One LamportPay fee: **2% of the total sent**, charged once per payment and shown as its own line in every quote. Partner fees, Jupiter swap costs and Solana network fees are separate and shown separately.
- Fee, revenue wallet, limits, enabled currencies and payout countries are set by environment or in Admin → Settings, and every change is audit-logged.
- USDC on Solana is the settlement asset (USDT is supported in code and currently off).
- Devnet/Sandbox limits: 15 to 5,000 USDC per payment.

## Architecture

| Layer | Choice |
| --- | --- |
| App | TanStack Start + Vite, React, Tailwind |
| Solana | `@solana/web3.js`, Solana wallet adapter (Phantom, Solflare) |
| Swap | Jupiter Swap V2 API behind an authenticated server-side relay (each order relayed once) |
| Payout partner | Stables API (sandbox); webhooks verified with Svix signatures |
| Database | Supabase Postgres with row-level security and versioned migrations (`supabase/migrations`) |
| Hosting | Vercel |

Key design decisions:

- **Payment state follows the partner, not the browser.** The client never marks a payment as paid; webhooks and reconciliation do.
- **Server-side validation** of every amount, token and address before a transaction is built.
- **Fee split in the same transaction as the settlement**, so there is no LamportPay-held balance to secure.

## Repository layout

```
src/routes/            marketing site, /pay app, admin, API routes (src/routes/api)
src/lib/payments/      fee math, limits, payment state, reconciliation
supabase/migrations/   database schema, RLS and privilege hardening
tests/                 unit and integration tests (Vitest)
scripts/               webhook sender, reconciliation, secret scan
docs/                  roadmap, architecture, security and testing records
```

Key docs: [`docs/ROADMAP.md`](docs/ROADMAP.md) · [`docs/wallet-settlement-design.md`](docs/wallet-settlement-design.md) · [`docs/stables-sandbox-runbook.md`](docs/stables-sandbox-runbook.md) · [`docs/security/pre-live-security-checklist.md`](docs/security/pre-live-security-checklist.md) · [`docs/testing/real-money-test-plan.md`](docs/testing/real-money-test-plan.md)

## Run locally

```bash
npm install
cp .env.example .env      # devnet RPC, Supabase, partner sandbox and Jupiter keys
npm run dev               # http://localhost:8080
npm test                  # Vitest
npm run typecheck && npm run lint && npm run build
```

Never commit `.env`. `scripts/check-repo-secrets.mjs` scans for leaked secrets.

## Security principles

- Non-custodial: no customer funds, private keys or seed phrases are ever held, stored or logged
- No customer identity documents stored; KYC stays with the licensed partner
- Webhooks are signature-verified, replay-safe and idempotent
- Row-level security on all tables, least-privilege roles, append-only audit log, rate limits

## Road to mainnet

- [ ] Independent security audit
- [ ] Controlled real-money end-to-end test ([plan](docs/testing/real-money-test-plan.md))
- [ ] Production payout partner keys and Live mode enabled
- [ ] Real-funds Jupiter swaps
- [ ] Nigeria (NGN) and Pakistan (PKR) corridors

## How we built it

LamportPay started on **28 July 2026** as a prototype built with Lovable. That export is the first commit in this repository (`11365b0`, "Baseline: original LamportPay export (Lovable)"): the marketing site, a demo send flow with mock data, a small SOL → USDC swap demo using Jupiter's quote/order/execute routes, Solana transaction checks, a placeholder payout API and Supabase auth.

During the Colosseum hackathon period (commits from 26 September 2026) the team built the product on top of that prototype: the Stables payout integration (customers, KYC, bank validation, transfers, deposits), signed webhooks and reconciliation, the `/pay` app, the Jupiter swap layer inside the payment flow (secured relay, swap only when required), the non-custodial 2% fee split, the admin app, Devnet/Live modes, wallet identity, security hardening and tests. `/pay` replaced the demo `/send` flow as the product path.

We use AI-assisted development tools alongside our own engineering. Every change is reviewed and tested by the team before it ships: the suite currently runs 524 unit tests, and CI runs lint, type checks, the test suite, a production build and a secret scan on every commit.

## Team

Zoaib Ali (Founder & CEO) · Ghazanfar Abbas (CTO & Lead Developer) · Izzat Iftikhar (Marketing & Community) · Zaheer Muneer (Advisor) · Safi Ullah Adam (Advisor, Technology & AI) · Greg Mirt (Advisor)

## License

Copyright 2026 Lamport Pay Ltd. Licensed under the [Apache License 2.0](LICENSE).
