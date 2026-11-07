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
    title: "Verify (KYC)",
    detail:
      "Complete identity verification (KYC) on Stables’ hosted page. LamportPay keeps only the verification link and status—never your identity documents. Verified once, your wallet skips this step on later payments.",
  },
  {
    title: "Review",
    detail:
      "Bank details are checked with Stables. Review the recipient, amount, LamportPay fee and partner costs before you approve.",
  },
  {
    title: "Sign",
    detail:
      "Approve in your wallet. In the sandbox build, you sign one devnet transaction: a memo naming the payment and the LamportPay fee in devnet test USDC. No real money moves—not a mainnet deposit or swap.",
  },
  {
    title: "Processing",
    detail:
      "The app simulates a sandbox deposit and follows the transfer status reported by Stables. Some sandbox destinations can remain processing.",
  },
  {
    title: "Complete",
    detail:
      "When Stables reports completion, the timeline and receipt update. A sandbox receipt is a demonstration record, not evidence of a real bank payout.",
  },
];

export const PAYMENT_SAFETY =
  "SANDBOX: test-network assets and the payout partner's test environment. Real bank payouts and production identity verification are DISABLED pending production approval.";

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
    label: "SANDBOX · KYC",
    summary: "Stables handles identity checks on its hosted page.",
    detail:
      "After a quote and bank-detail checks, any required identity verification takes place on Stables’ hosted verification page. LamportPay keeps the verification link and status, not identity documents. Wallet-only customers provide the email Stables requires.",
  },
  {
    title: "Check eligibility before transfer",
    label: "PRODUCTION PAYOUT DISABLED",
    summary: "Verified sender, checked recipient, then wallet approval.",
    detail:
      "The server requires an eligible verified Stables customer before preparing a transfer. Own-account holder details come from the verified record; beneficiary payouts require recipient details and purpose. Wallet ownership alone never authorizes a bank payout. In the sandbox build, approval is a devnet transaction that moves only test tokens.",
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
      "Any Jupiter swap costs, price impact and Solana network fees are separate. The sandbox build does not execute mainnet swaps or move payment funds.",
  },
];

// ---------------------------------------------------------------------------
// LIVE wording (docs/launch/live-wording.md). Shown only once LIVE is active
// (useLaunchStage); the exports above stay the TEST / sandbox wording.

const LIVE_JOURNEY_DETAIL: Record<string, string> = {
  Sign: "Approve in your wallet. One transaction sends the exact deposit to the single-use address from Stables and LamportPay's fee to LamportPay. Nothing leaves your wallet without your signature.",
  Processing:
    "Stables collects the deposit, converts it and sends the local-currency payout. The app follows the transfer status Stables reports.",
  Complete:
    "When Stables reports completion, the timeline and receipt update with the payout details.",
};

const LIVE_VERIFICATION: Record<string, { label?: string; detail?: string }> = {
  "Complete hosted identity checks": { label: "LIVE · KYC" },
  "Check eligibility before transfer": {
    label: "LIVE · CHECKS BEFORE PAYOUT",
    detail:
      "The server requires an eligible verified Stables customer before preparing a transfer. Own-account holder details come from the verified record; beneficiary payouts require recipient details and purpose. Wallet ownership alone never authorizes a bank payout.",
  },
};

const LIVE_COSTS_DETAIL: Record<string, string> = {
  "Swap & network costs":
    "Any Jupiter swap costs, price impact and Solana network fees are separate and paid in your own wallet.",
};

export type PaymentFlowCopy = {
  journey: { title: string; detail: string }[];
  safety: string;
  verification: { title: string; label: string; summary: string; detail: string }[];
  costs: { title: string; detail: string }[];
};

/** The payment-flow wording for a stage ("test" = the exports above). */
export function paymentFlowCopy(stage: "test" | "live"): PaymentFlowCopy {
  if (stage === "test") {
    return {
      journey: PAYMENT_JOURNEY,
      safety: PAYMENT_SAFETY,
      verification: [...VERIFICATION_JOURNEY],
      costs: PAYMENT_COSTS,
    };
  }
  return {
    journey: PAYMENT_JOURNEY.map((s) => ({ ...s, detail: LIVE_JOURNEY_DETAIL[s.title] ?? s.detail })),
    safety:
      "LIVE: real payments. Funds go from your own wallet straight to the payout partner's single-use deposit address; LamportPay never holds them. Identity checks and bank payouts are handled by Stables.",
    verification: VERIFICATION_JOURNEY.map((s) => ({ ...s, ...LIVE_VERIFICATION[s.title] })),
    costs: PAYMENT_COSTS.map((c) => ({ ...c, detail: LIVE_COSTS_DETAIL[c.title] ?? c.detail })),
  };
}
