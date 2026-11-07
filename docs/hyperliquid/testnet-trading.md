# Hyperliquid testnet test panel (7 Nov 2026)

Owner request (7 Nov 2026): test Hyperliquid end to end with our own test
tokens, place orders from the app, and track everything. Owner choices: reads
**and** testnet orders; the customer's own EVM wallet; visible in the app.

## What it is

- App page `/hyperliquid-test` ("HL Test" in the app menu, **TEST MODE only**).
- Connect an EVM wallet (MetaMask, Rabby, Phantom EVM).
- **Run all checks**: every Hyperliquid read (spotMeta, allMids, l2Book,
  indicative value; with a wallet also balances, open orders, fills, ledger)
  plus the safety rules (mainnet blocked, relay TEST MODE only). Pass/fail,
  timing and detail per check.
- Balances (with indicative USDC value at the testnet mid), open orders with
  Cancel, trades (fills) with explorer links, deposits and transfers (30 days).
- **Place a test order**: spot limit order (Gtc / Ioc / Alo), any USDC market.
- **Test history**: every check run, approval, order and cancel, with result.

## How signing works (non-custodial)

1. "Enable test trading" makes a fresh trading key (Hyperliquid "API wallet"
   / agent) **in the browser tab, in memory only**. The customer's wallet signs
   one `approveAgent` (EIP-712, `hyperliquidChain: "Testnet"`). An agent can
   trade but cannot withdraw or transfer (Hyperliquid docs: API wallets).
2. Orders and cancels are signed in the tab with that key (Hyperliquid L1
   signing: msgpack action hash, phantom agent `source "b"` = testnet).
3. The server only relays. It never sees or stores a key. Before relaying it
   rebuilds the action, recomputes the hash and recovers the signer:
   - approveAgent must be signed by the account itself;
   - an order or cancel must come from an agent this same user approved for
     this same account through the app.
4. The key is gone on reload (one new approval signature needed).

## Server rules

- `POST /api/hyperliquid/exchange`: TEST MODE only (`hyperliquid_exchange`
  mode-guard kind: `api.hyperliquid-testnet.xyz/exchange` only; LIVE MODE and
  mainnet refused). Only `order` (spot assets ≥ 10000, limit, one order, no
  builder, no reduce-only), `cancel` and `approveAgent` (Testnet, name
  `lamportpay-test`) parse. Transfers, withdrawals, perps, vaults, builder fees
  are refused by the schema. Nonce must be within 10 minutes.
- `hyperliquid_test_events` table (migration `20261107100000`): one row per
  action; `(signer, nonce)` unique so a signed action is relayed at most once;
  RLS on, service role only; no signatures or keys stored.
- Reads: `GET /api/hyperliquid/markets`, `POST /api/hyperliquid/account`,
  `POST /api/hyperliquid/checks`, `GET /api/hyperliquid/history`.
- Rate limits: reads 30/min, signed actions 20/min per user.

## Evidence

- Signing matches Hyperliquid's Python SDK byte for byte (msgpack, action
  hash, L1 and approveAgent signatures): `tests/hyperliquid-signing.unit.test.ts`.
- Live: the testnet exchange recovered exactly our agent address from our
  signature ("User or API Wallet 0x… does not exist" for a throwaway key):
  `tests/hyperliquid-testnet.live.test.ts` test 6 (`HYPERLIQUID_LIVE=1`).
- Live account reads parse real data (active testnet trader: 15 fills, 7
  ledger updates).
- App check run: 6/6 passed and tracked (7 Nov 2026, local dev, TEST MODE).

## Not verified yet

- Approve + order + cancel with the owner's own wallet and test tokens (needs
  the owner's wallet in the browser).
- Hyperliquid testnet needs an account that has deposited on mainnet before
  the faucet works; orders below 10 USDC value are refused by Hyperliquid.
