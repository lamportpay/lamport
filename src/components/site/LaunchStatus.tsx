import { Rocket } from "lucide-react";

/**
 * Launch status banner: shown at the very top of every marketing page.
 * Public, factual wording only — security/testing status and planned launch,
 * no live payout or KYC claims.
 */
export function LaunchStatus() {
  return (
    <div role="status" className="launch-status">
      <span className="launch-status-dot" aria-hidden />
      <span className="launch-status-pill" aria-hidden>
        <Rocket className="h-3.5 w-3.5" />
        Going live soon
      </span>
      <p className="launch-status-text">
        Security and testing are almost complete — the platform is built and we
        are going live as soon as possible.
      </p>
    </div>
  );
}
