# LamportPay Service Fee Layer

## Goal

Add a clear, demo-safe service fee to the existing /send quote flow so LamportPay can earn revenue before any real third-party payout API is invoked.

## Default model (recommended)

- **LamportPay fee:** 0.5% of the send amount (50 bps), configured as a flat percentage.
- **Partner fee:** unchanged from the third-party payout provider quote (currently mocked).
- **Total cost to sender:** partner cost + LamportPay fee.
- **Recipient receives:** the payout amount based on the partner's own rate, not reduced by LamportPay's fee.
- **Partner visibility:** partner is unaware of the LamportPay fee. This is a front-end markup on the quote, not a revenue share with the partner.

This model is simple, transparent, and keeps the partner API surface untouched.

## Changes

1. **Add fee configuration** (`src/lib/payout.config.ts`):
   - `LAMPORTPAY_FEE_BPS = 50` (50 bps = 0.5%).
   - Helper `calculateLamportPayFee(amount): number`.

2. **Update payout quote endpoint** (`src/routes/api/payout/quote.ts`):
   - Compute partner quote first (mock or real partner API).
   - Add LamportPay fee on top of the input amount.
   - Return fee breakdown in the response:
     - `partnerFee`
     - `lamportPayFee`
     - `totalFee`
     - `netAmountToPartner` / `recipientPayout`

3. **Update /send UI** (`src/routes/send.tsx` and related components):
   - Show the fee breakdown in the quote card:
     - Partner fee
     - LamportPay service fee
     - Total fee
   - Add a tooltip / explainer: “LamportPay charges a small service fee to keep the platform running. The regulated partner handles the fiat conversion and payout separately.”

4. **Update demo data** (`src/lib/payout.mapping.ts` or mock quote helper):
   - Ensure the mock quote respects the fee config.

5. **Keep existing guards**:
   - Do not touch Jupiter swap logic, wallet connection, or Solana RPC verification.
   - Do not modify the payout provider API routes beyond adding the fee math.
   - Keep all existing disclaimers that fiat payout is not live.

## Out of scope

- Real payment collection or settlement to a LamportPay bank/crypto account.
- Revenue-share or partner-billing integration.
- Dynamic or tiered fee schedules.
- New database tables for fee tracking.

## Verification

- `/api/payout/quote` returns a fee breakdown and respects the configured bps.
- Vitest tests pass for the updated payout quote payload shape.
- /send UI displays the fee breakdown before the user confirms.
