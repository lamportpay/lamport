# Environment checklist (from the code, 4 Nov 2026)

Every name below is read by the code (`src/`, `scripts/`, `vite.config.ts`). Values are never
written here, in chat, in commits or in logs. **Where to enter them:** local work → `.env` /
`.env.local` in the project folder (git-ignored). Preview → Vercel → project `lamport` → Settings →
Environment Variables → scope **Preview**. Production → same page, scope **Production** (only at
the approved cutover). Mark every secret as **Sensitive** in Vercel. Production keys never go into
Preview; `VITE_` variables are public (they ship to the browser), so no secret ever has that prefix.

Legend: **S** = secret (server-only) · **P** = public · Local / Preview / Production = where it is
needed. "TEST" and "LIVE" are the app modes (`src/lib/app-mode.server.ts`).

## Mode and safety

| Variable | S/P | Local (TEST) | Preview | Production (LIVE) | Notes |
| --- | --- | --- | --- | --- | --- |
| `LAMPORTPAY_MODE` | P | `test` | `test` | `live` | Server mode; must equal the next one |
| `VITE_LAMPORTPAY_MODE` | P | `test` | `test` | `live` | Browser build mode |
| `LAMPORTPAY_LIVE_APPROVED_BY`, `LAMPORTPAY_LIVE_APPROVED_AT` | P | never | never | at LIVE unlock only | Part of the LIVE gate with the code lock |
| `LAMPORTPAY_LIVE_URL` | P | never | never | `https://lamportpay.com` | |
| `LAMPORTPAY_TEST_URL` | P | – | optional | optional | Link to the test deployment |
| `LAMPORTPAY_SHARED_DB` | P | never | never | never (legacy) | Refused setups |

## Supabase

| Variable | S/P | Local | Preview | Production | Notes |
| --- | --- | --- | --- | --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY` | P | dev project | dev project | production project | Build stops if missing or mixed (`src/lib/public-env.ts`) |
| `SUPABASE_URL`, `SUPABASE_PROJECT_ID`, `SUPABASE_PUBLISHABLE_KEY` | P | dev | dev | production | Server side, same project as above |
| `SUPABASE_SERVICE_ROLE_KEY` | **S** | dev secret | dev secret | new production secret | `sb_secret_…`; never `VITE_` |

## Payments and revenue

| Variable | S/P | Local | Preview | Production | Notes |
| --- | --- | --- | --- | --- | --- |
| `LAMPORTPAY_FEE_BPS` | P | 200 | 200 | 200 | One 2% fee |
| `LAMPORTPAY_SWAP_FEE_BPS` | P | 0 | 0 | 0 | Must be 0 (one fee) |
| `LAMPORTPAY_REVENUE_WALLET` | P | dev wallet | dev wallet | company wallet | LamportPay's fee only, never customer funds |
| `PAYMENT_ENABLED_CURRENCIES` | P | `usdc` | `usdc` | `usdc` | Unset = USDC only (4 Nov) |
| `PAYMENT_MIN_USDC` / `PAYMENT_MAX_USDC` (and `_USDT`) | P | empty | empty | empty or 15 / 5000 | Empty = code defaults 15 / 5,000 |
| `PAYOUT_COUNTRIES`, `PAYOUT_ESTIMATE_MINUTES` | P | optional | optional | as agreed | Display only |
| `ADMIN_BOOTSTRAP_EMAIL` | P | optional | optional | owner's email | First admin |

## Stables

| Variable | S/P | Local | Preview | Production | Notes |
| --- | --- | --- | --- | --- | --- |
| `STABLES_API_URL` | P | `https://api.sandbox.stables.money` | sandbox | `https://api.stables.money` | |
| `STABLES_API_KEY` | **S** | `sti_test_…` | `sti_test_…` | new `sti_live_…` | Live key only in Production |
| `STABLES_WEBHOOK_SECRET` | **S** | sandbox `whsec_…` | sandbox | production `whsec_…` | Webhook signature check |
| `STABLES_PROXY_URL` | **S** | empty | empty | the fixed-IP proxy, once approved | Stables calls only; empty = direct |

## Solana

| Variable | S/P | Local | Preview | Production | Notes |
| --- | --- | --- | --- | --- | --- |
| `SOLANA_DEVNET_RPC_URL` | **S** (key in URL) | devnet RPC | devnet RPC | – | TEST only |
| `SOLANA_RPC_URL` | **S** (key in URL) | never | never | mainnet RPC (new key) | TEST refuses mainnet |
| `SOLANA_TESTNET_RPC_URL` | **S** | optional | optional | – | |
| `SOLANA_FEE_RESERVE_LAMPORTS` | P | optional | optional | optional | Fee reserve override |

## Jupiter (Mainnet API; no devnet exists)

| Variable | S/P | Local | Preview | Production | Notes |
| --- | --- | --- | --- | --- | --- |
| `JUPITER_API_KEY` | **S** | optional (quotes) | optional | required for swaps | Never `VITE_` |
| `JUPITER_REFERRAL_ACCOUNT` | P | empty | empty | empty | Swap fee stays 0 |
| `SWAP_MAX_SLIPPAGE_BPS`, `SWAP_MAX_PRICE_IMPACT_BPS`, `SWAP_SIZE_BUFFER_BPS` | P | optional | optional | optional | Defaults 100 / 100 / 50 |

## Hyperliquid (Testnet)

No variables: reads use the public testnet info endpoint, no key. No order or signing key exists
or may be added without approval.

## Operations

| Variable | S/P | Local | Preview | Production | Notes |
| --- | --- | --- | --- | --- | --- |
| `CRON_SECRET` (`CRON_SECRET_PREVIOUS` during rotation) | **S** | any long random value | own value | new value | Reconcile job auth |
| `OPS_ALERT_WEBHOOK_URL` | **S** | optional | optional | recommended | Alert channel; `OPS_ALERT_WEBHOOK_FORMAT` (P) sets its format |
| `RECONCILE_CRON_SCHEDULE` | P | – | – | optional | |
| `LOVABLE_API_KEY`, `LOVABLE_CRON_SECRET(_PREVIOUS)`, `LOVABLE_SANDBOX` | **S** / P | never | never | never | Lovable leftovers (R9/R10) |

Build and platform flags (`NITRO_PRESET`, `NITRO_NO_EXTERNALS`, `VERCEL`, `NODE_ENV`,
`DEV_SERVER__PROJECT_PATH`) are set by tooling. Script-only: `E2E_BASE_URL`, `PROBE_ADDRESS`,
`PROBE_POLL_MS`.

## Still missing for LIVE (owner)

Production Supabase project and its keys; `STABLES_API_KEY` (`sti_live_`) and the production
`STABLES_WEBHOOK_SECRET`; the approved fixed-IP proxy for `STABLES_PROXY_URL`; a new mainnet
`SOLANA_RPC_URL` key; `JUPITER_API_KEY`; new `CRON_SECRET`; `OPS_ALERT_WEBHOOK_URL`. Rotate the
keys found in the git history (Alchemy, `sb_secret_`, `whsec_`; see STATUS section 6) before or
at go-live.
