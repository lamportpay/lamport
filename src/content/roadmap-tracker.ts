/**
 * Phase-by-phase delivery tracker for the public /roadmap page and its PDF.
 * Browser-safe. Status words are public: done / current / next / planned.
 * Planned phases are intentions, not confirmed partnerships or capabilities.
 */
export type TrackerStatus = "done" | "current" | "planned";

export type TrackerPhase = {
  phase: number;
  title: string;
  status: TrackerStatus;
  stage: "Build" | "Launch" | "Growth";
  summary: string;
  items: { label: string; done: boolean }[];
};

export const TRACKER_PHASES: TrackerPhase[] = [
  {
    phase: 1,
    title: "Product core",
    status: "done",
    stage: "Build",
    summary: "Defined the product: crypto in, local money out — non-custodial, one simple fee.",
    items: [
      { label: "Business model and 2% fee model", done: true },
      { label: "Non-custodial payment design", done: true },
      { label: "Licensed payout partner selected (Stables)", done: true },
    ],
  },
  {
    phase: 2,
    title: "Infrastructure",
    status: "done",
    stage: "Build",
    summary: "Set up the database, server logic and cloud hosting the platform runs on.",
    items: [
      { label: "SQL (Postgres) database designed by the team", done: true },
      { label: "Node.js server logic, webhooks and reconciliation", done: true },
      { label: "Cloud hosting, test and live mode separation", done: true },
    ],
  },
  {
    phase: 3,
    title: "Planning and architecture",
    status: "done",
    stage: "Build",
    summary: "Mapped every payment step, every phase gate and every compliance hand-off.",
    items: [
      { label: "Phase plan with gates per phase", done: true },
      { label: "Payment journey and status model", done: true },
      { label: "Security and data-handling rules", done: true },
    ],
  },
  {
    phase: 4,
    title: "Frontend and app",
    status: "done",
    stage: "Build",
    summary: "Built the website, the payment app and the admin tools.",
    items: [
      { label: "Marketing website and docs", done: true },
      { label: "Payment app with wallet sign-in", done: true },
      { label: "Admin dashboard for operations", done: true },
    ],
  },
  {
    phase: 5,
    title: "Payment engine",
    status: "done",
    stage: "Build",
    summary: "The engine that quotes, records fees and tracks each payment to the bank.",
    items: [
      { label: "Quotes, fee calculation and fee ledger", done: true },
      { label: "Payment tracking and live status sync", done: true },
      { label: "Append-only audit log", done: true },
    ],
  },
  {
    phase: 6,
    title: "Testing",
    status: "done",
    stage: "Build",
    summary: "Ran the full journey end to end in the partner sandbox with no real funds.",
    items: [
      { label: "Sandbox payouts: US, UK, IN, PH", done: true },
      { label: "Automated tests and CI checks", done: true },
      { label: "Error and recovery cases", done: true },
    ],
  },
  {
    phase: 7,
    title: "Integrations",
    status: "done",
    stage: "Build",
    summary: "Connected the partners that move value from wallet to bank.",
    items: [
      { label: "Solana wallets (USDC, SOL)", done: true },
      { label: "Jupiter swap quotes", done: true },
      { label: "Stables payout and hosted verification (sandbox)", done: true },
    ],
  },
  {
    phase: 8,
    title: "Security review and go-live",
    status: "current",
    stage: "Launch",
    summary: "Core security controls are built. This phase funds a full independent audit, penetration testing and hardening before a controlled mainnet launch.",
    items: [
      { label: "Non-custodial: we never hold funds or keys", done: true },
      { label: "Signed webhooks and one-time wallet signatures", done: true },
      { label: "Admin sign-in with password + email code", done: true },
      { label: "Security scans passed, no critical issues", done: true },
      { label: "Independent external security audit", done: false },
      { label: "Penetration testing and hardening", done: false },
      { label: "Monitoring, alerting and incident response", done: false },
      { label: "Solana mainnet launch and Stables production payouts", done: false },
    ],
  },
  {
    phase: 9,
    title: "Marketing and go-to-market",
    status: "planned",
    stage: "Launch",
    summary: "Reach the first real users, then grow with content, community and partners.",
    items: [
      { label: "Website, blog and FAQs live", done: true },
      { label: "Colosseum hackathon submission", done: true },
      { label: "Company channels live on X and LinkedIn", done: true },
      { label: "First users from our own network", done: false },
      { label: "Community campaigns on X, Telegram, Discord", done: false },
      { label: "Content, SEO and creator partnerships", done: false },
      { label: "Referral rewards and targeted ads", done: false },
    ],
  },
  {
    phase: 10,
    title: "Liquidity and asset integrations",
    status: "planned",
    stage: "Growth",
    summary: "Accept more assets through more liquidity. Hyperliquid work has started.",
    items: [
      { label: "Hyperliquid liquidity route (in progress)", done: false },
      { label: "Bitcoin, Ethereum and major cryptocurrencies", done: false },
      { label: "More liquidity-provider APIs", done: false },
    ],
  },
  {
    phase: 11,
    title: "Automation and security systems",
    status: "planned",
    stage: "Growth",
    summary: "The systems that run the platform safely every day: automation, data rules and controls.",
    items: [
      { label: "Database access rules on every table", done: true },
      { label: "Tamper-proof audit log and fee ledger", done: true },
      { label: "Rate limits and emergency payment controls", done: true },
      { label: "Automated secret and dependency scans", done: true },
      { label: "Automatic payment status sync and reconciliation", done: true },
      { label: "Free Ask AI assistant (Lammy) for customer questions", done: true },
      { label: "Complaints routed to the admin dashboard", done: true },
      { label: "Automatic email and in-app payment updates", done: false },
      { label: "Daily reports and alerts for operations", done: false },
    ],
  },
  {
    phase: 12,
    title: "Partnerships and market expansion",
    status: "planned",
    stage: "Growth",
    summary: "More partners and more countries. Not confirmed yet.",
    items: [
      { label: "Circle and Tether partnership talks", done: false },
      { label: "More payout API providers", done: false },
      { label: "New countries such as Nigeria and Pakistan", done: false },
      { label: "Regional payout partner network across six regions", done: false },
    ],
  },
  {
    phase: 13,
    title: "Global payout ecosystem",
    status: "planned",
    stage: "Growth",
    summary: "A worldwide crypto-to-bank network for people and businesses.",
    items: [
      { label: "Remittance for families and workers", done: false },
      { label: "B2B payouts for businesses", done: false },
      { label: "All major cryptocurrencies, more chains and mobile", done: false },
    ],
  },
];

export const TRACKER_STATUS_LABEL: Record<TrackerStatus, string> = {
  done: "Done",
  current: "In progress",
  planned: "Planned",
};
