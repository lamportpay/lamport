# Revenue engine verification (30 Oct 2026)

Branch `vercel-preview-migration`. Read-only checks on the dev Supabase project, unit tests, and
tamper tests on a throwaway local Postgres. The fee policy and the revenue wallet were not
changed.

## Results

| Area | Result | Evidence |
|---|---|---|
| 2% fee calculation | **Verified** | All 72 percentage-priced payments on dev match `fee = ceil(net × 200 / 9800)` exactly, i.e. 2% of the total within 1 bp; 1 payment priced with rule `none` has fee 0; no waivers or bounded fees recorded. Unit tests: `fees`, `fee-models`, `funding-transaction` (150 sent → 147.00 to the deposit address + 3.00 to the revenue wallet in one unsigned transaction) |
| Fee ledger: expected side | **Verified** | 216 rows (`lamportpay_fee/expected`, `partner_fee/expected`); for all 36 payments with a LamportPay fee entry, ledger = `payments.platform_fee_minor` |
| Fee ledger: received side | **Not exercised** | 0 `received` rows; 0 payments with verified funding. TEST mode signs a memo that moves no funds, so no fee has ever been received |
| Fee ledger immutability | **Fixed and verified** | Row trigger refuses UPDATE/DELETE (enabled on dev). New: TRUNCATE was still possible for `service_role` and the owner; migration `20261030130000_fee_ledger_no_truncate.sql` adds a statement trigger and revokes UPDATE/DELETE/TRUNCATE (local Postgres: all refused after, inserts still work). Not applied to dev yet |
| Pricing snapshot immutability | **Verified** | `trg_payments_pricing_immutable` enabled on dev; fresh-database tamper test 29 Oct |
| Admin audit log append-only | **Verified** | Three triggers enabled on dev (append-only, no truncate, database timestamp); no UPDATE/DELETE/TRUNCATE grant for any role; `audit-log-append-only` test |
| Reporting (day/week/month) | **Verified (logic)** | `revenue-report` tests: UTC days, Monday weeks, calendar months, exact integer sums, unverified payments excluded. No real fee revenue exists to report yet |
| Reconciliation (expected vs received, revenue-wallet balance) | **Built, not operational** | `revenue-reconciliation` tests pass; needs a revenue wallet and a funded payment |

Test run: 7 revenue-engine test files, 36 tests, all passing (plus the new
`fee-ledger-append-only` test).

## Outstanding: revenue-wallet reconciliation test (C10 / C14)

Cannot run in TEST mode (no funds move). It needs, in order:

1. The company revenue-wallet address in the environment (C01; currently kept as is by owner
   decision; Jupiter reported it holds no mainnet SOL on 30 Oct).
2. Stables production and LIVE unlocked with explicit owner approval
   (`docs/integrations/stables-production-checklist.md`, section D).
3. One controlled payment of the minimum amount from the owner's wallet to the owner's bank.

Pass criteria:

- the funding transaction holds two transfers: the exact deposit to Stables and the fee to the
  revenue wallet;
- the ledger gains `lamportpay_fee/received` equal to `lamportpay_fee/expected`;
- `payments.platform_fee_received_minor` equals `platform_fee_minor`;
- Admin → Fees & Revenue → Reconciliation shows the payment as received and the revenue wallet's
  on-chain USDC balance increased by exactly the fee;
- the daily, weekly and monthly report and the CSV export include it.

If any check fails: pause payments (payment controls), open an operations case, and do not launch.
