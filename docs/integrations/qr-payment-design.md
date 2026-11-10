# QR payment without connecting a wallet (design, 11 Nov 2026; NOT built)

Goal: a second way to pay. The customer scans a QR code with their phone wallet; they do not
connect a wallet to LamportPay. Same payment, same Stables deposit, same 2% fee, non-custodial.

## What the providers support (verified)

- **Stables:** no API for a QR or payment link was found. The QR in the Stables dashboard pays
  into LamportPay's own Stables balance (checked 5-6 Nov), which would hold customer money:
  custodial, so not usable. Open question P22/Q-QR to Stables: is there a per-transfer payment
  link or QR via the API, and can it carry an integrator fee?
- **Solana Pay** (open standard, `docs.solanapay.com/spec`), two kinds of QR:
  - *Transfer request* `solana:<recipient>?amount=…&spl-token=<USDC mint>&reference=…`: any
    compatible wallet pays one recipient. It cannot carry LamportPay's fee as a second transfer,
    so with a fee it breaks decision D20 (fee in the same transaction).
  - *Transaction request* `solana:https://lamportpay.com/api/payments/{id}/solana-pay?t=…`: the
    wallet sends its address to our server (POST `account`) and receives the transaction to
    sign. The server builds exactly today's funding transaction (deposit + 2% fee). The spec
    names Phantom among the implementations; exchange apps generally cannot do this.

## Proposed design (transaction request)

1. The payment page shows a QR next to "Connect wallet" once the Stables transfer exists.
2. GET returns the label "LamportPay" and the icon. POST `{account}`:
   - same checks as `buildFundingTransaction` (state, open transfer, funds, two-window rule);
   - one random `reference` key per payment, added read-only to the transfer instruction;
   - `account` becomes the payer wallet; the response has the base64 transaction and a message
     ("Pay 15.30 USDC: 15.00 to the payout partner + 0.30 LamportPay fee").
3. The wallet sets the fee payer and a fresh blockhash (spec rule for unsigned transactions),
   signs and sends. LamportPay never signs or holds anything.
4. Detection without the browser: the server polls `getSignaturesForAddress(reference)` (in the
   page and in the 5-minute reconcile job). The first signature found is recorded as pending
   (same rules as today), then verified on-chain (amount, payer, fee); Stables webhooks and
   reconciliation drive the rest of the states, unchanged.
5. Duplicates: the pending rule blocks a second transaction while one may land; the QR page
   shows "Payment sent, waiting for Solana", then completed or failed, from the same states.

Security notes: the link carries a short-lived signed token (payment id + expiry) so only the
payment's owner can open it; POST is rate limited; the wallet address is validated; the
transaction is built only from server data.

## What it needs

- Approval of this design (new payment path; fee model and custody unchanged).
- About 2-3 days: endpoint, reference tracking in the reconcile job, QR component, tests.
- Production test as part of the real-money plan (Solana Pay needs mainnet USDC).
- A transfer-request QR (any wallet, no fee) only if the business accepts payments without
  the 2% fee in the same transaction, or Stables adds a fee mechanism.
