# Double-payment protection (Pay Now, LIVE funding)

Batch 1 (9 Nov 2026), revised in the 10 Nov review. Applies to the LIVE funding
path (`buildFundingTransaction` → wallet signs and sends → `verifyFunding`). The
TEST Pay Now flow on devnet (`test-payment.server.ts`) is separate and does not
use these columns.

The customer's wallet signs and sends the funding transaction (deposit + 2% fee
in one transaction). LamportPay never holds funds or keys. The risks are a
customer sending twice: after a failed confirmation and a reload, or from two
open windows.

## 1. A sent transaction is recorded at once (pending)

- As soon as the wallet returns the signature, the page posts it to
  `/api/payments/{id}/funding`. The server stores it as pending
  (`funding_pending_signature`, `funding_pending_at`) before any chain check.
- While a pending signature may still land, building another funding
  transaction answers 409 `funding_pending`, and so does posting a different
  signature. A refused second signature is kept on the timeline
  (`funding_signature_refused`), because funds may have moved twice.
- After a reload, the payment view carries `fundingPending`. The page shows only
  "Payment sent… Check again": no Send button and no manual signature form.
- A payment counts as funded only after the finalized on-chain check of amount,
  payer and fee (`funding_signature`, unique). A pending signature never marks
  a payment funded.

## 2. When a pending signature is released

`pendingSignatureState()` in `src/lib/solana-usdc.server.ts`:

| Solana says                         | State     | Effect                                 |
| ----------------------------------- | --------- | -------------------------------------- |
| Known, no error                     | landed    | Keep pending; verification decides     |
| Failed at confirmed or finalized    | failed    | Release (customer may pay again)       |
| Failed, only at processed           | in flight | Keep pending (result can still change) |
| Unknown, chain height ≤ bound + 150 | in flight | Keep pending                           |
| Unknown, chain height > bound + 150 | expired   | Release                                |

The bound (`funding_pending_last_valid_block_height`) is set at the first check
of that signature: chain height then + 151. Any transaction reported to us was
sent before that check, so its blockhash cannot be newer, whatever blockhash the
wallet used. Release also happens when the finalized transaction moved nothing
to the deposit address. If funds did arrive (for example a wrong amount), the
payment stays blocked for operations. If Solana cannot be read, the server
answers 503 and never guesses.

## 3. Two windows: the same transaction while one can still land

The blockhash of the transaction prepared last is kept (`funding_build_blockhash`,
`funding_build_last_valid_block_height`). While that transaction can still land
(chain height ≤ its last valid height + 10):

- the same wallet gets exactly the same transaction again (same blockhash and
  instructions), so signing it twice gives the same signature and Solana
  processes it once;
- another wallet is refused: 409 `funding_in_progress`, with `retryAfterSeconds`;
- with fewer than 20 blocks left, nothing is handed out: 409
  `funding_prepare_wait` (a few seconds).

After a failed or empty transaction, the prepared transaction is forgotten, so
the customer gets a fresh one (Solana would refuse the identical copy as already
processed).

## Limits (known, documented)

- A wallet that changes the transaction before signing (for example by adding
  its own instructions) produces a different signature. In that case the
  protection relies on section 1, once the first signature is reported.
- If the page closes in the instant between the wallet broadcasting and the
  first server request (milliseconds), the signature is not recorded. Fully
  closing this needs the wallet to sign only and the server to broadcast.
- A manual send ("Sent it from another wallet?") that fails, while another
  window holds an unsigned copy of the prepared transaction, clears that copy's
  hold. This is a narrow case and is accepted.

## Tests

- `tests/payments-service.unit.test.ts`, "double-payment protection" (pending,
  release rules, idempotency, concurrency, two windows).
- `tests/pending-signature.devnet.live.test.ts` (real devnet reads, opt-in:
  `SOLANA_DEVNET_LIVE=1`).
- `scripts/db-replay` checks the database rules.

## Database

Migration `20261109100000_funding_pending_signature.sql` (rollback in
`supabase/rollbacks/`). Apply it before deploying this code to any environment
that runs the LIVE funding path.
