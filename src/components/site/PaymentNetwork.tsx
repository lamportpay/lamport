import {
  Coins,
  Landmark,
  Route,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { FlowControls, FlowScene, FlowSceneVertical } from "@/components/site/FlowPresentation";
import { useFlowPlayback } from "@/hooks/use-flow-playback";
import { PAYMENT_JOURNEY, PAYMENT_SAFETY } from "@/content/payment-flow";

const nodes = [
  {
    title: "Your wallet",
    label: "SOLANA",
    icon: Wallet,
    detail: PAYMENT_JOURNEY[0].detail,
    note: "You keep control of your keys.",
  },
  {
    title: "LamportPay",
    label: "PAYMENT WORKSPACE",
    icon: Route,
    detail: PAYMENT_JOURNEY[2].detail,
    note: "Amount, recipient and costs in one place.",
  },
  {
    title: "Jupiter → USDC",
    label: "LIVE QUOTES",
    icon: Coins,
    detail:
      "Jupiter supplies Solana swap quotes when conversion is needed. USDC skips conversion. The devnet / sandbox build does not execute mainnet swaps.",
    note: "Stablecoin settlement · Solana network",
  },
  {
    title: "Stables",
    label: "DEMO / SIMULATED",
    icon: ShieldCheck,
    detail: PAYMENT_JOURNEY[3].detail,
    note: "Hosted verification & payout infrastructure",
  },
  {
    title: "Bank account",
    label: "PAYOUT DISABLED",
    icon: Landmark,
    detail: PAYMENT_JOURNEY[6].detail,
    note: "Your own account or a beneficiary’s",
  },
];

export function PaymentNetwork() {
  const flow = useFlowPlayback(nodes.length);
  const selected = flow.active;
  const active = nodes[selected] ?? nodes[0];
  return (
    <section
      id="payment-network"
      className="payment-network home-section border-b border-border"
    >
      <div className="home-container">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="home-eyebrow">One connected payment journey</p>
            <h2 className="home-heading">From your wallet to their bank.</h2>
          </div>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-4 text-home-brand" /> Non-custodial by design
          </span>
        </div>
        <div ref={flow.ref} {...flow.focusProps} data-running={flow.inView && flow.playing && !flow.reduced} className="flow-presentation mt-8 grid overflow-hidden rounded-lg border border-border md:grid-cols-2">
          <div className="hidden md:block">
            <FlowSceneVertical nodes={nodes} flow={flow} label="Illustrative payment route: wallet, LamportPay, Jupiter, Stables, bank account" />
          </div>
          <div className="flow-spotlight p-6 sm:p-8">
            <div className="md:hidden">
              <FlowControls flow={flow} count={nodes.length} label="payment route" />
            </div>
            <div key={selected} className="flow-detail">
              <p className="text-xs font-semibold text-home-brand">PAYMENT ROUTE · DEMO / SIMULATED</p>
              <p className="mt-7 font-mono text-5xl font-semibold text-home-brand">0{selected + 1}</p>
              <h3 className="mt-3 text-2xl font-semibold text-home-ink">{active.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{active.detail}</p>
              <p className="mt-4 text-xs font-medium text-home-brand">{active.note}</p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border pt-5 text-xs font-medium">
              <span className="flex items-center gap-2"><img src="/tokens/sol.svg" alt="" width="24" height="24" />SOL · swap quotes</span>
              <span className="flex items-center gap-2"><img src="/tokens/usdc.svg" alt="" width="24" height="24" />USDC · direct</span>
            </div>
            <div className="mt-6 hidden md:block">
              <FlowControls flow={flow} count={nodes.length} label="payment route" />
            </div>
          </div>
          <div className="md:hidden">
            <FlowScene nodes={nodes} flow={flow} label="Illustrative payment route: wallet, LamportPay, Jupiter, Stables, bank account" />
          </div>
        </div>
        <div className="mt-5 text-xs text-muted-foreground">
          <span>Infrastructure integrations—not financial backing or bank endorsements.</span>
        </div>
        <details className="mt-3 text-xs text-muted-foreground">
          <summary className="cursor-pointer">Current operating mode</summary>
          <p className="mt-2 leading-relaxed">{PAYMENT_SAFETY}</p>
        </details>
      </div>
    </section>
  );
}
