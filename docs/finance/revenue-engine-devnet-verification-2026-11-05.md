# Revenue engine: audit, fixes and devnet verification (5–6 Nov 2026)

Branch `revenue-devnet-verification` (from `vercel-preview-migration` at 8ad9f8d). TEST mode only:
Solana devnet and the Stables sandbox. No mainnet transaction, LIVE stays locked, USDC only, no
new wallet. Revenue wallet: the configured `LAMPORTPAY_REVENUE_WALLET` (`97N43K…TK5r6`).

## Result

The 2% fee was collected on devnet in the customer-signed transaction, reached the revenue
wallet, was verified by the backend from the chain and recorded exactly once.

| Check | Evidence |
| --- | --- |
| Payment | `ad0c4160-4d1d-4e3b-b1f1-d3c371b0c741`, 50.00 USDC sent, 49.00 to the payout partner, status COMPLETED (sandbox) |
| Fee | 2% of 50.00 = 1.00 USDC (`platform_fee_minor` 1000000, bps 200) |
| Transaction | `2N5yruUUBFpMwwDKjASZub78Grt3dJtetmScPcu3muL6CYQR6rPwCFzHoZ8QZBLDZttvJDmfCtKxgMahnCV8yqnb`, devnet slot 519089205, 2026-11-05 22:31:14 UTC, no error, signed only by the customer wallet `BUGAar…m4dM` |
| Instructions | memo `LamportPay TEST payment ad0c4160-…`, create revenue token account (idempotent), `transferChecked` 1000000 devnet USDC, 2 compute-budget instructions added by the wallet |
| On-chain amounts | revenue wallet 0 → 1.000000 (+1.000000); customer 125.000000 → 124.000000 (−1.000000) |
| Revenue wallet now | 1 devnet USDC; the fee transaction is its latest transaction |
| Database | `platform_fee_received_minor` 1000000, `platform_fee_network` solana-devnet, `platform_fee_signature` = the transaction, `payer_wallet` BUGAar…, `funding_verified_at` null (no mainnet funding) |
| Ledger | one `expected` row 1000000 and one `received` row 1000000 (network solana-devnet, reference = the transaction) |
| Revenue status | collected; counted as a devnet test fee, not as revenue (mainnet revenue stays 0) |
| Admin page | not checked visually yet (needs an admin sign-in with MFA) |

## Why revenue never showed before

1. TEST "Pay Now" signed a memo that moved no funds (owner decision 3 Oct), so no fee ever moved.
2. The fee path (transaction builder and on-chain check) is mainnet-only, and LIVE is locked.
3. The revenue wallet was also linked as a customer login wallet and signed test payments; a fee
   from a wallet to itself moves nothing.
4. No swap fee by design (one 2% fee per payment, collected when funding); Jupiter has no devnet.
5. The admin pages showed quote-only (33) and failed (19) payments as "pending" revenue, and
   completed test payments as pending forever.

## Changes

- TEST "Pay Now" (owner request 5 Nov, replaces the memo-only decision of 3 Oct): the server builds
  one devnet transaction — the memo plus the exact fee in devnet USDC to the revenue wallet — and
  the customer's wallet signs it (`/api/payments/:id/test-payment-transaction`).
- The server reads the confirmed transaction and records only what left the customer's wallet for
  the revenue wallet; the revenue wallet cannot pay its own fee.
- Fee receipt per payment: network, transaction and time, written once (migration
  `20261105100000_fee_receipt_network.sql`, applied to the dev database 5 Nov): unique per
  transaction, all-or-nothing, and immutable once written. LIVE funding writes the same receipt
  with network `solana`.
- Admin: statuses calculated / pending / collected / short / missing / failed / not collected;
  customer wallet, revenue wallet, network, transaction link and swapped amount per payment;
  mainnet revenue and devnet test fees shown apart; reconciliation on the server's own network; a
  warning when the revenue wallet is also a customer wallet.
- Wallet sign-in: accounts created by the old wallet provider had no email; they now get the
  wallet's placeholder email on sign-in (same account).
- Lovable-hosted images (bank logos, demo video, partner logos, one team photo) copied into
  `public/` at the same paths so they load off Lovable.

## Stables QR deposits

- The API has no request field that sets a developer or integrator fee; quotes and transfers only
  report `developer_fee` / `integrator_fee`, and every sandbox quote shows `integrator_fee` 0.
- The dashboard's deposit QR is the organisation's own prefund balance (whitelisted senders only,
  withdrawal from the dashboard only). Customer payments into it would be custodial, so it is not
  used for customers.
- OPEN with Stables: how the developer fee is set per transfer, in which currency, when it settles
  and whether the API reports it. Until then a wallet-less (QR) payment cannot carry the 2% fee.

## Not done / open

- Admin Fees & Revenue page: visual check by an admin.
- Mainnet: the same path runs only after LIVE approval and the controlled real-money test.
- The client asked the server for the TEST transaction twice within 20 ms on this payment
  (two `test_payment_transaction_built` events); only one was signed. Harmless; to tidy later.
