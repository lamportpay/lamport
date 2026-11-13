/** Company news (separate from the educational blog). Shared by the top news bar, /news and /news/$slug. */
export type NewsLink = { label: string; href: string; external?: boolean };
export type NewsItem = {
  slug: string;
  tag: string;
  title: string;
  headline: string; // short line for the top news bar
  summary: string;
  published: string; // ISO date
  keywords: string[];
  body: { heading?: string; paragraphs?: string[]; bullets?: string[] }[];
  links: NewsLink[];
};

export const COLOSSEUM_URL = "https://colosseum.com/arena/projects/lamportpay";

export const NEWS: NewsItem[] = [
  {
    slug: "lamportpay-is-live",
    tag: "Launch",
    title: "LamportPay is live",
    headline: "LamportPay is live: send USDC from your wallet to a bank account.",
    summary:
      "LamportPay now runs on Solana mainnet. Payments use real USDC from the customer's own wallet, and bank payouts go through our licensed payout partner Stables.",
    published: "2026-11-12",
    keywords: ["LamportPay live", "USDC to bank", "Solana stablecoin payout", "crypto to bank payout", "non-custodial payments"],
    body: [
      {
        paragraphs: [
          "LamportPay is live on Solana mainnet. You connect your own wallet, see a quote with every fee shown, approve one transaction, and the payout partner Stables pays the money out to the bank account.",
          "LamportPay stays non-custodial: funds go from your wallet straight to the partner's single-use deposit address, and LamportPay never holds keys or balances.",
        ],
      },
      {
        heading: "What you can do today",
        bullets: [
          "Send USDC on Solana to a bank account, or pay with SOL and convert it in the same flow",
          "See the LamportPay fee, the partner's fees and the amount received before you approve",
          "Follow every payment until the partner reports it complete",
          "Trade on Hyperliquid (spot) from your own wallet on the Trade page",
        ],
      },
      {
        heading: "Good to know",
        bullets: [
          "The minimum is 15 USDC per payment; the partner's limits decide the maximum",
          "Available countries depend on the partner's approval and are shown in the app",
          "Identity verification runs once, on Stables' hosted page",
        ],
      },
    ],
    links: [
      { label: "Send a payment", href: "/pay" },
      { label: "How a payout works", href: "/how-it-works" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    slug: "lamportpay-going-live",
    tag: "Launch",
    title: "LamportPay prepares for launch",
    headline: "October update: how LamportPay prepared for launch.",
    summary:
      "The LamportPay website is live and the payment flow is built and tested in the sandbox (no real funds yet). We launch as soon as the final security phase is complete. The first 10 early-access users pay no LamportPay fee.",
    published: "2026-10-15",
    keywords: ["LamportPay mainnet", "crypto to bank payout", "Solana stablecoin payout", "USDC to bank", "early access"],
    body: [
      {
        paragraphs: [
          "LamportPay converts USDC on Solana into a payout to a local bank account, through our payout partner Stables. The full payment flow is built and tested end to end on Solana devnet and our partner's sandbox; it has not yet run with real funds.",
          "The next milestone is launch. As soon as our final security phase — independent audit, penetration testing and hardening — is complete, LamportPay goes live, starting with a controlled rollout.",
        ],
      },
      {
        heading: "What is already done",
        bullets: [
          "Product core, infrastructure, frontend and payment engine built by our in-house team",
          "Non-custodial design — funds move from the customer's own wallet, LamportPay holds no keys or balances",
          "Database access rules on every table, signed webhooks and one-time wallet signatures",
          "Admin sign-in with password plus emailed code, tamper-proof audit log and fee ledger",
          "Rate limits, emergency payment controls and automatic payment status sync",
          "Automated secret and dependency scans, with security scans passing",
          "Full payment flow tested end to end in the sandbox, from wallet to bank payout (no real funds yet)",
        ],
      },
      {
        heading: "What happens next",
        bullets: [
          "A dedicated security phase: independent external audit, penetration testing and hardening",
          "Launch: live payments open to everyone, starting with a controlled rollout",
          "More assets, partners and chains — see the roadmap",
        ],
      },
      {
        heading: "Early access: no LamportPay fee",
        paragraphs: [
          "The first 10 people who join early access pay no LamportPay fee — our 2% fee is waived for them. Payout partner and network costs still apply. Join from the popup on our website.",
        ],
      },
    ],
    links: [
      { label: "See the full roadmap", href: "/roadmap" },
      { label: "How a payout works", href: "/how-it-works" },
      { label: "Security and technology", href: "/technology" },
      { label: "Fees", href: "/fees" },
    ],
  },
  {
    slug: "lamportpay-colosseum-arena",
    tag: "Colosseum",
    title: "LamportPay is submitted to Colosseum Arena",
    headline: "LamportPay is submitted to Colosseum Arena — view the project page.",
    summary:
      "We submitted LamportPay to the Colosseum Arena, the Solana hackathon and accelerator programme. The project page is live; the decision is pending.",
    published: "2026-10-10",
    keywords: ["Colosseum Arena", "Solana hackathon", "LamportPay Colosseum", "Solana payments project"],
    body: [
      {
        paragraphs: [
          "LamportPay has been submitted to Colosseum Arena. Colosseum runs the Solana ecosystem's hackathons and accelerator, and its Arena lists the projects taking part.",
          "Our submission presents LamportPay as a non-custodial way to send stablecoins from a Solana wallet to a local bank account, with transparent fees and a clear payment journey.",
        ],
      },
      {
        heading: "Review the project",
        paragraphs: [
          "Judges and visitors can see the project page on Colosseum, and explore the product, roadmap and technology on this website. The decision is pending.",
        ],
      },
    ],
    links: [
      { label: "LamportPay on Colosseum Arena", href: COLOSSEUM_URL, external: true },
      { label: "Roadmap", href: "/roadmap" },
      { label: "Technology", href: "/technology" },
      { label: "About us", href: "/about" },
    ],
  },
];

export const getNews = (slug: string) => NEWS.find((n) => n.slug === slug);
export const formatNewsDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
