import { ArrowDown } from "lucide-react";

const majorAssets = ["BTC", "ETH", "USDT", "USDC", "+ Major assets"];
const solanaAssets = ["SOL", "SPL tokens", "Solana ecosystem"];

function Node({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-border/60 bg-card/80 backdrop-blur px-4 py-2.5 text-sm font-semibold text-center ${className}`}
    >
      {children}
    </div>
  );
}

function Down() {
  return <ArrowDown className="w-4 h-4 mx-auto my-1.5 text-primary" aria-hidden />;
}

/** Homepage multi-asset architecture: two intake ecosystems → two conversion routes → USDC → local payout. */
export function AssetFlowDiagram() {
  return (
    <section aria-labelledby="asset-flow-title" className="max-w-5xl mx-auto px-5 -mt-10 md:-mt-16 mb-16">
      <h2 id="asset-flow-title" className="sr-only">
        LamportPay multi-asset payment architecture
      </h2>
      <div className="rounded-3xl border border-primary/25 bg-card/70 backdrop-blur p-5 md:p-8 shadow-[var(--shadow-soft)]">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Major digital assets · Planned
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {majorAssets.map((a) => (
                <span key={a} className="rounded-full border border-border px-2.5 py-1 text-xs font-mono">
                  {a}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[color:var(--success)]/30 bg-secondary/40 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--success)]">
              Supported Solana ecosystem assets · Live
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {solanaAssets.map((a) => (
                <span key={a} className="rounded-full border border-border px-2.5 py-1 text-xs font-mono">
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
        <Down />
        <Node className="max-w-sm mx-auto border-primary/40">LamportPay · Asset + network detection</Node>
        <Down />
        <div className="grid grid-cols-2 gap-4">
          <Node>
            Hyperliquid integration
            <div className="text-[11px] font-normal text-muted-foreground">In development · not live</div>
          </Node>
          <Node className="border-[color:var(--success)]/40">
            Jupiter
            <div className="text-[11px] font-normal text-muted-foreground">Live for Solana / SPL assets</div>
          </Node>
        </div>
        <Down />
        <Node className="max-w-xs mx-auto">USDC settlement</Node>
        <Down />
        <Node className="max-w-xs mx-auto">Fiat conversion → Local currency</Node>
        <Down />
        <Node className="max-w-xs mx-auto">
          Bank / local payment rail
          <div className="text-[11px] font-normal text-muted-foreground">Via Stables · disabled in demo</div>
        </Node>
        <p className="mt-5 text-xs text-muted-foreground text-center max-w-2xl mx-auto">
          Live today: Solana / SPL assets → Jupiter → USDC, returned to your connected wallet. Major
          digital assets are not yet depositable; the Hyperliquid integration is in development. Fiat
          payout is disabled until production approval.
        </p>
      </div>
    </section>
  );
}
