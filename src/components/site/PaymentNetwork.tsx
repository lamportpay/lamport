import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, Check, Coins, Landmark, Route, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PAYMENT_JOURNEY, PAYMENT_SAFETY } from "@/content/payment-flow";

const nodes = [
  { title: "Your wallet", label: "SOLANA", icon: Wallet, detail: PAYMENT_JOURNEY[0].detail, note: "You keep control of your keys." },
  { title: "LamportPay", label: "PAYMENT WORKSPACE", icon: Route, detail: PAYMENT_JOURNEY[2].detail, note: "Amount, recipient and costs in one place." },
  { title: "Jupiter → USDC", label: "LIVE QUOTES", icon: Coins, detail: "Jupiter supplies Solana swap quotes when conversion is needed. USDC skips conversion. Payment TEST MODE does not execute mainnet swaps.", note: "Stablecoin settlement · Solana network" },
  { title: "Stables", label: "DEMO / SIMULATED", icon: ShieldCheck, detail: PAYMENT_JOURNEY[3].detail, note: "Hosted verification & payout infrastructure" },
  { title: "Bank account", label: "PAYOUT DISABLED", icon: Landmark, detail: PAYMENT_JOURNEY[6].detail, note: "Your own account or a beneficiary’s" },
];

export function PaymentNetwork() {
  const [selected, setSelected] = useState(1);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.2 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);
  const active = nodes[selected] ?? nodes[1];
  return (
    <section id="payment-network" ref={ref} data-visible={visible} className="payment-network home-section border-b border-border">
      <div className="home-container">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="home-eyebrow">One connected payment journey</p><h2 className="home-heading">From your wallet to their bank.</h2></div>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground"><ShieldCheck className="size-4 text-home-brand" /> Non-custodial by design</span>
        </div>
        <div className="network-inputs mt-8 flex items-center justify-center gap-3 text-sm">
          <span className="flex items-center gap-2"><img src="/tokens/sol.svg" alt="" width="22" height="22" /> SOL <span className="text-muted-foreground">via swap quotes</span></span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-2"><img src="/tokens/usdc.svg" alt="" width="22" height="22" /> USDC <span className="text-muted-foreground">direct route</span></span>
        </div>
        <div className="network-fork mx-auto mt-4 hidden h-6 w-64 border-x border-b border-home-brand/30 lg:block" aria-hidden="true"><span className="mx-auto mt-6 block h-5 w-px bg-home-brand/40" /></div>
        <ol className="network-tree mt-7 grid gap-7 lg:grid-cols-5 lg:gap-5" aria-label="Payment infrastructure workflow">
          {nodes.map(({ title, label, icon: Icon, note }, index) => (
            <li key={title} className="network-stage relative min-w-0">
              <Button variant="outline" aria-pressed={selected === index} onClick={() => setSelected(index)} className={`network-node h-auto w-full flex-col items-start whitespace-normal p-5 text-left shadow-none ${selected === index ? "border-home-brand bg-home-tint ring-1 ring-home-brand" : "bg-card"}`}>
                <span className="flex w-full items-center justify-between"><Icon className="size-6 text-home-brand" /><span className="font-mono text-xs text-muted-foreground">0{index + 1}</span></span>
                <span className="mt-3 text-[10px] font-semibold text-home-brand">{label}</span>
                <span className="text-base font-semibold">{title}</span>
                <span className="text-xs font-normal leading-relaxed text-muted-foreground">{note}</span>
              </Button>
              {index < nodes.length - 1 && <span aria-hidden="true" className="network-edge absolute -bottom-7 left-1/2 flex h-7 items-center text-home-brand lg:-right-5 lg:bottom-auto lg:left-auto lg:top-1/2 lg:w-5"><ArrowDown className="size-4 lg:hidden" /><ArrowRight className="hidden size-4 lg:block" /></span>}
            </li>
          ))}
        </ol>
        <div className="mt-6 grid gap-4 border-y border-border py-5 md:grid-cols-[200px_1fr]" aria-live="polite">
          <div className="flex items-center gap-2 text-sm font-semibold"><Check className="size-4 text-home-brand" />{active.title}</div>
          <p className="text-sm leading-relaxed text-muted-foreground">{active.detail}</p>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground"><span>Infrastructure integrations—not financial backing or bank endorsements.</span><span className="font-medium">Real bank payouts & production KYC: <span className="text-home-brand">DISABLED</span></span></div>
        <details className="mt-3 text-xs text-muted-foreground"><summary className="cursor-pointer">Current operating mode</summary><p className="mt-2 leading-relaxed">{PAYMENT_SAFETY}</p></details>
      </div>
    </section>
  );
}