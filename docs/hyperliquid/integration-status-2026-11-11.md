# Hyperliquid: what exists, what is verified, what remains (updated 11 Nov 2026)

## Decision (owner, 11 Nov 2026)

Hyperliquid follows the app mode: **TEST MODE uses the testnet, LIVE MODE uses mainnet**
(real funds, the customer's own EVM wallet). Spot only. Non-custodial throughout: the
customer's wallet approves a trading key that lives in the browser tab only; LamportPay
relays already-signed actions and never holds a key or funds.

## In the app dashboard ("Trade" in the app menu, path `/hyperliquid-test`)

| Part | What it does | Hyperliquid source (official info / exchange API) |
| --- | --- | --- |
| Markets | All USDC spot markets with price, 24h change and 24h volume; BTC (UBTC), ETH (UETH), SOL (USOL), HYPE first; search | `spotMeta`, `allMids`, `spotMetaAndAssetCtxs` |
| Chart | Price line from candles, 15m / 1h / 4h / 1d | `candleSnapshot` |
| Wallet | Connect an EVM wallet (MetaMask, Rabby); "Enable trading" = one wallet signature approving an in-tab key (can trade, cannot withdraw) | `approveAgent` (Testnet / Mainnet by mode) |
| Order | Spot limit order (Gtc, Ioc, Alo); LIVE asks for a second confirmation | `order` |
| Open orders | List and cancel | `openOrders`, `cancel` |
| Balances | Spot balances with ≈ USDC value | `spotClearinghouseState` |
| Portfolio | Account value, PnL and volume per period, value chart | `portfolio` |
| Order history | 200 most recent orders with status (filled, canceled, rejected, ...) | `historicalOrders` |
| Trades | Fills of the last 7 / 30 / 90 / 365 days | `userFillsByTime` |
| Deposits & transfers | 30 days | `userNonFundingLedgerUpdates` |
| Checks | Every read plus the safety rules, recorded | all of the above |
| Trading log | Every approval, order, cancel and check run by the customer through LamportPay | `hyperliquid_test_events` |

## Safety rules (code and tests)

- `endpointAllowed`: TEST MODE may call only `api.hyperliquid-testnet.xyz` (`/info`, `/exchange`);
  LIVE MODE only `api.hyperliquid.xyz`. Each mode refuses the other network.
- L1 actions are signed with phantom-agent source `b` (testnet) or `a` (mainnet); a key approved
  on one network is never accepted on the other (approvals are tracked per network).
- The relay accepts only spot limit orders, cancels and `approveAgent`; transfers, withdrawals,
  perps, vaults and builder fees are refused by the schema. One relay per signed action.
- Trading pauses (503) whenever the server's mode configuration is blocked.

## Verified 11 Nov 2026

- Unit tests: signing (Python SDK vectors), mainnet and testnet relay, network separation,
  market data and history parsing (`tests/hyperliquid-*.unit.test.ts`).
- Live mainnet reads: `spotMetaAndAssetCtxs` (UBTC `@142`, 24h volume and previous-day price),
  `candleSnapshot`, `historicalOrders`, `userFillsByTime`, `portfolio` answer in the shapes parsed.

## Not included (decisions or provider checks)

| # | Item | Why |
| --- | --- | --- |
| H4 | Deposits into Hyperliquid inside LamportPay (USDC bridge from Arbitrum; BTC / ETH via Unit) | Unit's deposit-address API not reviewed yet. Today customers deposit on app.hyperliquid.xyz from their own wallet, then trade here. |
| H5 | Perpetuals (leveraged BTC / ETH) | Leveraged derivatives for customers: business and legal decision |
| H6b | Jurisdictions and terms for customer trading | Legal review (Hyperliquid's own restrictions apply) |
