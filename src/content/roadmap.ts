/**
 * Public roadmap and future vision, shared by the home page and the white paper.
 * These are proposed stages, not delivery
 * commitments: do not add dates here until scope and dependencies are validated.
 */

export type RoadmapPhase = {
  phase: number;
  title: string;
  status: "current" | "proposed";
  summary: string;
  /** Public-facing readiness milestone, not an internal approval workflow. */
  dependsOn: string;
  /** One-line headline for the homepage spotlight. */
  headline: string;
  /** Three short scan-friendly focus points. */
  highlights: [string, string, string];
};

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    phase: 1,
    headline: "Prove the full payment journey end to end.",
    highlights: ["Wallet + swap flow", "USDC quote & receipt", "Payout sandbox"],
    title: "Core product validation",
    status: "current",
    summary:
      "Validate the Solana wallet flow, Jupiter-powered swap, USDC quote, verification, payout sandbox, transaction tracking and receipt.",
    dependsOn: "End-to-end test results and a validated payment experience.",
  },
  {
    phase: 2,
    headline: "Harden security before real customers.",
    highlights: ["Security reviews", "Corridor validation", "Production safeguards"],
    title: "Security and controlled launch",
    status: "proposed",
    summary:
      "Complete security reviews, confirm partner requirements, validate payout corridors and prepare production readiness.",
    dependsOn: "Security assessment, payout readiness and production safeguards.",
  },
  {
    phase: 3,
    headline: "Accept more assets through more liquidity.",
    highlights: ["Hyperliquid in progress", "BTC & ETH routes", "More provider APIs"],
    title: "Liquidity and asset integrations",
    status: "proposed",
    summary:
      "Hyperliquid integration is in progress for major digital assets, alongside exploring Bitcoin, Ethereum and additional cryptocurrencies and other liquidity-provider APIs beyond the existing Solana / Jupiter route.",
    dependsOn: "Validated asset routes, network compatibility, liquidity coverage and provider API testing.",
  },
  {
    phase: 4,
    headline: "Grow partners and payout coverage.",
    highlights: ["Circle & Tether talks", "Business onboarding", "New markets"],
    title: "Partnerships and market expansion",
    status: "proposed",
    summary:
      "Pursue future partnership opportunities with Circle and Tether, evaluate stablecoin-related APIs, and grow business onboarding and payout coverage. These relationships are planned, not confirmed.",
    dependsOn: "Provider agreements, API access and compliance readiness for each market.",
  },
  {
    phase: 5,
    headline: "A global crypto-to-bank payout network.",
    highlights: ["B2B payout APIs", "Remittance use cases", "Wider blockchains"],
    title: "Global payout ecosystem",
    status: "proposed",
    summary:
      "Explore B2B payout APIs, remittance use cases, wider blockchain support and a larger strategic partner network.",
    dependsOn: "Scalable infrastructure and the required regulatory permissions.",
  },
];

export const ROADMAP_NOTE =
  "A milestone-led roadmap. Solana / Jupiter is integrated and Hyperliquid integration is in progress; Phase 1 remains in test mode. Additional asset routes, provider APIs and Circle / Tether partnership opportunities are planned, not current capabilities or confirmed relationships. No delivery dates are committed.";

/** What works today (test mode: Solana devnet + partner sandbox, no real funds). */
export const CURRENT_FLOW = [
  { title: "Supported Solana assets", detail: "SOL, USDC and supported SPL tokens" },
  { title: "Jupiter-powered swap", detail: "Only when needed; live quotes in test mode" },
  { title: "USDC", detail: "Payout-ready, in your own wallet" },
  { title: "Verified bank payout", detail: "Licensed partner, own or beneficiary account" },
] as const;

/** Future exploration only: none of these are current capabilities. */
export const FUTURE_EXPLORATION = [
  {
    title: "More cryptocurrencies & networks",
    detail: "Explore Bitcoin, Ethereum and additional cryptocurrencies beyond today's Solana route. Each asset and network needs its own validated intake and conversion path.",
  },
  {
    title: "Hyperliquid integration",
    detail: "Integration in progress: a liquidity route for major digital assets alongside the live Solana / Jupiter route. Hyperliquid trading, deposits and withdrawals remain disabled.",
  },
  {
    title: "Additional provider APIs",
    detail: "Evaluate and connect further conversion and liquidity-provider APIs as coverage expands, while preserving the existing Jupiter integration.",
  },
  {
    title: "Circle partnership opportunities",
    detail: "Pursue a future relationship with Circle and evaluate relevant stablecoin services and APIs. No direct partnership or integration is confirmed.",
  },
  {
    title: "Tether partnership opportunities",
    detail: "Pursue a future relationship with Tether and explore additional stablecoin support. No partnership, integration or new payment asset is confirmed.",
  },
  {
    title: "Broader payments ecosystem",
    detail: "Explore more fiat corridors, business payment APIs and remittance use cases, while continuing discussions with businesses ready to adopt LamportPay.",
  },
] as const;
