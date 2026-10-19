import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  Clock,
  CreditCard,
  DollarSign,
  Globe,
  Landmark,
  Lock,
  ShieldCheck,
  Shield,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HIGHLIGHTS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Shield, title: "No counterparty risk", text: "You keep control of your funds." },
  { icon: DollarSign, title: "Transparent pricing", text: "See the real rate and fees before you send." },
  { icon: Zap, title: "Fast & reliable payouts", text: "Fast settlement and payout where supported." },
  { icon: Globe, title: "Global coverage", text: "Expanding local payout coverage through our growing partner network." },
];

const COLUMNS: { icon: LucideIcon; name: string }[] = [
  { icon: Users, name: "P2P" },
  { icon: Building2, name: "Exchanges" },
  { icon: Landmark, name: "Traditional Remittances" },
];

type Cell = [ok: boolean, text: string];
const ROWS: { icon: LucideIcon; title: string; sub: string; cells: [Cell, Cell, Cell]; lp: string }[] = [
  { icon: Shield, title: "Counterparty risk", sub: "You don’t have to trust a stranger with your funds.", cells: [[false, "High risk"], [false, "Platform holds funds"], [false, "Pre-funding / agent risk"]], lp: "No counterparty" },
  { icon: DollarSign, title: "Fees & exchange rates", sub: "Costs shown before you approve.", cells: [[false, "Hidden spreads"], [false, "Trading & withdrawal fees"], [false, "High fees, wide rates"]], lp: "Transparent pricing" },
  { icon: Clock, title: "Speed", sub: "Get money to the recipient quickly.", cells: [[false, "Often delayed"], [false, "Withdrawal delays"], [false, "Slow (hours–days)"]], lp: "Fast settlement where supported" },
  { icon: CreditCard, title: "Local payout options", sub: "Bank payouts in local currency.", cells: [[false, "Limited"], [false, "Limited local options"], [false, "Limited, expensive"]], lp: "Expanding bank payout coverage" },
  { icon: ShieldCheck, title: "Compliance & security", sub: "Identity verification and monitoring.", cells: [[false, "Varies by user"], [false, "Account-level checks"], [true, "KYC required"]], lp: "Hosted verification via payout partner" },
  { icon: Lock, title: "Control of funds", sub: "Who holds your money along the way.", cells: [[false, "Can be frozen"], [false, "Can be frozen"], [false, "Can be reversed or held"]], lp: "Non-custodial (you control)" },
  { icon: Globe, title: "Global reach", sub: "Send to recipients in more places.", cells: [[false, "Varies by user"], [false, "Limited local options"], [false, "Limited corridors"]], lp: "Expanding global coverage" },
];

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setSeen(true);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen] as const;
}

const Mark = ({ ok }: { ok: boolean }) => (
  <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full", ok ? "bg-success text-primary-foreground" : "bg-destructive/10 text-destructive ring-1 ring-destructive/40")}>
    {ok ? <Check className="size-3" strokeWidth={3} /> : <X className="size-3" strokeWidth={3} />}
  </span>
);

export function HomeDifference() {
  const [ref, seen] = useInView<HTMLElement>();
  const reveal = (i: number) => ({
    className: cn("transition-all duration-700 ease-out motion-reduce:transition-none", seen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"),
    style: { transitionDelay: `${i * 70}ms` },
  });

  return (
    <section ref={ref} id="the-difference" aria-labelledby="difference-heading" className="home-section border-t border-border bg-background">
      <div className="home-container">
        <div {...reveal(0)}>
          <p className="home-eyebrow">The difference</p>
          <h2 id="difference-heading" className="home-heading max-w-4xl">
            A safer, faster and more reliable way <span className="home-brand-text">than P2P and the rest.</span>
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
            P2P, exchanges and traditional remittances come with real risks, hidden fees and limited access. LamportPay removes the counterparty, simplifies the flow and gets your money to the right person — anywhere in the world.
          </p>
        </div>

        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} {...reveal(i + 1)}>
              <div className="flex gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-home-brand/10 text-home-brand">
                  <Icon className="size-6" strokeWidth={1.8} />
                </span>
                <div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Desktop / tablet table */}
        <div {...reveal(5)} className={cn(reveal(5).className, "mt-10 hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:block")}>
          <table className="w-full table-fixed text-left text-xs lg:text-sm">
            <caption className="sr-only">Feature comparison of P2P, exchanges, traditional remittances and LamportPay</caption>
            <colgroup>
              <col className="w-[30%]" />
              <col /><col /><col />
              <col className="w-[22%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="p-5 align-middle">
                  <span className="block text-lg font-bold text-foreground lg:text-xl">Feature comparison</span>
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">How LamportPay compares to P2P, exchanges and traditional remittances.</span>
                </th>
                {COLUMNS.map(({ icon: Icon, name }) => (
                  <th key={name} scope="col" className="border-l border-border p-4 text-center font-semibold text-foreground">
                    <Icon className="mx-auto mb-1 size-5 text-home-brand" />
                    {name}
                  </th>
                ))}
                <th scope="col" className="difference-lp border-l border-border p-4 text-center text-base font-bold lg:text-lg">
                  <span className="home-brand-text">LamportPay</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(({ icon: Icon, title, sub, cells, lp }, i) => (
                <tr key={title} {...reveal(i + 6)} className={cn(reveal(i + 6).className, "border-b border-border last:border-0")}>
                  <th scope="row" className="p-4 font-normal">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-home-brand/10 text-home-brand"><Icon className="size-4" /></span>
                      <div>
                        <span className="block font-semibold text-foreground">{title}</span>
                        <span className="block text-xs text-muted-foreground">{sub}</span>
                      </div>
                    </div>
                  </th>
                  {cells.map(([ok, t], c) => (
                    <td key={c} className="border-l border-border p-3 text-muted-foreground">
                      <div className="flex items-center gap-2"><Mark ok={ok} />{t}</div>
                    </td>
                  ))}
                  <td className="difference-lp border-l border-border p-3 font-semibold text-foreground">
                    <div className="flex items-center gap-2"><Mark ok />{lp}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="mt-8 space-y-4 md:hidden">
          {ROWS.map(({ icon: Icon, title, sub, cells, lp }, i) => (
            <li key={title} {...reveal(i + 5)} className={cn(reveal(i + 5).className, "rounded-2xl border border-border bg-card p-4 shadow-sm")}>
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-home-brand/10 text-home-brand"><Icon className="size-4" /></span>
                <div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                {cells.map(([ok, t], c) => (
                  <div key={c} className="flex items-center justify-between gap-3">
                    <dt className="text-xs text-muted-foreground">{COLUMNS[c].name}</dt>
                    <dd className="flex items-center gap-2 text-right text-muted-foreground">{t}<Mark ok={ok} /></dd>
                  </div>
                ))}
                <div className="difference-lp -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2">
                  <dt className="text-xs font-bold home-brand-text">LamportPay</dt>
                  <dd className="flex items-center gap-2 text-right font-semibold text-foreground">{lp}<Mark ok /></dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>

        <div {...reveal(14)} className={cn(reveal(14).className, "mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between")}>
          <div className="flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-home-brand/10 text-home-brand"><BarChart3 className="size-6" /></span>
            <div>
              <h3 className="text-lg font-bold text-foreground">The result</h3>
              <p className="text-sm text-muted-foreground">Lower counterparty risk. Transparent costs. Faster settlement. Expanding global reach.</p>
            </div>
          </div>
          <Button asChild size="lg" className="shrink-0 bg-home-brand text-primary-foreground hover:bg-home-brand/90">
            <Link to="/pay">Open App <ArrowRight /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
