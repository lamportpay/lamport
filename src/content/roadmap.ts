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
      "Explore additional liquidity providers, supported tokens, stablecoins and potential Bitcoin / Ethereum integration paths.",
    dependsOn: "Technical feasibility, liquidity coverage and supported asset routes.",
  },
  {
    phase: 4,
    title: "Partnerships and market expansion",
    status: "proposed",
    summary:
      "Develop payout-partner relationships, expand supported fiat currencies and countries, and explore integrations with relevant businesses and platforms.",
    dependsOn: "Payout coverage and local compliance requirements for each corridor.",
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
  "A milestone-led roadmap. Phase 1 is in test mode; later phases are planned. Timing depends on technical readiness, payout coverage and compliance requirements.";

/** What works today (test mode: Solana devnet + partner sandbox, no real funds). */
export const CURRENT_FLOW = [
  { title: "Supported Solana assets", detail: "SOL, USDC and supported SPL tokens" },
  { title: "Jupiter-powered swap", detail: "Only when needed; live quotes in test mode" },
  { title: "USDC", detail: "Payout-ready, in your own wallet" },
  { title: "Verified bank payout", detail: "Licensed partner, own or beneficiary account" },
] as const;

/** Future exploration only: none of these are current capabilities. */
export const FUTURE_EXPLORATION = [
  "Bitcoin",
  "Ethereum",
  "Additional chains",
  "More stablecoins",
  "Wider liquidity providers",
  "More fiat corridors",
  "B2B payout APIs",
  "Remittance use cases",
] as const;
