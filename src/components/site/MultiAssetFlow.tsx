import { ArrowDown } from "lucide-react";

const businessFlow = [
  "User wallet",
  "Supported digital asset",
  "Asset / network detection",
  "Appropriate conversion route",
  "USDC settlement asset",
  "Liquidity / fiat conversion",
  "Local currency",
  "Bank / local payment rail",
];

const routes = [
  {
    status: "Live",
    live: true,
    steps: ["Solana / SPL assets", "Jupiter integration", "USDC"],
    note: "Current live route. SOL, SPL tokens and supported Solana ecosystem assets.",
  },
  {
    status: "Planned",
    live: false,
    steps: ["Major digital assets", "Hyperliquid integration (planned)", "USDC"],
    note: "In development. Not live; these assets are not yet depositable.",
  },
];

/** Multi-asset business workflow: crypto → USDC settlement → local fiat. */
export function MultiAssetFlow() {
  return (
    <section className="mt-10 grid md:grid-cols-[1fr_1.2fr] gap-6" aria-labelledby="multi-asset-flow">
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <h2 id="multi-asset-flow" className="text-sm font-semibold">
          LamportPay payment flow
        </h2>
        <ol className="mt-3 space-y-1.5">
          {businessFlow.map((s, i) => (
            <li key={s} className="text-sm">
              <div className="rounded-xl border border-border/60 bg-secondary/40 px-3 py-2">{s}</div>
              {i < businessFlow.length - 1 && (
                <ArrowDown className="w-3.5 h-3.5 mx-auto my-1 text-muted-foreground" aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">
          Jupiter and Hyperliquid sit in the conversion layer only. LamportPay orchestrates the
          flow; local payout runs through Stables and remains disabled in this demo.
        </p>
      </div>
      <div className="space-y-4">
        {routes.map((r) => (
          <div
            key={r.status}
            className={
              "rounded-2xl border bg-card p-5 " +
              (r.live ? "border-[color:var(--success)]/30" : "border-border/60")
            }
          >
            <div
              className={
                "text-[11px] font-semibold uppercase tracking-wider " +
                (r.live ? "text-[color:var(--success)]" : "text-muted-foreground")
              }
            >
              {r.status} conversion route
            </div>
            <div className="mt-2 font-semibold text-sm">{r.steps.join(" → ")}</div>
            <p className="mt-1 text-xs text-muted-foreground">{r.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
