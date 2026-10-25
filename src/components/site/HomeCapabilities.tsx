/**
 * "All in one" capability strip, shown directly under the hero.
 *
 * Outlined hexagons, one line icon each, with an uppercase label and a
 * capability pill. Every pill must use an approved label: LIVE,
 * SANDBOX, DISABLED or PLANNED. Nothing here may claim a live bank
 * payout, real KYC or a confirmed partnership.
 */

import type { ReactNode } from "react";

type Capability = {
  key: string;
  label: string;
  status: "live" | "demo" | "planned";
  title: string;
  icon: ReactNode;
};

const STROKE = "url(#home-cap-stroke)";

const CAPABILITIES: Capability[] = [
  {
    key: "crypto-in",
    label: "Asset + network",
    status: "live",
    title: "Identify a supported asset and its blockchain. Only explicitly enabled assets can be used today; additional networks and assets are in development.",
    icon: (
      <>
        <ellipse cx="12" cy="6.6" rx="6.6" ry="2.8" />
        <path d="M5.4 6.6v4.2c0 1.6 2.9 2.8 6.6 2.8s6.6-1.2 6.6-2.8V6.6" />
        <path d="M5.4 11.2v4.2c0 1.6 2.9 2.8 6.6 2.8s6.6-1.2 6.6-2.8v-4.2" />
      </>
    ),
  },
  {
    key: "wallet-sign-in",
    label: "Wallet sign-in",
    status: "live",
    title: "One plain-text signature proves the wallet; no transaction, key or seed phrase.",
    icon: (
      <>
        <path d="M6.4 8.6a7.2 7.2 0 0 1 11.2 1.6" />
        <path d="M8.4 11.2a4.6 4.6 0 0 1 7.3 1.1" />
        <path d="M10.5 13.8a2 2 0 0 1 3.4.9" />
        <path d="M12.2 16.6c.4 1 .6 2 .7 3.1" />
        <path d="M8.9 18.7c-.5-1-.9-2-1-3.1" />
      </>
    ),
  },
  {
    key: "identity",
    label: "Identity check",
    status: "demo",
    title: "Identity verification runs on the payout partner's hosted page, in the sandbox build.",
    icon: (
      <>
        <rect x="3.4" y="6" width="17.2" height="12" rx="2.2" />
        <circle cx="8.6" cy="10.9" r="1.9" />
        <path d="M6 15.3c.7-1.4 4.5-1.4 5.2 0" />
        <path d="M13.6 10h4" />
        <path d="M13.6 13.2h3" />
      </>
    ),
  },
  {
    key: "route-selection",
    label: "Route selection",
    status: "live",
    title: "LamportPay identifies the enabled asset and network and selects the appropriate conversion route.",
    icon: (
      <>
        <path d="M5.2 4.4h13.6v15.2H5.2z" />
        <path d="M8 9h8" />
        <path d="M8 12.6h8" />
        <path d="M8 16.2h5" />
      </>
    ),
  },
  {
    key: "conversion",
    label: "Conversion",
    status: "live",
    title: "Solana / SPL assets → Jupiter → USDC: live quotes. Major digital assets → Hyperliquid → USDC: in progress, not enabled for deposits. Sandbox mode does not execute mainnet swaps.",
    icon: (
      <>
        <path d="M4 8.6h13" />
        <path d="M14 5.6l3 3-3 3" />
        <path d="M20 15.4H7" />
        <path d="M10 12.4l-3 3 3 3" />
      </>
    ),
  },
  {
    key: "usdc-settlement",
    label: "USDC settlement",
    status: "live",
    title: "USDC is the settlement asset for the selected route. Direct USDC skips conversion; no real funds move in the sandbox build.",
    icon: (
      <>
        <ellipse cx="12" cy="6.6" rx="6.6" ry="2.8" />
        <path d="M5.4 6.6v4.2c0 1.6 2.9 2.8 6.6 2.8s6.6-1.2 6.6-2.8V6.6" />
        <path d="M5.4 11.2v4.2c0 1.6 2.9 2.8 6.6 2.8s6.6-1.2 6.6-2.8v-4.2" />
      </>
    ),
  },
  {
    key: "bank-out",
    label: "Local currency payout",
    status: "demo",
    title: "USDC enters the Stables payout process for local-currency delivery. Bank payouts remain sandbox-only; no real money moves.",
    icon: (
      <>
        <path d="M4 10.4 12 5l8 5.4" />
        <path d="M5.6 10.6V18" />
        <path d="M9.5 10.6V18" />
        <path d="M14.5 10.6V18" />
        <path d="M18.4 10.6V18" />
        <path d="M3.4 18h17.2" />
      </>
    ),
  },

];

const FEE_FEATURE: Capability = {
    key: "one-fee",
    label: "One 2% fee",
    status: "live",
    title: "One LamportPay fee of 2% of the total you send, taken out of it.",
    icon: (
      <>
        <circle cx="12" cy="12" r="8.2" />
        <path d="M9 15l6-6" />
        <circle cx="9.6" cy="9.6" r="1.2" />
        <circle cx="14.4" cy="14.4" r="1.2" />
      </>
    ),
  };

const STATUS_TEXT = {
  live: "Live",
  demo: "Sandbox",
  planned: "In progress",
} as const;

function CapabilityItem({ item, index = 0 }: { item: Capability; index?: number }) {
  return (
    <li className={`home-cap-item${item.key === "one-fee" ? " home-cap-item--fee" : ""}`} title={item.title} style={{ ["--cap-i" as string]: index }}>
      <svg aria-hidden="true" focusable="false" viewBox="0 0 64 72" className="home-cap-hex" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="32,3 60,19 60,53 32,69 4,53 4,19" stroke={STROKE} strokeWidth="1.6" className="home-cap-hex-shape" />
        <g transform="translate(17.6 21.6) scale(1.2)" stroke={STROKE} strokeWidth="1.3">{item.icon}</g>
      </svg>
      <span className="home-cap-label">{item.label}</span>
      <span className={`home-cap-status home-cap-status--${item.status}`}>{STATUS_TEXT[item.status]}</span>
    </li>
  );
}

export function HomeCapabilities() {
  return (
    <section aria-labelledby="home-capabilities-heading" className="home-capabilities home-section">
      {/* Shared gradient for the hexagon strokes; referenced by id from every icon. */}
      <svg aria-hidden="true" focusable="false" width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="home-cap-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--home-cap-stroke-a)" />
            <stop offset="100%" stopColor="var(--home-cap-stroke-b)" />
          </linearGradient>
        </defs>
      </svg>

      <div className="home-container">
        <div className="text-center">
          <h2 id="home-capabilities-heading" className="home-heading home-cap-heading">
            <span className="home-brand-text">All in one</span>
            <span className="home-cap-heading-dash"> — </span>
            <span className="home-cap-heading-ink">one connected payout</span>
          </h2>
        </div>

        <ul className="home-cap-grid" role="list" tabIndex={0} aria-label="What LamportPay does">
          {[...CAPABILITIES, FEE_FEATURE].map((item, i) => <CapabilityItem key={item.key} item={item} index={i} />)}
        </ul>


        <p className="home-cap-note">
          <span>Live means the step works today</span>
          <span className="home-cap-note-sep" aria-hidden="true">·</span>
          <span>Sandbox means it runs in a test environment, where no real money moves</span>
          <span className="home-cap-note-sep" aria-hidden="true">·</span>
          <span>In progress means it is not finished</span>
        </p>
      </div>
    </section>
  );
}
