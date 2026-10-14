import { Landmark, Network, ShieldCheck, Layers3, Coins } from "lucide-react";
import { FlowControls, FlowScene } from "@/components/site/FlowPresentation";
import { useFlowPlayback } from "@/hooks/use-flow-playback";
import { FUTURE_EXPLORATION } from "@/content/roadmap";
import { VerificationJourney } from "@/components/site/VerificationJourney";

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
  const flow = useFlowPlayback(branches.length);
  const selected = flow.active;
  const active = branches[selected] ?? branches[0];
  const sceneNodes = branches.map((branch, index) => ({ title: branch.name, label: branch.status, planned: branch.planned, icon: [Coins, Layers3, Network][index] ?? Network }));
  return (
    <section
      id="infrastructure"
      className="connected-systems home-section relative isolate overflow-hidden border-b border-border"
    >
      <div className="home-orbits home-orbits-corner-right" aria-hidden="true">
        <span className="home-orbit home-orbit-outer" />
        <span className="home-orbit home-orbit-middle" />
        <span className="home-orbit home-orbit-inner" />
      </div>
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
        <div ref={flow.ref} {...flow.focusProps} data-running={flow.inView && flow.playing && !flow.reduced} className="flow-presentation mt-8 grid overflow-hidden rounded-lg border border-border">
          <div className="flow-spotlight p-6 sm:p-8">
            <FlowControls flow={flow} count={branches.length} label="connected systems" />
            <div key={selected} className="flow-detail">
              <p className="text-xs font-semibold text-home-brand">{active.status}</p>
              <p className="mt-7 font-mono text-5xl font-semibold text-home-brand/30">0{selected + 1}</p>
              <h3 className="mt-3 text-2xl font-semibold text-home-ink">{active.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{active.detail}</p>
              <p className="mt-4 text-xs font-medium text-home-brand">{active.note}</p>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 border-b border-border bg-home-tint px-6 py-5">
              <Network className="size-6 text-home-brand" />
              <div><p className="font-semibold">LamportPay</p><p className="mt-1 text-xs text-muted-foreground">One workspace · Your wallet stays yours</p></div>
            </div>
            <FlowScene nodes={sceneNodes} flow={flow} branching label="Infrastructure: existing Solana and Jupiter quotes, planned Hyperliquid and future asset routes" />
          </div>
        </div>
        <div className="mt-6 grid gap-5 border-y border-border py-5 md:grid-cols-3">
          <div className="flex items-center gap-3"><img src="/tokens/usdc.svg" alt="" width="28" height="28" /><div><p className="text-sm font-semibold">USDC settlement</p><p className="mt-1 text-xs text-muted-foreground">Single-use deposit · Non-custodial</p></div></div>
          <div className="flex items-center gap-3"><ShieldCheck className="size-6 text-home-brand" /><div><p className="text-sm font-semibold">Stables</p><p className="mt-1 text-xs text-muted-foreground">DEMO / SIMULATED · Payout infrastructure</p></div></div>
          <div className="flex items-center gap-3"><Landmark className="size-6 text-home-brand" /><div><p className="text-sm font-semibold">Local bank account</p><p className="mt-1 text-xs text-muted-foreground">Fiat payout DISABLED</p></div></div>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          Dashed connections are PLANNED, not active payment routes. Hyperliquid trading, deposits
          and withdrawals are disabled. Technology providers are not investors or guarantors;
          production KYC and fiat payouts remain disabled.
        </p>
        <VerificationJourney compact />
      </div>
    </section>
  );
}
