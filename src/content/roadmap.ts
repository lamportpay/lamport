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
};

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    phase: 1,
    title: "Core product validation",
    status: "current",
    summary:
      "Validate the Solana wallet flow, Jupiter-powered swap, USDC quote, verification, payout sandbox, transaction tracking and receipt.",
    dependsOn: "End-to-end test results and a validated payment experience.",
  },
  {
    phase: 2,
    title: "Security and controlled launch",
    status: "proposed",
    summary:
      "Complete security reviews, confirm partner requirements, validate payout corridors and prepare production readiness.",
    dependsOn: "Security assessment, payout readiness and production safeguards.",
  },
  {
    phase: 3,
    title: "Liquidity and asset integrations",
    status: "proposed",
    summary:
      "Plan Hyperliquid integration for major digital assets, explore Bitcoin, Ethereum and additional cryptocurrencies, and evaluate other liquidity-provider APIs alongside the existing Solana / Jupiter route.",
    dependsOn: "Validated asset routes, network compatibility, liquidity coverage and provider API testing.",
  },
  {
    phase: 4,
    title: "Partnerships and market expansion",
    status: "proposed",
    summary:
      "Pursue future partnership opportunities with Circle and Tether, evaluate stablecoin-related APIs, and grow business onboarding and payout coverage. These relationships are planned, not confirmed.",
    dependsOn: "Provider agreements, API access and compliance readiness for each market.",
  },
  {
    phase: 5,
    title: "Global payout ecosystem",
    status: "proposed",
    summary:
      "Explore B2B payout APIs, remittance use cases, wider blockchain support and a larger strategic partner network.",
    dependsOn: "Scalable infrastructure and the required regulatory permissions.",
  },
];

export const ROADMAP_NOTE =
  "A milestone-led roadmap. Solana / Jupiter is integrated; Phase 1 remains in test mode. Hyperliquid, additional asset routes, provider APIs and Circle / Tether partnership opportunities are planned, not current capabilities or confirmed relationships. No delivery dates are committed.";

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
    detail: "Plan a future liquidity route for major digital assets alongside Solana / Jupiter. Hyperliquid trading, deposits and withdrawals remain disabled.",
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
