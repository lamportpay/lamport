# Hyperliquid: what exists, what is verified, what remains (11 Nov 2026)

## Exists today (TEST MODE only, testnet)

From PR #7 (7 Nov), `docs/hyperliquid/testnet-trading.md`:

- App page `/hyperliquid-test` ("HL Test" in the app menu), TEST MODE only.
- The customer's own EVM wallet; a browser-only trading key (Hyperliquid "API wallet")
  approved once by the customer's wallet (`approveAgent`). The key can trade but not
  withdraw; it lives in the tab's memory only.
- Reads: spot markets (`spotMeta`), mids (`allMids`), order book (`l2Book`), balances
  (`spotClearinghouseState`), open orders, fills (`userFills`), deposits and transfers
  (`userNonFundingLedgerUpdates`).
- Actions relayed by the server after re-checking the signer: spot limit order (Gtc, Ioc,
  Alo), cancel, `approveAgent`. Perps, transfers, withdrawals, vaults and builder fees are
  refused by the schema. One relay per signed action (`hyperliquid_test_events`).
- Signing matches Hyperliquid's Python SDK byte for byte (unit tests).

## Verified 11 Nov against the official API (live reads, nothing signed)

| Check | Testnet | Mainnet |
| --- | --- | --- |
| Spot BTC market | `BTC/USDC` (pair `@50`, a non-canonical test token) | `UBTC/USDC` (pair `@142`, Unit-bridged BTC) |
| Spot ETH market | `UETH/USDC` (`@1137`) | `UETH/USDC` (`@151`) |
| Spot SOL / HYPE | `USOL/USDC` (`@1165`), `HYPE/USDC` (`@1035`) | `USOL/USDC` (`@156`), `HYPE/USDC` (`@107`) |
| Perps BTC, ETH, SOL, HYPE | listed (159 perps) | listed (179 perps) |

The existing order form takes any USDC spot market, so BTC and ETH spot test orders are
possible today on testnet. Documented info types used next (official docs, info endpoint):
`spotMetaAndAssetCtxs` (24h price and volume), `candleSnapshot` (up to 5,000 candles),
`historicalOrders` (2,000 most recent), `userFillsByTime` (paged, 10,000 most recent),
`portfolio` (account value and PnL history), `orderStatus`.

## Remaining to make it a full exchange view in the dashboard

| # | Work | Type |
| --- | --- | --- |
| H1 | Move the view from its own page into the app dashboard (a "Trade" section in the existing app layout) | Engineering |
| H2 | Markets list with 24h change and volume, BTC/ETH/SOL first; price chart (candles) | Engineering |
| H3 | Order history (`historicalOrders`, `orderStatus`), full trade history (`userFillsByTime`, paged), portfolio (`portfolio`) | Engineering |
| H4 | Deposits into Hyperliquid from the customer's own wallet (USDC via Hyperliquid's Arbitrum bridge; BTC/ETH via Unit) without leaving LamportPay | Engineering + provider check (Unit's deposit-address API not yet reviewed) |
| H5 | Perpetuals (leveraged BTC/ETH) | **Business and legal decision**: leveraged derivatives for customers |
| H6 | Mainnet for customers | **Business and legal decision** (jurisdictions, terms, Hyperliquid's own restrictions); today TEST MODE refuses mainnet by design |
| H7 | First real testnet order and cancel from the team wallet | Owner (needs the wallet in the browser and testnet funds) |

Non-custodial throughout: the customer's wallet approves; LamportPay relays signed actions
and never holds keys or funds.
