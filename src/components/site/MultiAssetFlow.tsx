import { Bitcoin, Layers, ScanSearch, ShieldCheck, Coins, Landmark, Banknote, Building2, Check, X, Info, Network } from "lucide-react";
import type { ReactNode } from "react";

type Status = "LIVE" | "PLANNED" | "IN DEVELOPMENT" | "SANDBOX";

function Badge({ s }: { s: Status }) {
  const cls =
    s === "LIVE"
      ? "border-success/40 bg-success/10 text-success"
      : s === "SANDBOX"
        ? "border-warning/50 bg-warning/15 text-foreground"
        : "border-primary/30 bg-primary/10 text-primary";
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${cls}`}>
      {s}
    </span>
  );
}

function Step({ n, title, icon, children }: { n: string; title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="maf-step relative flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {n}
        </span>
        <span className="text-primary">{icon}</span>
      </div>
      <h3 className="mb-3 text-base font-semibold leading-snug text-card-foreground">{title}</h3>
      <div className="flex-1 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

function Ticks({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((i) => (
        <li key={i} className="flex gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}

const ASSETS: { name: string; s: Status; logo?: string }[] = [
  { name: "Bitcoin (BTC)", s: "PLANNED" },
  { name: "Ethereum (ETH)", s: "PLANNED", logo: "/logos/ethereum.png" },
  { name: "Stablecoins (USDT / USDC)", s: "PLANNED", logo: "/logos/tether.png" },
  { name: "Solana assets (SOL / SPL)", s: "LIVE", logo: "/logos/solana.png" },
  { name: "Other major assets and networks", s: "PLANNED" },
];

export function MultiAssetFlow() {
  return (
    <section aria-labelledby="maf-title" className="maf bg-background py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">The infrastructure behind the journey</p>
        <h2 id="maf-title" className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          Multi-asset in. Local currency out.
        </h2>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground sm:text-lg">
          LamportPay connects digital assets to the right liquidity and payout route, with Solana/Jupiter live today and
          additional routes being integrated.
        </p>

        {/* Return path banner (KYC failure) */}
        <div className="maf-return mt-10 hidden items-center gap-3 text-xs font-medium text-destructive lg:flex" aria-hidden="true">
          <span>← 01</span>
          <span className="maf-return-line relative h-0 flex-1 border-t-2 border-dashed border-destructive/70" />
          <span>Funds returned to original wallet (live rate) ← 04 KYC failed</span>
        </div>

        <ol className="maf-grid mt-4 grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-2 lg:grid-cols-4">
          <li className="contents">
            <Step n="01" title="Supported digital assets" icon={<Coins className="h-5 w-5" />}>
              <ul className="space-y-2">
                {ASSETS.map((a) => (
                  <li key={a.name} className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-2">
                    {a.logo ? (
                      <img src={a.logo} alt="" width={22} height={22} className="h-[22px] w-[22px] shrink-0 rounded-full" />
                    ) : a.name.startsWith("Bitcoin") ? (
                      <Bitcoin className="h-[22px] w-[22px] shrink-0 text-warning" />
                    ) : (
                      <Layers className="h-[22px] w-[22px] shrink-0 text-primary" />
                    )}
                    <span className="min-w-0 flex-1 text-[13px] leading-tight text-card-foreground">{a.name}</span>
                    <Badge s={a.s} />
                  </li>
                ))}
              </ul>
            </Step>
          </li>
          <li className="contents">
            <Step n="02" title="Asset & Network Detection" icon={<ScanSearch className="h-5 w-5" />}>
              <p className="mb-3 font-medium text-card-foreground">Identify asset → network → best available route</p>
              <Ticks items={["Identify asset and network", "Check available liquidity", "Find the best route", "Compare live FX rates", "Lowest total cost"]} />
            </Step>
          </li>
          <li className="contents">
            <Step n="03" title="Liquidity & Conversion Route" icon={<Network className="h-5 w-5" />}>
              <div className="space-y-2.5">
                <div className="rounded-lg border border-success/40 p-3">
                  <div className="flex items-center gap-2">
                    <img src="/logos/jupiter-exchange-solana.png" alt="" width={20} height={20} className="h-5 w-5 rounded-full" />
                    <span className="flex-1 font-semibold text-card-foreground">Jupiter</span>
                    <Badge s="LIVE" />
                  </div>
                  <p className="mt-1 text-xs">Solana liquidity · Solana / SPL assets → Jupiter → USDC</p>
                  <p className="mt-1 text-[11px] font-medium text-success">Live FX rate · Deep liquidity · Low cost</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <img src="/logos/hyperliquid.jpg" alt="" width={20} height={20} className="h-5 w-5 rounded-full" />
                    <span className="flex-1 font-semibold text-card-foreground">Hyperliquid</span>
                    <Badge s="IN DEVELOPMENT" />
                  </div>
                  <p className="mt-1 text-xs">Multi-asset liquidity · Major assets → Hyperliquid → USDC</p>
                </div>
                <div className="rounded-lg border border-dashed border-border p-3">
                  <div className="flex items-center gap-2">
                    <span className="flex-1 font-semibold text-card-foreground">Other chains & DEXs</span>
                    <Badge s="PLANNED" />
                  </div>
                  <p className="mt-1 text-xs">More chains and leading DEXs being integrated</p>
                </div>
              </div>
            </Step>
          </li>
          <li className="contents">
            <Step n="04" title="Identity Check (KYC)" icon={<ShieldCheck className="h-5 w-5" />}>
              <p className="mb-3">Verify sender and recipient (where required)</p>
              <div className="maf-pass rounded-lg border border-success/40 bg-success/10 p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-success">
                  <Check className="h-4 w-4" /> KYC PASSED
                </p>
                <p className="mt-1 text-xs">→ Continue to settlement</p>
              </div>
              <div className="mt-2.5 rounded-lg border border-dashed border-destructive/60 bg-destructive/5 p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                  <X className="h-4 w-4" /> KYC FAILED
                </p>
                <p className="mt-1 text-xs">→ Funds returned to client's original wallet at the applicable live rate</p>
              </div>
            </Step>
          </li>
          <li className="contents">
            <Step n="05" title="USDC Settlement" icon={<img src="/logos/usd-coin.png" alt="" width={20} height={20} className="h-5 w-5 rounded-full" />}>
              <p className="mb-3 font-medium text-card-foreground">Common settlement asset</p>
              <Ticks items={["Fast settlement", "Low network fees", "Non-custodial"]} />
            </Step>
          </li>
          <li className="contents">
            <Step n="06" title="Licensed Payout Partner" icon={<Building2 className="h-5 w-5" />}>
              <div className="mb-3 flex items-center gap-2">
                <img src="/partners/stables.svg" alt="" width={20} height={20} className="h-5 w-5" />
                <span className="flex-1 font-semibold text-card-foreground">Stables</span>
                <Badge s="SANDBOX" />
              </div>
              <p>Stables payout infrastructure</p>
              <p className="mt-2 text-xs">Additional licensed/regional payout partners being integrated</p>
            </Step>
          </li>
          <li className="contents">
            <Step n="07" title="Local Currency" icon={<Banknote className="h-5 w-5" />}>
              <p className="mb-3 font-medium text-card-foreground">USDC → local currency</p>
              <Ticks items={["Live FX rates", "Transparent total cost", "Expanding currencies"]} />
            </Step>
          </li>
          <li className="contents">
            <Step n="08" title="Recipient Bank Account" icon={<Landmark className="h-5 w-5" />}>
              <p className="mb-3 font-medium text-card-foreground">Local fiat payout to recipient</p>
              <Ticks items={["Fast delivery", "Secure and compliant", "Growing country coverage"]} />
            </Step>
          </li>
        </ol>

        <div className="mt-8 flex gap-3 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            Solana / SPL assets are supported through the live Jupiter route. Additional asset and liquidity routes are being
            integrated. Hyperliquid trading and transfers remain disabled while integration is in development. Payouts through
            Stables run in sandbox.
          </p>
        </div>
      </div>
    </section>
  );
}
