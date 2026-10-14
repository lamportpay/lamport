import { FUTURE_EXPLORATION } from "@/content/roadmap";

/** Public capabilities, never financial state or partnership assertions. */
export const INTEGRATION_GROUPS = [
  {
    title: "Connected today", label: "Existing infrastructure",
    entries: [
      { name: "Solana", status: "DEMO / SIMULATED", detail: "Wallet connection and devnet payment testing.", asset: "/tokens/sol.svg" },
      { name: "Jupiter", status: "LIVE", detail: "Live market quotes only. Mainnet swap execution is disabled in TEST MODE." },
      { name: "Stables", status: "DEMO / SIMULATED", detail: "Hosted verification and bank-payout sandbox. Production KYC and fiat payouts are DISABLED." },
    ],
  },
  {
    title: "Next connections", label: "Not enabled",
    entries: [
      { name: "Hyperliquid", status: "PLANNED", detail: FUTURE_EXPLORATION[1].detail },
      { name: "Exchange connections", status: "PLANNED", detail: "Future exchange connectivity under evaluation. No exchange integration or agreement is confirmed." },
    ],
  },
  {
    title: "Future relationships", label: "Not confirmed partnerships",
    entries: [
      { name: "Circle", status: "PLANNED", detail: FUTURE_EXPLORATION[3].detail, asset: "/tokens/usdc.svg" },
      { name: "Tether", status: "PLANNED", detail: FUTURE_EXPLORATION[4].detail, asset: "/tokens/usdt.svg" },
    ],
  },
] as const;

export const BANK_RESTRICTION_SOURCE = "https://docs.stables.money/developer-platform/payments/virtual-accounts/australian-banking";
export const BANK_RESTRICTIONS = [
  { title: "No verified payout blacklist", detail: "The official documentation reviewed does not provide a complete list of unsupported payout banks. A bank logo here does not guarantee eligibility; Stables checks the destination and bank details for each payment." },
  { title: "Australian deposit warnings", detail: "Stables names ANZ, NAB and CBA as examples where deposits into virtual accounts may be delayed, reviewed or returned. This concerns incoming deposits—not a ban on payouts to those banks." },
  { title: "Not a permanent bank block", detail: "Stables says these outcomes vary by customer and account, and a delayed or returned transfer is not necessarily a permanent block. LamportPay currently has fiat payouts DISABLED." },
] as const;