import { FUTURE_EXPLORATION } from "@/content/roadmap";

/** Public capabilities, never financial state or partnership assertions. */
export const INTEGRATION_GROUPS = [
  {
    title: "Connected today", label: "Existing infrastructure",
    entries: [
      { name: "Solana", status: "SANDBOX", detail: "Wallet connection and test-network payment checks.", asset: "/tokens/sol.svg" },
      { name: "Jupiter", status: "LIVE", detail: "Live market quotes only. Mainnet swap execution is disabled in the sandbox build.", asset: "/partners/jupiter.svg" },
      { name: "Stables", status: "SANDBOX", detail: "Hosted verification and sandbox bank payouts. Production KYC and fiat payouts are DISABLED.", asset: "/partners/stables.svg" },
    ],
  },
  {
    title: "On the roadmap", label: "Goals, not enabled",
    entries: [
      { name: "Hyperliquid", status: "IN PROGRESS", detail: FUTURE_EXPLORATION[1].detail, asset: "/partners/hyperliquid.svg" },
      { name: "Major cryptocurrencies", status: "PLANNED", detail: "Bitcoin, Ethereum, Ripple and Litecoin deposits are on the roadmap. Today only USDC on Solana is enabled.", asset: "/tokens/btc-eth.png" },
      { name: "Yellow Card & payout APIs", status: "PLANNED", detail: "Discussions ongoing with Yellow Card and other payout API providers similar to Stables. No agreement or integration is confirmed.", asset: "/partners/yellowcard.svg" },
      { name: "New countries", status: "PLANNED", detail: "Pakistan and Nigeria are proposed Phase 2 corridors after funding, subject to payout-partner support and local compliance review. They are not active today.", asset: "/flags/NG.svg" },
    ],
  },
  {
    title: "Future relationships", label: "Not confirmed partnerships",
    entries: [
      { name: "Circle", status: "PLANNED", detail: FUTURE_EXPLORATION[3].detail, asset: "/tokens/usdc.svg" },
      { name: "Tether", status: "PLANNED", detail: FUTURE_EXPLORATION[4].detail, asset: "/tokens/usdt.svg" },
    ],
  },
  {
    title: "Further ahead", label: "Proposed stages",
    entries: [
      { name: "Controlled production launch", status: "PLANNED", detail: "External security review, partner sign-off and a LIVE readiness review, then small real-money payouts. Production KYC and fiat payouts remain DISABLED today." },
      { name: "B2B payout APIs & remittance", status: "PLANNED", detail: "Business payout APIs and remittance use cases on the same payment engine. Depends on partner-licensed products and regulatory approvals; no date committed." },
    ],
  },
] as const;

export const BANK_RESTRICTION_SOURCE = "https://docs.stables.money/developer-platform/payments/virtual-accounts/australian-banking";
export const BANK_RESTRICTIONS = [
  { title: "No verified payout blacklist", detail: "The official documentation reviewed does not provide a complete list of unsupported payout banks. A bank logo here does not guarantee eligibility; Stables checks the destination and bank details for each payment." },
  { title: "Australian deposit warnings", detail: "Stables names ANZ, NAB and CBA as examples where deposits into virtual accounts may be delayed, reviewed or returned. This concerns incoming deposits—not a ban on payouts to those banks." },
  { title: "Not a permanent bank block", detail: "Stables says these outcomes vary by customer and account, and a delayed or returned transfer is not necessarily a permanent block. LamportPay currently has fiat payouts DISABLED." },
] as const;
