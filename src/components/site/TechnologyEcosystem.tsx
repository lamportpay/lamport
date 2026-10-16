import { useEffect, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Info,
  Layers,
  LineChart,
  Network,
  Repeat,
  ShieldCheck,
  Hexagon,
  type LucideIcon,
} from "lucide-react";
import bitcoin from "@/assets/tokens/bitcoin.png.asset.json";
import { cn } from "@/lib/utils";

type Status = "LIVE" | "SANDBOX" | "IN DEVELOPMENT" | "PLANNED";
type Partner = { name: string; status: Status; role: string; logo?: string; icon?: LucideIcon };

const PARTNERS: Partner[] = [
  { name: "Solana", status: "LIVE", role: "Network support (SOL / SPL)", logo: "/tokens/sol.svg" },
  { name: "Jupiter", status: "LIVE", role: "Liquidity & swap quotes", logo: "/partners/jupiter.svg" },
  { name: "Stables", status: "SANDBOX", role: "Payout infrastructure", logo: "/partners/stables.svg" },
  { name: "Hyperliquid", status: "IN DEVELOPMENT", role: "Multi-asset liquidity", logo: "/partners/hyperliquid.svg" },
  { name: "Circle", status: "PLANNED", role: "USDC infrastructure", logo: "/tokens/usdc.svg" },
  { name: "Ethereum", status: "PLANNED", role: "Network support (ETH / ERC-20)", logo: "/tokens/eth.svg" },
  { name: "Bitcoin", status: "PLANNED", role: "Network support (BTC)", logo: bitcoin.url },
  { name: "USDT", status: "PLANNED", role: "Stablecoin support", logo: "/tokens/usdt.svg" },
  { name: "BNB Chain", status: "PLANNED", role: "Network support (BEP-20)", icon: Hexagon },
  { name: "Uniswap", status: "PLANNED", role: "DEX integration", icon: Repeat },
  { name: "1inch", status: "PLANNED", role: "DEX aggregation", icon: Network },
  { name: "Other chains & DEXs", status: "PLANNED", role: "Additional routes coming", icon: Layers },
];

const TONE: Record<Status, string> = {
  LIVE: "bg-success/15 text-success",
  SANDBOX: "bg-warning/20 text-foreground",
  "IN DEVELOPMENT": "bg-home-brand/12 text-home-brand",
  PLANNED: "bg-muted text-muted-foreground",
};

const CAPABILITIES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Layers, title: "Multi-chain ready", text: "Expanding settlement rails across major blockchain networks." },
  { icon: LineChart, title: "Live FX routing", text: "Compare available liquidity and routes to seek competitive FX execution." },
  { icon: ShieldCheck, title: "Non-custodial by design", text: "Customer funds remain under customer control." },
  { icon: Building2, title: "Licensed payout infrastructure", text: "Connect to supported payout partners for local-currency delivery." },
];

function Card({ p, hidden }: { p: Partner; hidden?: boolean }) {
  const Icon = p.icon;
  return (
    <li aria-hidden={hidden || undefined} className="tech-eco-card">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-home-surface">
          {p.logo ? (
            <img src={p.logo} alt="" width="32" height="32" loading="lazy" className="size-8 object-contain" />
          ) : Icon ? (
            <Icon className="size-6 text-home-brand" strokeWidth={1.8} />
          ) : null}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">{p.name}</h3>
          <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide", TONE[p.status])}>
            {p.status}
          </span>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{p.role}</p>
    </li>
  );
}

export function TechnologyEcosystem() {
  const scroller = useRef<HTMLDivElement>(null);
  const paused = useRef(false);

  useEffect(() => {
    const el = scroller.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = performance.now();
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (!paused.current && visible) {
        el.scrollLeft += dt * 0.03;
        const half = el.scrollWidth / 2;
        if (el.scrollLeft >= half) el.scrollLeft -= half;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  const step = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const half = el.scrollWidth / 2;
    if (dir === -1 && el.scrollLeft < 240) el.scrollLeft += half;
    el.scrollBy({ left: dir * 240, behavior: "smooth" });
  };

  const hold = () => (paused.current = true);
  const release = () => (paused.current = false);

  return (
    <section id="technology-ecosystem" className="home-section border-t border-border bg-home-surface">
      <div className="home-container">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="home-eyebrow">Technology ecosystem</p>
            <h2 className="home-heading">
              The technology powering <span className="home-brand-text">LamportPay.</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Connected infrastructure across liquidity, settlement, compliance and payout.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" aria-label="Previous integrations" onClick={() => step(-1)} className="tech-eco-nav">
              <ArrowLeft className="size-4" />
            </button>
            <button type="button" aria-label="Next integrations" onClick={() => step(1)} className="tech-eco-nav tech-eco-nav-primary">
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>

        <div
          ref={scroller}
          className="tech-eco-scroller mt-8"
          onMouseEnter={hold}
          onMouseLeave={release}
          onTouchStart={hold}
          onTouchEnd={() => setTimeout(release, 2500)}
          onFocus={hold}
          onBlur={release}
          aria-label="Technology ecosystem integrations"
        >
          <ul className="flex w-max gap-4 py-2">
            {PARTNERS.map((p) => <Card key={p.name} p={p} />)}
            {PARTNERS.map((p) => <Card key={`d-${p.name}`} p={p} hidden />)}
          </ul>
        </div>

        <div className="tech-eco-usdc mt-8">
          <svg aria-hidden="true" className="tech-eco-lines" viewBox="0 0 600 160" preserveAspectRatio="none">
            <path d="M0 110 C120 40 220 150 340 80 S520 30 600 70" />
            <path d="M0 70 C140 130 260 30 380 100 S540 120 600 40" />
            <circle r="3"><animateMotion dur="14s" repeatCount="indefinite" path="M0 110 C120 40 220 150 340 80 S520 30 600 70" /></circle>
            <circle r="3"><animateMotion dur="18s" repeatCount="indefinite" path="M0 70 C140 130 260 30 380 100 S540 120 600 40" /></circle>
          </svg>
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
            <img src="/tokens/usdc.svg" alt="" width="64" height="64" className="size-16 shrink-0" />
            <div>
              <h3 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">USDC settlement infrastructure</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                USDC acts as the common settlement asset connecting supported digital-asset routes with payout infrastructure.
              </p>
            </div>
          </div>
          <ul className="relative mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-home-brand/10 text-home-brand">
                  <Icon className="size-5" strokeWidth={1.8} />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-5 flex items-start gap-2 rounded-xl border border-border bg-background px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-home-brand" />
          Integrations are shown for transparency and describe our technology ecosystem. They do not represent an endorsement or a confirmed commercial partnership unless stated.
        </p>
      </div>
    </section>
  );
}
