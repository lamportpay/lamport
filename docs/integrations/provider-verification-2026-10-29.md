# Provider verification, 29 Oct 2026 (Jupiter, Hyperliquid, Stables)

Branch `vercel-preview-migration`. No transaction was signed or broadcast, no order was placed
and no provider setting was changed. This session's network could not reach `api.jup.ag`,
`api.hyperliquid.xyz`, Stables or Solana RPC, and could not open their documentation sites, so
provider behaviour below comes from official documentation (via web search) and from mocked
tests, not from live calls.

## Jupiter

| Check | Result |
|---|---|
| API generation | Swap API **V2**: `GET https://api.jup.ag/swap/v2/order`, `POST https://api.jup.ag/swap/v2/execute` (`src/lib/jupiter/client.server.ts`). Matches current docs; Ultra V1 is the deprecated one |
| Auth | `x-api-key` header from `JUPITER_API_KEY` (server only). Jupiter allows keyless calls at 0.5 req/s; the app requires a key and reports "not configured" without one |
| Quote vs transaction | No `taker` → quote only; `taker` → transaction to sign. Matches docs. TEST MODE allows only the no-taker quote (`app-mode.server.ts`) |
| Execute | Body `{ signedTransaction, requestId }`, statuses `Success` / `Failed`; relayed once per issued order (`jupiter-swap-orders` tests) |
| Integrator fee | `referralAccount` + `referralFee` 50–255 bps, matching docs. Business settings refuse any non-zero swap fee (one 2% fee only), so no referral is sent |
| Timeouts | 15 s on order and execute |
| **Finding: ExactOut** | The current `/swap/v2/order` reference lists **ExactIn only**. Two paths send `swapMode=ExactOut`: the `/pay` SOL-cost estimate (`live-estimate.server.ts:168`, read-only; degrades to "unavailable") and LIVE swap sizing (`swaps.server.ts:321`, `sizeSwap`). If Jupiter refuses ExactOut, every LIVE SOL→USDC top-up fails with a misleading "wallet doesn't hold enough" message |

Verify before changing code (read-only, no key needed, run anywhere with internet):

```bash
curl -s "https://api.jup.ag/swap/v2/order?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000&swapMode=ExactOut"
```

If it is refused, the proposed fix is to size swaps from an ExactIn quote: probe the rate,
compute the SOL input for the shortfall plus the existing size buffer, then confirm with an
ExactIn quote whose minimum output covers the shortfall (the existing "minimum output ≥
shortfall" check still guards the real order). LIVE only; not implemented until verified.

Variables (names only): `JUPITER_API_KEY` (needed for quotes, Preview included);
`JUPITER_REFERRAL_ACCOUNT` stays unset while the swap fee is 0; `SOLANA_RPC_URL` (LIVE only,
mainnet) and `SOLANA_DEVNET_RPC_URL` (TEST, optional).

## Hyperliquid

**Scope found in the product:** homepage, white paper, docs page and FAQ describe "major
digital assets (BTC, ETH, USDT) → Hyperliquid liquidity → USDC" as **in progress**, with
"trading, deposits and withdrawals… disabled". The internal roadmap (0–11) has no Hyperliquid
phase.

**Facts from the official docs:** `POST https://api.hyperliquid.xyz/info` is public and read
only (`spotMeta`, `spotMetaAndAssetCtxs`, `allMids`); spot pairs are quoted in USDC and named
`PURR/USDC` or `@{index}`. Orders, transfers and withdrawals are signed actions on the separate
exchange endpoint. BTC/ETH reach Hyperliquid through Unit and are sold for USDC on the spot book;
USDC is withdrawn to **Arbitrum** with a signature. Hyperliquid accounts are EVM addresses.

**Built (commit `ab1fb08`):** `src/lib/hyperliquid/info.server.ts`, read-only spot metadata and
mid prices with an exact indicative USDC value; the mode guard allows only the info URL and
refuses `/exchange`. Not reachable from any route or page. Tests use mocked responses.

**Owner decisions before anything more:** whether LamportPay supports EVM wallets (Hyperliquid
users sign with one); how USDC leaves Hyperliquid (Arbitrum) and reaches a payout (Stables
deposit network support, or a bridge); that every step stays user-signed (non-custodial: no
LamportPay account on Hyperliquid holds customer assets); which assets; whether an indicative
price may be shown on the website.

## Stables

The Stables dashboard was **not** inspected: this session has no browser or connected computer.
Status from the company tracker (tabs "Stables Questions" and "Stables Answers", last modified
27 Oct) and the repo:

- Sandbox only (`sti_test_` keys, `https://api.sandbox.stables.money`); production refused by
  code in TEST MODE and LIVE locked.
- Production checklist: answered by Stables (P4, link in the tracker); not yet worked through.
- Open with Stables: customer eligibility by country (P1), status-change webhooks in sandbox and
  production (P2, P18), `actual_payout` in production (P19), pre-production risks (#48).
- Legal open: terms and privacy (P11), exclusivity (P12).
- Business decisions open: controlled real-money test (#49), AUD in LIVE (#52).

Where credentials go (never in chat, code or `.env` files in the repo): the Stables sandbox API
key and webhook signing secret are created in the Stables sandbox dashboard and entered only as
Vercel environment variables `STABLES_API_KEY` and `STABLES_WEBHOOK_SECRET`, scoped to Preview
and the `vercel-preview-migration` branch. The Preview webhook endpoint
(`https://<preview-url>/api/public/stables-webhook`) needs Vercel's protection bypass to receive
deliveries; without it the app's live status sync still updates payments.
