# Multi-asset checkout: assessment (11 Nov 2026; NOT built)

Today: USDC on Solana straight to the Stables deposit address; SOL (or other Solana tokens
with liquidity) swapped to USDC by Jupiter in the customer's own wallet first. Stables'
accepted deposit networks: USDC on Solana is the one in use; others are not confirmed.

## Options for BTC and ETH

| Route | How | Non-custodial | Status |
| --- | --- | --- | --- |
| A. Solana-wrapped BTC/ETH (for example cbBTC, Wormhole WBTC/WETH) | Jupiter swap to USDC in the customer's wallet, then today's flow | Yes | Fits the existing design; needs a token allow-list and the exact mints confirmed, plus price-impact limits per token. Not built |
| B. Native BTC/ETH via Hyperliquid | Customer deposits BTC through Unit (UBTC) or ETH (UETH), sells for USDC on Hyperliquid spot, withdraws USDC to Arbitrum, then USDC must reach Solana for Stables | Yes, but 4-5 customer-signed steps across 3-4 networks, with bridge time and fees | Not viable as a checkout until Stables confirms it accepts USDC on Arbitrum (removes the last bridge). Hyperliquid has no bank payout |
| C. Stables accepts BTC/ETH (or other networks) directly | Stables quotes and collects the asset | Yes | **Provider question**: which assets and networks Stables accepts in production |

Recommendation: ask Stables first (C). If they accept USDC on Arbitrum or BTC/ETH directly,
the backend chooses the route per asset and network; otherwise start with A (smallest change,
same flow). Hyperliquid stays a trading feature, not a payout route; nothing in the product
should say Hyperliquid pays out to banks.

## Backend shape (when a route is approved)

A route chooser per (asset, network): `stables-direct` | `jupiter-then-stables` |
`hyperliquid-then-stables`, each behind its own adapter, with the same payment states (mirror
Stables) and the same 2% fee taken once.
