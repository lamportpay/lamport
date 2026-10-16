import { Bitcoin, Layers, ScanSearch, ShieldCheck, Coins, Landmark, Banknote, Building2, Check, X, Info, Network, ArrowRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Status = "LIVE" | "PLANNED" | "IN DEVELOPMENT" | "SANDBOX";

function Badge({ s }: { s: Status }) {
  const cls =
    s === "LIVE"
      ? "border-success/40 bg-success/10 text-success"
      : s === "SANDBOX"
        ? "border-warning/50 bg-warning/15 text-foreground"
        : "border-primary/30 bg-primary/10 text-primary";
  return (
    <span className={`shrink-0 whitespace-nowrap rounded-full border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide ${cls}`}>
      {s}
    </span>
  );
}

function Ticks({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1">
      {items.map((i) => (
        <li key={i} className="flex gap-1.5">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
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

type StepDef = { n: string; title: string; icon: ReactNode; body: ReactNode };

const STEPS: StepDef[] = [
  {
    n: "01",
    title: "Supported digital assets",
    icon: <Coins className="h-4 w-4" />,
    body: (
      <ul className="space-y-1.5">
        {ASSETS.map((a) => (
          <li key={a.name} className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border px-2 py-1.5">
            {a.logo ? (
              <img src={a.logo} alt="" width={18} height={18} className="h-[18px] w-[18px] shrink-0 rounded-full" />
            ) : a.name.startsWith("Bitcoin") ? (
              <Bitcoin className="h-[18px] w-[18px] shrink-0 text-warning" />
            ) : (
              <Layers className="h-[18px] w-[18px] shrink-0 text-primary" />
            )}
            <span className="min-w-0 flex-1 text-[11.5px] leading-tight text-card-foreground">{a.name}</span>
            <Badge s={a.s} />
          </li>
        ))}
      </ul>
    ),
  },
  {
    n: "02",
    title: "Asset & Network Detection",
    icon: <ScanSearch className="h-4 w-4" />,
    body: (
      <>
        <p className="mb-2 font-medium text-card-foreground">Identify asset → network → best available route</p>
        <Ticks items={["Identify asset and network", "Check available liquidity", "Find the best route", "Compare live FX rates", "Lowest total cost"]} />
      </>
    ),
  },
  {
    n: "03",
    title: "Liquidity & Conversion Route",
    icon: <Network className="h-4 w-4" />,
    body: (
      <div className="space-y-2">
        <div className="rounded-lg border border-success/40 p-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <img src="/logos/jupiter-exchange-solana.png" alt="" width={16} height={16} className="h-4 w-4 rounded-full" />
            <span className="flex-1 font-semibold text-card-foreground">Jupiter</span>
            <Badge s="LIVE" />
          </div>
          <p className="mt-1">Solana liquidity</p>
          <p>Solana / SPL assets → Jupiter → USDC</p>
          <p className="mt-1 text-[10.5px] font-medium text-success">Live FX rate · Deep liquidity · Low cost</p>
        </div>
        <div className="rounded-lg border border-border p-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <img src="/logos/hyperliquid.jpg" alt="" width={16} height={16} className="h-4 w-4 rounded-full" />
            <span className="flex-1 font-semibold text-card-foreground">Hyperliquid</span>
            <Badge s="IN DEVELOPMENT" />
          </div>
          <p className="mt-1">Multi-asset liquidity</p>
          <p>Major assets → Hyperliquid → USDC</p>
        </div>
        <div className="rounded-lg border border-dashed border-border p-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex-1 font-semibold text-card-foreground">Other chains & DEXs</span>
            <Badge s="PLANNED" />
          </div>
          <p className="mt-1">More chains and leading DEXs being integrated</p>
        </div>
      </div>
    ),
  },
  {
    n: "04",
    title: "Identity Check (KYC)",
    icon: <ShieldCheck className="h-4 w-4" />,
    body: (
      <>
        <p className="mb-2">Verify sender and recipient (where required)</p>
        <div className="maf-pass rounded-lg border border-success/40 bg-success/10 p-2">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-success">
            <Check className="h-3.5 w-3.5" /> KYC PASSED
          </p>
          <p className="mt-0.5">→ Continue to settlement</p>
        </div>
        <div className="maf-fail mt-2 rounded-lg border border-dashed border-destructive/60 bg-destructive/5 p-2">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-destructive">
            <X className="h-3.5 w-3.5" /> KYC FAILED
          </p>
          <p className="mt-0.5">→ Funds returned to client's original wallet at the applicable live rate</p>
        </div>
      </>
    ),
  },
  {
    n: "05",
    title: "USDC Settlement",
    icon: <img src="/logos/usd-coin.png" alt="" width={16} height={16} className="h-4 w-4 rounded-full" />,
    body: (
      <>
        <p className="mb-2 font-medium text-card-foreground">Common settlement asset</p>
        <Ticks items={["Fast settlement", "Low network fees", "Non-custodial"]} />
      </>
    ),
  },
  {
    n: "06",
    title: "Licensed Payout Partner",
    icon: <Building2 className="h-4 w-4" />,
    body: (
      <>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <img src="/partners/stables.svg" alt="" width={16} height={16} className="h-4 w-4" />
          <span className="flex-1 font-semibold text-card-foreground">Stables</span>
          <Badge s="SANDBOX" />
        </div>
        <p>Stables payout infrastructure</p>
        <p className="mt-2 font-medium text-card-foreground">Additional licensed/regional payout partners being integrated</p>
      </>
    ),
  },
  {
    n: "07",
    title: "Local Currency",
    icon: <Banknote className="h-4 w-4" />,
    body: (
      <>
        <p className="mb-2 font-medium text-card-foreground">USDC → local currency</p>
        <Ticks items={["Live FX rates", "Transparent total cost", "Expanding currencies"]} />
      </>
    ),
  },
  {
    n: "08",
    title: "Recipient Bank Account",
    icon: <Landmark className="h-4 w-4" />,
    body: (
      <>
        <p className="mb-2 font-medium text-card-foreground">Local fiat payout to recipient</p>
        <Ticks items={["Fast delivery", "Secure and compliant", "Growing country coverage"]} />
      </>
    ),
  },
];

export function MultiAssetFlow() {
  const [selected, setSelected] = useState(1);
  const step = STEPS[selected];
  if (!step) return null;
  return (
    <section aria-labelledby="maf-title" className="maf bg-muted/30 py-20">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">The infrastructure behind the journey</p>
        <h2 id="maf-title" className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          Multi-asset in. Local currency out.
        </h2>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground sm:text-lg">
          LamportPay connects digital assets to the right liquidity and payout route, with Solana/Jupiter live today and
          additional routes being integrated.
        </p>

        <div className="mt-10 grid items-center gap-6 lg:grid-cols-[1fr_2rem_1.15fr_2rem_1fr]">
          <div className="min-w-0">
            <p className="mb-4 text-xs font-semibold uppercase text-muted-foreground">01 / Digital assets in</p>
            <ul className="space-y-2">
              {ASSETS.map((asset) => (
                <li key={asset.name} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  {asset.logo ? <img src={asset.logo} alt="" className="h-7 w-7 shrink-0 object-contain" /> : asset.name.startsWith("Bitcoin") ? <Bitcoin className="h-7 w-7 shrink-0 text-warning" /> : <Layers className="h-7 w-7 shrink-0 text-primary" />}
                  <span className="min-w-0 flex-1 text-xs font-medium text-card-foreground">{asset.name}</span>
                  <Badge s={asset.s} />
                </li>
              ))}
            </ul>
          </div>
          <ArrowRight className="mx-auto h-6 w-6 rotate-90 text-primary lg:rotate-0" aria-hidden="true" />
          <div className="maf-hub flex min-h-64 flex-col items-center justify-center px-5 py-8 text-center">
            <Network className="mb-4 h-9 w-9 text-primary" />
            <h3 className="text-3xl font-bold text-foreground">LamportPay</h3>
            <p className="mt-2 text-sm text-muted-foreground">Detect · Route · Verify · Settle</p>
            <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-primary">
              <img src="/logos/usd-coin.png" alt="" className="h-6 w-6" /> USDC settlement
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><img src="/logos/jupiter-exchange-solana.png" alt="" className="h-5 w-5" /> Jupiter</span>
              <span className="flex items-center gap-1.5"><img src="/partners/stables.svg" alt="" className="h-5 w-5" /> Stables <Badge s="SANDBOX" /></span>
            </div>
          </div>
          <ArrowRight className="mx-auto h-6 w-6 rotate-90 text-primary lg:rotate-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="mb-4 text-xs font-semibold uppercase text-muted-foreground">08 / Local money out</p>
            <ul className="space-y-2">
              {[["USD", "United States"], ["GBP", "United Kingdom"], ["INR", "India"], ["PHP", "Philippines"]].map(([currency, country]) => (
                <li key={currency} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <span className="w-10 shrink-0 text-sm font-bold text-primary">{currency}</span>
                  <span className="min-w-0 flex-1 text-xs text-card-foreground">{country}</span>
                  <Badge s="SANDBOX" />
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Landmark className="h-4 w-4" /> Recipient bank account</p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 border-t border-border py-6 md:grid-cols-[0.8fr_1.2fr]">
          <div id="maf-detail" aria-live="polite" className="min-h-72 min-w-0">
            <p className="text-xs font-semibold text-primary">THE JOURNEY / {step.n} OF 08</p>
            <h3 className="mt-3 flex items-center gap-2 text-xl font-semibold text-foreground">{step.icon}{step.title}</h3>
            <div className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">{step.body}</div>
          </div>
          <div className="grid content-start grid-cols-2 gap-2" role="group" aria-label="Payment journey steps">
            {STEPS.map((item, index) => (
              <Button key={item.n} aria-pressed={selected === index} aria-controls="maf-detail" variant={selected === index ? "default" : "outline"} onClick={() => setSelected(index)} className="h-auto min-h-16 justify-start whitespace-normal px-3 py-3 text-left">
                <span className="shrink-0 text-xs opacity-70">{item.n}</span>
                <span className="text-xs leading-snug">{item.title}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-2 flex gap-3 border-t border-border pt-5 text-sm text-muted-foreground">
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
