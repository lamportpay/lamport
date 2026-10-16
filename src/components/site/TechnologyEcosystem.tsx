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
import { cn } from "@/lib/utils";

type Status = "LIVE" | "SANDBOX" | "IN DEVELOPMENT" | "PLANNED";
type Partner = { name: string; status: Status; role: string; logo?: string; icon?: LucideIcon };

const LOGO_FILES = import.meta.glob<{ url: string }>("@/assets/logos/*.asset.json", { eager: true, import: "default" });
const L = (file: string) => Object.entries(LOGO_FILES).find(([k]) => k.endsWith(`/${file}.asset.json`))?.[1].url;

const PARTNERS: Partner[] = [
  { name: "Solana", status: "LIVE", role: "Network support (SOL / SPL)", logo: L("solana.png") },
  { name: "Jupiter", status: "LIVE", role: "Liquidity & swap quotes", logo: L("jupiter-exchange-solana.png") },
  { name: "Stables", status: "SANDBOX", role: "Payout infrastructure", logo: "/partners/stables.svg" },
  { name: "Hyperliquid", status: "IN DEVELOPMENT", role: "Multi-asset liquidity", logo: L("hyperliquid.jpg") },
  { name: "Chainalysis", status: "PLANNED", role: "Compliance & risk monitoring", logo: L("chainalysis.png") },
  { name: "Fireblocks", status: "PLANNED", role: "Institutional wallet infrastructure", logo: L("fireblocks.png") },
  { name: "Circle", status: "PLANNED", role: "USDC infrastructure", logo: L("usd-coin.png") },
  { name: "Ethereum", status: "PLANNED", role: "Network support (ETH / ERC-20)", logo: L("ethereum.png") },
  { name: "USDT", status: "PLANNED", role: "Network support (USDT)", logo: L("tether.png") },
  { name: "BNB Chain", status: "PLANNED", role: "Network support (BNB / BEP-20)", logo: L("binancecoin.png") },
  { name: "Uniswap", status: "PLANNED", role: "DEX integration", logo: L("uniswap.png") },
  { name: "1inch", status: "PLANNED", role: "DEX aggregation", logo: L("1inch.jpg") },
  { name: "Arbitrum", status: "PLANNED", role: "Network support (ARB)", logo: L("arbitrum.jpg") },
  { name: "Polygon", status: "PLANNED", role: "Network support (POL)", logo: L("polygon-ecosystem-token.png") },
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

const NETWORKS = [
  { name: "Solana", logo: L("solana.png") },
  { name: "Ethereum", logo: L("ethereum.png") },
  { name: "BNB Chain", logo: L("binancecoin.png") },
  { name: "Polygon", logo: L("polygon-ecosystem-token.png") },
  { name: "Arbitrum", logo: L("arbitrum.jpg") },
  { name: "Base", logo: L("base.svg") },
  { name: "Avalanche", logo: L("avalanche-2.png") },
];
const DEXS = [
  { name: "Jupiter", logo: L("jupiter-exchange-solana.png") },
  { name: "Raydium", logo: L("raydium.jpg") },
  { name: "Orca", logo: L("orca.png") },
  { name: "Uniswap", logo: L("uniswap.png") },
  { name: "1inch", logo: L("1inch.jpg") },
  { name: "Curve", logo: L("curve-dao-token.png") },
  { name: "Balancer", logo: L("balancer.png") },
];

function LogoRow({ title, items, reverse }: { title: string; items: { name: string; logo?: string }[]; reverse?: boolean }) {
  const row = (dup: boolean) =>
    items.map((i) => (
      <li key={(dup ? "d-" : "") + i.name} aria-hidden={dup || undefined} className="tech-eco-pill">
        <img src={i.logo} alt="" width="44" height="44" loading="lazy" className="size-11 rounded-full object-contain" />
        <span>{i.name}</span>
      </li>
    ));
  return (
    <div className="mt-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="tech-eco-marquee mt-3">
        <ul className={cn("tech-eco-marquee-track", reverse && "tech-eco-marquee-reverse")}>
          {row(false)}
          {row(true)}
        </ul>
      </div>
    </div>
  );
}

function Card({ p, hidden }: { p: Partner; hidden?: boolean }) {
  const Icon = p.icon;
  return (
    <li aria-hidden={hidden || undefined} className="tech-eco-card">
      <div className="flex items-center gap-3">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-home-surface">
          {p.logo ? (
            <img src={p.logo} alt="" width="48" height="48" loading="lazy" className="size-12 rounded-full object-contain" />
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

        <LogoRow title="Blockchain & Settlement Networks" items={NETWORKS} />
        <LogoRow title="Decentralized Exchanges & Liquidity" items={DEXS} reverse />
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Networks and liquidity venues are shown as part of LamportPay’s expanding technology ecosystem. Availability depends on route, asset and integration status.
        </p>

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
