import { FUTURE_EXPLORATION } from "@/content/roadmap";

/** Public capabilities, never financial state or partnership assertions. */
export const INTEGRATION_GROUPS = [
  {
    title: "Connected today", label: "Existing infrastructure",
    entries: [
      { name: "Solana", status: "DEMO / SIMULATED", detail: "Wallet connection and devnet payment testing.", asset: "/tokens/sol.svg" },
      { name: "Jupiter", status: "LIVE", detail: "Live market quotes only. Mainnet swap execution is disabled in TEST MODE.", asset: "/partners/jupiter.svg" },
      { name: "Stables", status: "DEMO / SIMULATED", detail: "Hosted verification and bank-payout sandbox. Production KYC and fiat payouts are DISABLED.", asset: "/partners/stables.svg" },
    ],
  },
  {
    title: "In discussion", label: "Talks ongoing, no agreement",
    entries: [
      { name: "Yellow Card", status: "PLANNED", detail: "Discussions ongoing with Yellow Card and other payout API providers similar to Stables. No agreement or integration is confirmed.", asset: "/partners/yellowcard.svg" },
      { name: "More payout providers", status: "PLANNED", detail: "Talks with additional payout API companies to widen coverage. Nothing is signed or enabled." },
    ],
  },
  {
    title: "On the roadmap", label: "Goals, not enabled",
    entries: [
      { name: "Hyperliquid", status: "PLANNED", detail: FUTURE_EXPLORATION[1].detail, asset: "/partners/hyperliquid.svg" },
      { name: "Major cryptocurrencies", status: "PLANNED", detail: "Bitcoin, Ethereum, Ripple and Litecoin deposits are on the roadmap. Today only USDC on Solana is enabled.", asset: "/tokens/btc.svg" },
      { name: "New countries", status: "PLANNED", detail: "Nigeria, Pakistan and further destinations are planned corridors. They are not active today.", asset: "/flags/NG.svg" },
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
