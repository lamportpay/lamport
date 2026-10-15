export const PAYMENT_JOURNEY = [
  {
    title: "Connect",
    detail:
      "Connect your Solana wallet and sign a plain-text message to sign in. This is not a payment transaction.",
  },
  {
    title: "Select",
    detail:
      "Choose your amount, destination country and payout currency. USDC is the enabled settlement currency; SOL routing is available when supported by your wallet.",
  },
  {
    title: "Quote",
    detail:
      "See the estimated local-currency amount, LamportPay fee and separate partner costs before identity verification. Quotes expire and may need refreshing.",
  },
  {
    title: "Review",
    detail:
      "Check bank details with Stables, complete any required verification on its hosted verification page, then review the recipient, amount and costs.",
  },
  {
    title: "Sign",
    detail:
      "Approve in your wallet. In the demo build, you sign a test-network memo transaction that moves no funds—not a mainnet deposit or swap.",
  },
  {
    title: "Processing",
    detail:
      "The app simulates a demo deposit and follows the transfer status reported by Stables. Some demo destinations can remain processing.",
  },
  {
    title: "Complete",
    detail:
      "When Stables reports completion, the timeline and receipt update. A demo receipt is a demonstration record, not evidence of a real bank payout.",
  },
];

export const PAYMENT_SAFETY =
  "DEMO / SIMULATED: test-network assets and the payout partner's test environment. Real bank payouts and production identity verification are DISABLED pending production approval.";

/** Public identity explanation: ownership proof is not identity/KYC approval. */
export const VERIFICATION_JOURNEY = [
  {
    title: "Prove wallet ownership",
    label: "LIVE · MESSAGE SIGN-IN",
    summary: "One message signature. No payment or seed phrase.",
    detail:
      "Connect a Solana wallet and sign a plain-text sign-in message. This proves control of the wallet—not your legal identity. It is not a transaction and does not move funds.",
  },
  {
    title: "Verify the signed proof",
    label: "LIVE · SERVER CHECKS",
    summary: "Origin, freshness and signature checked by LamportPay.",
    detail:
      "LamportPay checks the message origin, age and Ed25519 signature and prevents signature reuse. The verified wallet is linked to the customer account; payment requests must use the linked wallet.",
  },
  {
    title: "Complete hosted identity checks",
    label: "DEMO / SIMULATED · KYC",
    summary: "Stables handles identity checks on its hosted page.",
    detail:
      "After a quote and bank-detail checks, any required identity verification takes place on Stables’ hosted verification page. LamportPay keeps the verification link and status, not identity documents. Wallet-only customers provide the email Stables requires.",
  },
  {
    title: "Check eligibility before transfer",
    label: "PRODUCTION PAYOUT DISABLED",
    summary: "Verified sender, checked recipient, then wallet approval.",
    detail:
      "The server requires an eligible verified Stables customer before preparing a transfer. Own-account holder details come from the verified record; beneficiary payouts require recipient details and purpose. Wallet ownership alone never authorizes a bank payout. In the demo build, approval is a test-network memo that moves no funds.",
  },
] as const;

export const PAYMENT_COSTS = [
  {
    title: "LamportPay fee",
    detail:
      "One fee, taken out of the total you send—not an extra conversion fee plus a swap fee. The app shows the fee amount before approval.",
  },
  {
    title: "Payout partner fee",
    detail: "Stables costs are quoted separately. They are not included in LamportPay’s fee.",
  },
  {
    title: "Swap & network costs",
    detail:
      "Any Jupiter swap costs, price impact and Solana network fees are separate. The demo build does not execute mainnet swaps or move payment funds.",
  },
];
