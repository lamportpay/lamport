/**
 * Recovery steps used when no AI provider is configured (for example on Vercel,
 * where Lovable's AI gateway is not available). Fixed text chosen by the saved
 * payment status only; it never claims anything about the payout itself.
 */
const SUPPORT_LINE =
  "If none of this helps, contact LamportPay support with your payment reference. We will never ask for your private key or seed phrase.";

const START_AGAIN = [
  "This payment has ended and cannot be continued.",
  "Open Convert and start a new payment with the amount and country you want.",
  "Check that your wallet holds enough USDC for the amount plus the fee shown.",
];

const BY_STATUS: Record<string, string[]> = {
  PAYMENT_CREATED: [
    "Open the History page and press Continue on this payment.",
    "Check that the wallet you connected is the one you signed in with.",
    "Ask for a new quote if the old one has run out.",
  ],
  QUOTED: [
    "Open the History page and press Continue on this payment.",
    "If the quote has run out, ask for a new one; the amounts may change slightly.",
    "Enter or confirm your bank details, then review the payment.",
  ],
  KYC_PENDING: [
    "Open the History page and press Continue on this payment.",
    "Finish identity verification on the payout partner's page that opens.",
    "Verification can take a few minutes; the payment moves on by itself once it is approved.",
  ],
  KYC_APPROVED: [
    "Your identity is verified. Open the History page and press Continue.",
    "Review the payment and press Pay Now.",
    "Approve the request in your wallet when it asks.",
  ],
  KYC_REJECTED: [
    "Identity verification was not approved, so this payment cannot go ahead.",
    "Contact support if you think this is a mistake.",
  ],
  CREATED: [
    "The transfer is ready. Open the History page and press Continue.",
    "Press Pay Now and approve the request in your wallet.",
    "Make sure your wallet holds enough USDC for the amount plus the fee shown.",
  ],
  AWAITING_FUNDS_COLLECTION: [
    "Open the History page and press Continue to see the payment's progress.",
    "If you already approved it in your wallet, wait a few minutes; the status updates by itself.",
    "Do not send the same payment twice.",
  ],
  COMPLIANCE_HOLD: [
    "The payout partner is reviewing this payment.",
    "No action is needed from you unless you are asked for more information.",
    "The status on the History page updates by itself when the review ends.",
  ],
  FUNDS_COLLECTED: [
    "Your payment was received and the bank payout is under way.",
    "The status on the History page updates by itself; there is nothing to sign.",
  ],
  IN_PROGRESS: [
    "Your payment was received and the bank payout is under way.",
    "Bank payouts can take from minutes to a few business days depending on the country.",
    "The status on the History page updates by itself; there is nothing to sign.",
  ],
  PAYMENT_SUBMITTED: [
    "The payout has been sent to the bank.",
    "Banks can take from minutes to a few business days to show it.",
  ],
  PAYMENT_PROCESSED: [
    "The bank has processed the payout.",
    "If it does not show in the account soon, check with the bank using the payment reference.",
  ],
  COMPLETED: ["This payment is complete. Nothing more is needed."],
};

export function fallbackRecoverySteps(status: string): string {
  const s = status.trim().toUpperCase();
  const steps =
    BY_STATUS[s] ??
    (s === "FAILED" || s === "CANCELLED" || s === "EXPIRED"
      ? START_AGAIN
      : [
          "Open the History page and press Continue on this payment.",
          "Reconnect your wallet and sign in again if it asks.",
          "If the payment cannot continue, start a new one from Convert.",
        ]);
  return [...steps.map((line, i) => `${i + 1}. ${line}`), SUPPORT_LINE].join("\n");
}
