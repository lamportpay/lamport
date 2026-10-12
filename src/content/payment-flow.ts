export const PAYMENT_JOURNEY = [
  { title: "Connect", detail: "Connect your Solana wallet and sign a plain-text message to sign in. This is not a payment transaction." },
  { title: "Select", detail: "Choose your amount, destination country and payout currency. USDC is the enabled settlement currency; SOL routing is available when supported by your wallet." },
  { title: "Quote", detail: "See the estimated local-currency amount, LamportPay fee and separate partner costs before identity verification. Quotes expire and may need refreshing." },
  { title: "Review", detail: "Check bank details with Stables, complete any required verification on its hosted sandbox page, then review the recipient, amount and costs." },
  { title: "Sign", detail: "Approve in your wallet. In TEST MODE, you sign a devnet memo transaction that moves no funds—not a mainnet deposit or swap." },
  { title: "Processing", detail: "The app simulates a sandbox deposit and follows the transfer status reported by Stables. Some sandbox destinations can remain processing." },
  { title: "Complete", detail: "When Stables reports completion, the timeline and receipt update. A sandbox receipt is a demo record, not evidence of a real bank payout." },
];

export const PAYMENT_SAFETY = "TEST MODE uses Solana devnet and Stables sandbox. Real bank payouts and production identity verification are DISABLED pending production approval.";

export const PAYMENT_COSTS = [
  { title: "LamportPay fee", detail: "One fee, taken out of the total you send—not an extra conversion fee plus a swap fee. The app shows the fee amount before approval." },
  { title: "Payout partner fee", detail: "Stables costs are quoted separately. They are not included in LamportPay’s fee." },
  { title: "Swap & network costs", detail: "Any Jupiter swap costs, price impact and Solana network fees are separate. TEST MODE does not execute mainnet swaps or move payment funds." },
];