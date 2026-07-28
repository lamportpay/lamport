import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { TransferSimulator } from "@/components/site/TransferSimulator";
import { LiveRatesTicker, StatsStrip } from "@/components/site/LiveRates";
import { WorldPulse } from "@/components/site/WorldPulse";
import { LiveSwapTheater, HeroFloatingCards } from "@/components/site/LiveSwapTheater";
import { CitiesNeverSleep } from "@/components/site/CitiesNeverSleep";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Coins,
  FileText,
  Globe2,
  Sparkles,
  ShieldCheck,
  Zap,
  Info,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LamportPay — Crypto in. Local money out." },
      { name: "description", content: "Send crypto, recipient receives local currency. A Solana-first crypto-to-local-currency payment routing demo." },
      { property: "og:title", content: "LamportPay — Crypto in. Local money out." },
      { property: "og:description", content: "Solana-first crypto-to-local-currency payment routing demo." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <SiteLayout>
      <LiveRatesTicker />
      <Hero />
      <TrustStrip />
      <section className="max-w-7xl mx-auto px-5 -mt-4 md:-mt-10">
        <TransferSimulator />
      </section>
      <LiveSwapTheater />
      <section className="max-w-7xl mx-auto px-5 mt-16 md:mt-24">
        <StatsStrip />
      </section>
      <WorldPulse />
      <WhySection />
      <CitiesNeverSleep />
      <HowItWorksSection />
      <AIAssistant />
      <FeeExplainer />
      <SafetyAssistant />
      <FinalCTA />
    </SiteLayout>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 md:pt-24 pb-24 md:pb-32">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-uv opacity-70" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] rounded-full bg-[image:var(--gradient-hero)] opacity-20 blur-3xl animate-uv-pulse" />
        <div className="absolute top-1/3 left-10 w-72 h-72 rounded-full bg-[oklch(0.7_0.28_330)] opacity-15 blur-3xl animate-uv-pulse" />
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-[oklch(0.75_0.2_200)] opacity-15 blur-3xl animate-uv-pulse" />
      </div>
      <HeroFloatingCards />
      <div className="relative max-w-7xl mx-auto px-5 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/60 backdrop-blur px-4 py-1.5 text-xs font-medium text-muted-foreground mb-6 shadow-[0_0_30px_-8px_oklch(0.62_0.28_295_/_0.45)]">
          <span className="relative flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-[color:var(--success)] animate-live-dot" />
            <span className="relative rounded-full w-2 h-2 bg-[color:var(--success)]" />
          </span>
          <Sparkles className="w-3.5 h-3.5 text-primary" /> Solana-first routing · Live 24/7 · Best-rate engine
        </div>
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.03] max-w-4xl mx-auto">
          Send crypto.<br />
          <span className="text-uv">
            Recipient receives local currency.
          </span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          LamportPay helps users pay with supported crypto assets, settle through USDC, and route local-currency payout requests through licensed settlement partners.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/send" className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-hero)] text-white px-6 py-3 font-semibold shadow-[var(--shadow-elegant)] hover:opacity-95 transition">
            Start Demo Transfer <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/whitepaper" className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-6 py-3 font-semibold hover:bg-secondary transition">
            Read White Paper
          </Link>
          <Link to="/contact" className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-primary hover:bg-primary/5 transition">
            Join Waitlist
          </Link>
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    "Demo only",
    "No real crypto processed",
    "Partner-led KYC",
    "USDC settlement",
    "Bridge-first flow",
  ];
  return (
    <div className="max-w-7xl mx-auto px-5">
      <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur px-4 py-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs md:text-sm text-muted-foreground">
        {items.map((i, idx) => (
          <span key={i} className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> {i}
            {idx < items.length - 1 && <span className="hidden md:inline text-border">·</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

function WhySection() {
  const items = [
    { icon: Zap, title: "Fast crypto checkout", desc: "Pay in seconds using supported Solana assets or stablecoins." },
    { icon: Coins, title: "USDC settlement", desc: "Every transfer routes through USDC for stable, predictable value." },
    { icon: Globe2, title: "Bridge-first partner flow", desc: "Local-currency payout handled by Bridge as the first settlement partner." },
    { icon: Bot, title: "AI transfer assistant", desc: "Type what you want to send — the assistant sets up the transfer." },
    { icon: FileText, title: "Local-currency payouts", desc: "Support for bank, mobile wallet, card, and cash pickup corridors." },
    { icon: ShieldCheck, title: "Compliance-aware design", desc: "Partner-led KYC, no custody, no direct money transmission." },
  ];
  return (
    <section className="mt-32">
      <div className="max-w-7xl mx-auto px-5">
        <SectionHead eyebrow="Why LamportPay" title="Built for real-world payouts, not just crypto power users." />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl p-6 bg-card border border-border/60 hover:shadow-[var(--shadow-soft)] transition">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    "Choose crypto",
    "Get Bridge quote",
    "Complete partner KYC",
    "Settle through USDC",
    "Bridge processes payout",
    "Track receipt",
  ];
  return (
    <section className="mt-32">
      <div className="max-w-7xl mx-auto px-5">
        <SectionHead eyebrow="How it works" title="Simple, transparent flow — from crypto to recipient." />
        <div className="mt-12 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          {steps.map((s, i) => (
            <div key={s} className="rounded-2xl p-5 bg-card border border-border/60 relative">
              <div className="text-xs font-semibold text-primary mb-2">Step {i + 1}</div>
              <div className="font-medium leading-snug">{s}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/how-it-works" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            See the full technical flow <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function AIAssistant() {
  const [input, setInput] = useState("I want to send 100 USDC to Pakistan.");
  const [result, setResult] = useState<null | {
    token: string; amount: string; country: string; currency: string; method: string;
  }>({ token: "USDC", amount: "100", country: "Pakistan", currency: "PKR", method: "Bank account" });

  function parse() {
    const amountMatch = input.match(/(\d+(?:\.\d+)?)/);
    const tokenMatch = input.match(/\b(USDC|USDT|SOL|JUP|RAY|PYTH|BONK)\b/i);
    const map: Record<string, [string, string]> = {
      pakistan: ["Pakistan", "PKR"], india: ["India", "INR"], nigeria: ["Nigeria", "NGN"],
      philippines: ["Philippines", "PHP"], mexico: ["Mexico", "MXN"], bangladesh: ["Bangladesh", "BDT"],
      egypt: ["Egypt", "EGP"], colombia: ["Colombia", "COP"], brazil: ["Brazil", "BRL"], peru: ["Peru", "PEN"],
    };
    const key = Object.keys(map).find((k) => input.toLowerCase().includes(k));
    const [country, currency] = key ? map[key] : ["Pakistan", "PKR"];
    setResult({
      token: (tokenMatch?.[1] ?? "USDC").toUpperCase(),
      amount: amountMatch?.[1] ?? "100",
      country, currency, method: "Bank account",
    });
  }

  return (
    <section className="mt-32">
      <div className="max-w-5xl mx-auto px-5">
        <SectionHead eyebrow="AI Transfer Assistant" title="Just tell it what you want to send." />
        <div className="mt-10 rounded-3xl border border-border/60 bg-card overflow-hidden shadow-[var(--shadow-soft)]">
          <div className="p-6 md:p-8 bg-[image:var(--gradient-card)] border-b border-border/60">
            <div className="flex gap-3 items-start">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={2}
                  className="w-full resize-none bg-transparent outline-none text-lg leading-relaxed"
                />
                <div className="flex justify-end">
                  <button onClick={parse} className="text-sm font-semibold px-4 py-2 rounded-full bg-foreground text-background hover:opacity-90 transition">
                    Ask assistant
                  </button>
                </div>
              </div>
            </div>
          </div>
          {result && (
            <div className="p-6 md:p-8 grid gap-3 md:grid-cols-2">
              <KV k="Token" v={result.token} />
              <KV k="Amount" v={result.amount} />
              <KV k="Receiver country" v={result.country} />
              <KV k="Receiver currency" v={result.currency} />
              <KV k="Suggested payout method" v={result.method} />
              <KV k="Partner" v="Bridge" />
              <div className="md:col-span-2 text-xs text-muted-foreground flex gap-1.5 items-center pt-2">
                <Info className="w-3.5 h-3.5" /> This is a demo suggestion only.
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-secondary/60 px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="font-semibold mt-0.5">{v}</div>
    </div>
  );
}

function FeeExplainer() {
  const rows = [
    { k: "Bridge fee", v: "A small fee (1% of amount, minimum $1) charged by our settlement partner Bridge for processing the local-currency payout." },
    { k: "LamportPay platform fee", v: "A flat 0.5% platform fee that keeps the service running and improving." },
    { k: "FX rate", v: "The demo mid-market rate used to convert USDC into the recipient's local currency." },
    { k: "Recipient amount", v: "What the recipient will receive after all fees and FX conversion, in their local currency." },
    { k: "Quote expiry", v: "Real quotes expire after a short window because rates move — demo quotes here are static." },
  ];
  return (
    <section className="mt-32">
      <div className="max-w-5xl mx-auto px-5">
        <SectionHead eyebrow="AI Fee Explainer" title="No surprises. Just plain-English fees." />
        <div className="mt-10 rounded-3xl border border-border/60 bg-card divide-y divide-border/60">
          {rows.map((r) => (
            <div key={r.k} className="p-6 md:flex md:gap-8 md:items-start">
              <div className="md:w-56 font-semibold">{r.k}</div>
              <div className="text-muted-foreground text-sm md:text-base leading-relaxed mt-1 md:mt-0">{r.v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SafetyAssistant() {
  const items = [
    "Never share your seed phrase.",
    "Crypto payments may be irreversible.",
    "KYC is handled by the licensed partner.",
    "Demo values are not live rates.",
  ];
  return (
    <section className="mt-32">
      <div className="max-w-5xl mx-auto px-5">
        <SectionHead eyebrow="Safety Assistant" title="Move money safely — a few reminders." />
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          {items.map((i) => (
            <div key={i} className="flex items-start gap-3 rounded-2xl p-5 bg-card border border-border/60">
              <AlertTriangle className="w-5 h-5 text-[color:var(--warning)] shrink-0 mt-0.5" />
              <div className="font-medium">{i}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="mt-32">
      <div className="max-w-6xl mx-auto px-5">
        <div className="rounded-3xl bg-[image:var(--gradient-hero)] text-white p-10 md:p-16 text-center shadow-[var(--shadow-elegant)]">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight max-w-2xl mx-auto">
            Try the demo. See crypto become local money.
          </h2>
          <p className="mt-4 text-white/85 max-w-xl mx-auto">
            Explore the full transfer flow — quote, mock KYC, settlement, and receipt — with realistic timing and fees.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link to="/send" className="inline-flex items-center gap-2 rounded-full bg-white text-primary px-6 py-3 font-semibold hover:bg-white/90 transition">
              Start demo transfer <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/30 text-white px-6 py-3 font-semibold hover:bg-white/20 transition">
              Join waitlist
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</div>
      <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">{title}</h2>
    </div>
  );
}
