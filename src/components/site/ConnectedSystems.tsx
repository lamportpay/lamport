import { useEffect, useRef, useState } from "react";
import { ArrowDown, Check, Landmark, LockKeyhole, Network, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FUTURE_EXPLORATION } from "@/content/roadmap";

const branches = [
  {
    name: "Solana · Jupiter",
    status: "LIVE QUOTES",
    detail:
      "The existing Solana route. Jupiter supplies live prices; TEST MODE does not execute mainnet swaps.",
    note: "Existing quote infrastructure",
    planned: false,
  },
  {
    name: "Hyperliquid",
    status: "PLANNED",
    detail: FUTURE_EXPLORATION[1].detail,
    note: "Integration pending · Disabled",
    planned: true,
  },
  {
    name: "Future asset routes",
    status: "PLANNED",
    detail: FUTURE_EXPLORATION[0].detail,
    note: "Intake & conversion under evaluation",
    planned: true,
  },
];

export function ConnectedSystems() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const active = branches[selected] ?? branches[0];
  return (
    <section
      ref={ref}
      data-visible={visible}
      id="infrastructure"
      className="connected-systems home-section border-b border-border"
    >
      <div className="home-container">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="home-eyebrow">The infrastructure behind the journey</p>
            <h2 className="home-heading">Clear roles. Connected systems.</h2>
          </div>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-home-brand" />
            Every new route must pass validation
          </span>
        </div>
        <div className="mt-9 flex flex-col items-center">
          <div className="flex w-full max-w-sm items-center gap-4 rounded-lg border border-home-brand bg-home-tint p-5">
            <Network className="size-7 shrink-0 text-home-brand" />
            <div>
              <p className="font-semibold">LamportPay</p>
              <p className="mt-1 text-xs text-muted-foreground">
                One workspace · Your wallet stays yours
              </p>
            </div>
          </div>
          <div className="system-trunk h-8 w-px bg-home-brand/40" aria-hidden="true" />
          <div className="system-branches relative grid w-full gap-6 md:grid-cols-3">
            {branches.map((branch, index) => (
              <div className="system-branch relative" key={branch.name}>
                <Button
                  variant="outline"
                  aria-pressed={selected === index}
                  onClick={() => setSelected(index)}
                  className={`h-32 w-full flex-col items-start whitespace-normal rounded-lg p-5 text-left shadow-none ${selected === index ? "border-home-brand bg-home-tint" : "bg-card"}`}
                >
                  <span className="flex w-full items-center justify-between">
                    <span className="text-[10px] font-semibold text-home-brand">
                      {branch.status}
                    </span>
                    {branch.planned ? <LockKeyhole /> : <Check />}
                  </span>
                  <span className="mt-2 text-lg font-semibold">{branch.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">{branch.note}</span>
                </Button>
              </div>
            ))}
          </div>
          <div className="system-trunk flex h-10 items-center text-home-brand" aria-hidden="true">
            <ArrowDown className="size-4" />
          </div>
          <div className="grid w-full gap-6 border-y border-border py-5 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <img src="/tokens/usdc.svg" alt="" width={28} height={28} />
              <div>
                <p className="text-sm font-semibold">USDC settlement</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Single-use deposit · Non-custodial
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-6 text-home-brand" />
              <div>
                <p className="text-sm font-semibold">Stables</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  DEMO / SIMULATED · Payout infrastructure
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Landmark className="size-6 text-home-brand" />
              <div>
                <p className="text-sm font-semibold">Local bank account</p>
                <p className="mt-1 text-xs text-muted-foreground">Fiat payout DISABLED</p>
              </div>
            </div>
          </div>
        </div>
        <div aria-live="polite" className="mt-5 grid gap-2 text-sm md:grid-cols-[200px_1fr]">
          <p className="font-semibold">{active.name}</p>
          <p className="leading-relaxed text-muted-foreground">{active.detail}</p>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          Dashed connections are PLANNED, not active payment routes. Hyperliquid trading, deposits
          and withdrawals are disabled. Technology providers are not investors or guarantors;
          production KYC and fiat payouts remain disabled.
        </p>
      </div>
    </section>
  );
}
