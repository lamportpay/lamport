/**
 * "All in one" capability strip, shown directly under the hero.
 *
 * Nine outlined hexagons, one line icon each, with an uppercase label and a
 * capability pill. Every pill must use an approved label: LIVE,
 * DEMO / SIMULATED, DISABLED or PLANNED. Nothing here may claim a live bank
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
    key: "non-custodial",
    label: "Non-custodial",
    status: "live",
    title: "LamportPay never holds your funds, keys or balances.",
    icon: (
      <>
        <path d="M12 3.4 19 6v5.6c0 4-3 7-7 9-4-2-7-5-7-9V6z" />
        <circle cx="12" cy="10.4" r="1.9" />
        <path d="M12 12.3v3.1" />
      </>
    ),
  },
  {
    key: "crypto-in",
    label: "SOL / USDC in",
    status: "live",
    title: "Solana wallets connect and balances are read from the chain.",
    icon: (
      <>
        <ellipse cx="12" cy="6.6" rx="6.6" ry="2.8" />
        <path d="M5.4 6.6v4.2c0 1.6 2.9 2.8 6.6 2.8s6.6-1.2 6.6-2.8V6.6" />
        <path d="M5.4 11.2v4.2c0 1.6 2.9 2.8 6.6 2.8s6.6-1.2 6.6-2.8v-4.2" />
      </>
    ),
  },
  {
    key: "swap-quotes",
    label: "Live swap quotes",
    status: "live",
    title: "Jupiter quotes the real SOL to USDC price and network cost.",
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
    key: "bank-out",
    label: "Bank payouts out",
    status: "demo",
    title: "Local bank payouts run in the devnet / sandbox build.",
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
    label: "Hosted identity check",
    status: "demo",
    title: "Identity verification runs on the payout partner's hosted page, in sandbox.",
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
  },
  {
    key: "audit",
    label: "Audit trail",
    status: "live",
    title: "Every payment step and admin action is recorded and cannot be edited.",
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
    key: "hyperliquid",
    label: "Hyperliquid liquidity",
    status: "planned",
    title: "Hyperliquid liquidity is being integrated; not live or confirmed yet.",
    icon: (
      <>
        <path d="M8 5.6v12.8" />
        <rect x="6.4" y="8.6" width="3.2" height="5.4" rx="0.7" />
        <path d="M16 4.6v14.8" />
        <rect x="14.4" y="7.6" width="3.2" height="6.4" rx="0.7" />
      </>
    ),
  },
];

const STATUS_TEXT = {
  live: "Live",
  demo: "Demo / simulated",
  planned: "In progress",
} as const;

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
          <p className="home-eyebrow">What is wired up today</p>
          <h2 id="home-capabilities-heading" className="home-heading home-cap-heading">
            <span className="home-brand-text">All in one</span>
            <span className="home-cap-heading-dash"> — </span>
            <span className="home-cap-heading-ink">one connected payout</span>
          </h2>
        </div>

        <ul className="home-cap-grid" role="list">
          {CAPABILITIES.map((item) => (
            <li key={item.key} className="home-cap-item" title={item.title}>
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 64 72"
                className="home-cap-hex"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon
                  points="32,3 60,19 60,53 32,69 4,53 4,19"
                  stroke={STROKE}
                  strokeWidth="1.6"
                  className="home-cap-hex-shape"
                />
                <g transform="translate(17.6 21.6) scale(1.2)" stroke={STROKE} strokeWidth="1.3">
                  {item.icon}
                </g>
              </svg>
              <span className="home-cap-label">{item.label}</span>
              <span className={`home-cap-status home-cap-status--${item.status}`}>
                {STATUS_TEXT[item.status]}
              </span>
            </li>
          ))}
        </ul>

        <p className="home-cap-note">
          Live means the step works today. Demo / simulated means it runs on devnet or in the
          sandbox, where no real money moves. In progress means it is not finished.
        </p>
      </div>
    </section>
  );
}
