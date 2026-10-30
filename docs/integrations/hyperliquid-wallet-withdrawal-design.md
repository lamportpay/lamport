# Hyperliquid: design for future wallet and withdrawal support (draft, 30 Oct 2026)

Status: **design only**. Nothing here is built or enabled. Today LamportPay has a read-only
Hyperliquid module (`src/lib/hyperliquid/info.server.ts`: spot metadata, mid prices, indicative
USDC value) that no page or route uses; the mode guard allows only `POST
https://api.hyperliquid.xyz/info` and refuses everything else (`hyperliquid_info` in
`src/lib/app-mode.server.ts`). Live check 30 Oct: 511 tokens, 348 USDC spot pairs, USDC = token 0,
`UBTC`, `UETH`, `PURR/USDC` present.

Facts below about Hyperliquid's API come from its public documentation and must be re-checked
against the current docs before any build.

## Goal

A user holding an asset on Hyperliquid (for example BTC or ETH brought in through Unit) sells it
for USDC on Hyperliquid's spot market and receives a bank payout through Stables, with every
step signed by the user's own wallet and no LamportPay account ever holding customer assets.

## Constraints (unchanged product rules)

- **Non-custodial.** No LamportPay-controlled Hyperliquid account, vault or agent wallet holds or
  moves customer assets. Hyperliquid "agent" (API) wallets can trade for an account; LamportPay
  must not hold one for users, because trading on their behalf is custody-like.
- **One LamportPay fee** (2% of the total, taken out of it). No Hyperliquid builder fee on top;
  Hyperliquid's own trading and withdrawal fees are provider costs shown separately.
- **KYC and payout stay with Stables**; the Travel Rule applies as today.
- **TEST first.** TEST mode uses Hyperliquid **testnet**; LIVE stays locked until the owner
  approves, as for Solana.

## Proposed flow

1. **Connect an EVM wallet** (Hyperliquid accounts are EVM addresses). Needs an EVM connector in
   the app (for example wagmi/viem with injected wallets and WalletConnect) next to the Solana
   one, and linking the EVM address to the LamportPay identity with a sign-in message (no
   transaction), stored like `user_wallets`.
2. **Quote.** Server reads the spot book and mid price (`info` endpoint, already built) and
   Stables' quote for the payout; the page shows the asset amount to sell, Hyperliquid's costs,
   the LamportPay fee and the expected payout.
3. **Sell on spot (user-signed).** The browser builds a spot order and the user signs it in their
   wallet (Hyperliquid L1 actions use EIP-712 signatures); the browser posts it to Hyperliquid's
   `exchange` endpoint directly. The server never holds a key and never signs.
4. **Withdraw USDC (user-signed).** Hyperliquid's user-signed withdrawal action sends USDC to an
   **Arbitrum** address (documented with a small fixed fee and a few minutes to settle). Two
   options:
   - **A. Direct to Stables:** withdraw straight to a Stables single-use deposit address on
     Arbitrum, if Stables accepts USDC on Arbitrum. Shortest path. The amount must cover
     Hyperliquid's withdrawal fee so the deposit arrives exactly.
   - **B. Via Solana:** withdraw to the user's own Arbitrum address, bridge to Solana USDC (for
     example Circle CCTP, user-signed), then the existing Solana flow. More steps, fees and time.
5. **LamportPay fee:** a separate user-signed USDC transfer to the company revenue address on the
   same network as the payout deposit, as on Solana today (never deducted by LamportPay from a
   balance it controls).
6. **Track** fills and withdrawals through the `info` endpoint (read-only) and the deposit
   through Stables' webhooks and the existing reconciliation.

## Changes this would need

- New mode-guard kinds: `hyperliquid_exchange` allowed only for testnet in TEST mode; LIVE behind
  the existing lock and owner approval.
- EVM wallet connection and identity linking; RLS and audit for linked EVM addresses.
- Payment records for multi-step routes (sell, withdraw, deposit) with the Stables transfer state
  still authoritative for the payout.
- Tests with recorded testnet responses; no mainnet action in tests or CI.

## Open decisions (owner, Stables)

1. EVM wallets in scope for LamportPay at all?
2. Does Stables accept USDC on Arbitrum for deposits (option A), and is the deposit amount exact?
3. Which assets (BTC, ETH via Unit; others)?
4. Fee mechanism on this route (separate transfer, as proposed) and how Hyperliquid's costs are
   shown.
5. Whether an indicative Hyperliquid price may be shown on the website (the module exists; no
   page uses it).
6. Regulatory review: facilitating a spot sale is a different activity from a payout.

## Phases

| Phase | Scope | Mode |
|---|---|---|
| H0 (done) | Read-only prices and metadata, mode-guarded | TEST and LIVE (read-only) |
| H1 | Indicative price on a page, if approved | Read-only |
| H2 | EVM wallet connect and identity linking | TEST |
| H3 | Testnet spot sell and withdrawal, user-signed | TEST (testnet) |
| H4 | Payout path A or B with Stables | TEST (sandbox) |
| H5 | LIVE, after review and owner approval | LIVE |
