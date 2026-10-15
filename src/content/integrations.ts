// Shared, browser-safe content for the Partners and Technology pages.
// Status labels follow the approved set: LIVE, SANDBOX/SIMULATED, IN PROGRESS, PLANNED.

export type IntegrationStatus = "Live" | "Sandbox" | "In progress" | "Planned";

export type IntegrationItem = {
  name: string;
  role: string;
  status: IntegrationStatus;
  detail: string;
  points?: string[];
  href?: string;
};

export const licensedPartner: IntegrationItem = {
  name: "Stables",
  role: "Licensed payout & identity partner",
  status: "Sandbox",
  href: "https://stables.money",
  detail:
    "Stables is LamportPay's licensed payout partner. Identity verification (KYC) runs on Stables' hosted page, and Stables converts stablecoins and pays out to local bank accounts. LamportPay never holds customer funds or keys.",
  points: [
    "Hosted identity verification — LamportPay stores only a link and a status",
    "Single-use deposit address for every transfer",
    "Bank account validation and local-currency payout",
    "Currently connected to the Stables sandbox; real payouts start after production approval",
  ],
};

export const integrationPartners: IntegrationItem[] = [
  {
    name: "Solana",
    role: "Settlement network",
    status: "Live",
    href: "https://solana.com",
    detail:
      "Payments start from the customer's own Solana wallet (Phantom, Solflare and others). Wallet sign-in uses a one-time message signature — never a transaction, key or seed phrase.",
  },
  {
    name: "Jupiter",
    role: "SOL → USDC swap quotes",
    status: "Live",
    href: "https://jup.ag",
    detail:
      "Jupiter provides live SOL → USDC prices and swap quotes. In the current devnet build, quotes are read-only; swap execution is switched off until production.",
  },
  {
    name: "Hyperliquid",
    role: "Liquidity",
    status: "In progress",
    href: "https://hyperliquid.xyz",
    detail:
      "We are building a Solana + Hyperliquid route for deeper liquidity. This work is in progress and not available to customers yet.",
  },
  {
    name: "Circle (USDC)",
    role: "Stablecoin",
    status: "Live",
    href: "https://www.circle.com",
    detail:
      "LamportPay accepts USDC on Solana today. A direct partnership with Circle is planned and not yet confirmed.",
  },
  {
    name: "Tether (USDT)",
    role: "Stablecoin",
    status: "Planned",
    href: "https://tether.to",
    detail: "USDT on Solana support is prepared in the code but switched off for now.",
  },
];

export const techStack: { group: string; items: IntegrationItem[] }[] = [
  {
    group: "Application",
    items: [
      {
        name: "TypeScript",
        role: "Language",
        status: "Live",
        detail: "The whole platform — website, app and server — is written in strictly typed TypeScript.",
      },
      {
        name: "React & TanStack Start",
        role: "Web framework",
        status: "Live",
        detail: "Server-rendered React pages with type-safe routing and server functions.",
      },
      {
        name: "Tailwind CSS",
        role: "Design system",
        status: "Live",
        detail: "One shared design system for the website, the app and the admin console.",
      },
    ],
  },
  {
    group: "Data & infrastructure",
    items: [
      {
        name: "SQL (Postgres)",
        role: "Database",
        status: "Live",
        detail:
          "Our database is designed and written in SQL by our own team. Payment records, accounts and the admin audit log live in Postgres with row-level security, and the audit log is append-only.",
      },
      {
        name: "Node.js",
        role: "Server runtime",
        status: "Live",
        detail:
          "Server-side logic — payment orchestration, webhooks, reconciliation and admin tooling — runs on Node.js.",
      },
      {
        name: "Cloud hosting",
        role: "Hosting",
        status: "Live",
        detail:
          "The website and app are hosted on managed cloud infrastructure today, with a planned move to AWS as we scale.",
      },
      {
        name: "AWS",
        role: "Future infrastructure",
        status: "Planned",
        detail: "Our roadmap includes migrating the platform's infrastructure to AWS.",
      },
      {
        name: "Resend",
        role: "Transactional email",
        status: "Planned",
        detail: "Payment receipts and account emails will be sent through Resend.",
      },
    ],
  },
  {
    group: "How we build",
    items: [
      {
        name: "In-house engineering team",
        role: "Core development",
        status: "Live",
        detail:
          "LamportPay's core platform — the payment engine, database design, security controls and integrations — is designed and built from scratch by our own developers.",
      },
      {
        name: "AI-assisted tooling",
        role: "Productivity & automation",
        status: "Live",
        detail:
          "Our team uses AI tools such as ChatGPT, Claude and Lovable to speed up coding, testing, automation and marketing. They assist our developers — the architecture, financial logic and security decisions are made and reviewed by the team.",
      },
    ],
  },
  {
    group: "Security & quality",
    items: [
      {
        name: "Svix-signed webhooks",
        role: "Partner events",
        status: "Live",
        detail: "Every payout status update from Stables is signature-checked before it is processed.",
      },
      {
        name: "GitHub Actions CI",
        role: "Automated checks",
        status: "Live",
        detail: "Type checks, linting, 500+ tests, secret scans and dependency audits on every change.",
      },
    ],
  },
];
