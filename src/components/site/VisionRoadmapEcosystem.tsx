import {
  ArrowRight,
  CheckCircle2,
  Compass,
  ChevronLeft,
  ChevronRight,
  Globe2,
  Handshake,
  Layers3,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Flag } from "@/components/app/Flag";
import { CURRENT_FLOW, FUTURE_EXPLORATION, ROADMAP_NOTE, ROADMAP_PHASES } from "@/content/roadmap";
import { publicEcosystem, type EcosystemCompany } from "@/content/ecosystem";

/**
 * Home-page sections: what works today vs. future exploration, the proposed roadmap,
 * and the strategic ecosystem. Copy and statuses live in src/content/{roadmap,ecosystem}.ts.
 */

function Heading({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</div>
      <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">{title}</h2>
      {intro && <p className="mt-3 text-muted-foreground leading-relaxed">{intro}</p>}
    </div>
  );
}

export function FutureVisionSection() {
  return (
    <section className="relative mt-32 overflow-hidden" id="vision">
      <div className="max-w-6xl mx-auto px-5">
        <Heading
          eyebrow="Future vision"
          title="From a Solana off-ramp to multi-asset payouts."
          intro="Solana / Jupiter is integrated today. Our next steps explore more cryptocurrencies, liquidity routes and future provider relationships."
        />

        <div className="mt-10 rounded-3xl border border-[color:var(--success)]/40 bg-card/80 p-6 md:p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--success)]">
            <CheckCircle2 className="w-4 h-4" /> Built · working end to end in the demo build
          </div>
          <ol className="mt-5 grid gap-3 md:grid-cols-4">
            {CURRENT_FLOW.map((s, i) => (
              <li key={s.title} className="relative rounded-2xl bg-secondary/60 p-4">
                <div className="font-semibold">{s.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.detail}</div>
                {i < CURRENT_FLOW.length - 1 && (
                  <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--success)]" />
                )}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-muted-foreground">
            The demo build runs on a Solana test network with the payout partner&apos;s test environment: no real funds
            move. Jupiter provides live quotes; real-funds swaps come at launch.
          </p>
        </div>

        <div className="mt-10 border-t border-border pt-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Compass className="w-4 h-4" /> PLANNED · Future exploration
          </div>
          <ul className="mt-6 grid gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
            {FUTURE_EXPLORATION.map((f, index) => (
              <li key={f.title} className="min-w-0 border-l border-primary/40 pl-4">
                <span className="font-mono text-xs text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-semibold leading-snug">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.detail}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            These plans are separate from what is built. Bitcoin, Ethereum and additional assets are
            not available for deposits today. Circle and Tether are future partnership goals, not
            confirmed partners. All new routes depend on feasibility, provider agreements and
            compliance review; no delivery dates are committed.
          </p>
        </div>
      </div>
    </section>
  );
}

export function RoadmapSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);
  const icons = [Wallet, ShieldCheck, Layers3, Handshake, Globe2];
  const phase = ROADMAP_PHASES[active] ?? ROADMAP_PHASES[0];
  const PhaseIcon = icons[active] ?? Globe2;
  const current = phase.status === "current";
  const pick = (i: number) => {
    setActive(i);
  };
  const progress = (active / (ROADMAP_PHASES.length - 1)) * 100;
  return (
    <section
      ref={sectionRef}
      className="home-section relative isolate overflow-hidden"
      id="roadmap"
      data-visible={visible}
    >
      <div className="home-container">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="home-eyebrow">Roadmap · Future plan</p>
            <h2 className="home-heading">The path to global payouts.</h2>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Five milestones from a tested foundation to a global payout network.
            </p>
          </div>
          <Button variant="link" asChild className="px-0 text-home-brand">
            <a href="/whitepaper">
              Full roadmap in the whitepaper <ArrowRight />
            </a>
          </Button>
        </div>

        <div className="flex flex-col">
        <div
          id="roadmap-spotlight"
          role="tabpanel"
          className="roadmap-spotlight order-1 mt-10 grid overflow-hidden rounded-2xl border border-border bg-card md:order-2 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
        >
          <div className="roadmap-spotlight-side relative p-7 sm:p-9">
            <div className="mb-6 grid grid-cols-[auto_1fr_auto] items-center gap-2 md:hidden">
              <Button
                size="icon"
                variant="outline"
                aria-label="Previous phase"
                onClick={() => pick((active - 1 + ROADMAP_PHASES.length) % ROADMAP_PHASES.length)}
              >
                <ChevronLeft />
              </Button>
              <span className="text-center text-xs text-muted-foreground">
                {active + 1} / {ROADMAP_PHASES.length}
              </span>
              <Button
                size="icon"
                variant="outline"
                aria-label="Next phase"
                onClick={() => pick((active + 1) % ROADMAP_PHASES.length)}
              >
                <ChevronRight />
              </Button>

            </div>
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-card text-home-brand">
                <PhaseIcon className="size-5" />
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${current ? "bg-success/15 text-success" : "bg-card text-home-brand"}`}
              >
                {current ? "In progress · Demo" : "Planned"}
              </span>
            </div>
            <p className="mt-8 font-mono text-5xl font-semibold text-home-brand sm:text-6xl">
              {String(phase.phase).padStart(2, "0")}
            </p>
            <h3 className="mt-2 text-2xl font-semibold leading-tight text-home-ink">
              {phase.title}
            </h3>
            <p className="mt-3 text-sm text-home-ink/75">{phase.headline}</p>
          </div>
          <div className="p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Focus areas
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {phase.highlights.map((h, i) => (
                <li
                  key={h}
                  className="roadmap-chip flex items-start gap-2 rounded-xl border border-border bg-background p-3 text-sm font-medium"
                  style={{ animationDelay: `${120 + i * 90}ms` }}
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-home-brand" />
                  {h}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{phase.summary}</p>
            <div className="mt-6 flex items-start gap-3 border-t border-border pt-5 text-sm">
              <Compass className="mt-0.5 size-4 shrink-0 text-home-brand" />
              <p>
                <span className="font-semibold">Milestone: </span>
                <span className="text-muted-foreground">{phase.dependsOn}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="roadmap-rail relative order-2 mt-8 md:order-1 md:mt-12" role="tablist" aria-label="Roadmap phases">
          <span className="roadmap-rail-line" aria-hidden="true">
            <span className="roadmap-rail-fill" style={{ width: `${progress}%` }} />
          </span>
          <div className="relative grid grid-cols-5 gap-2">
            {ROADMAP_PHASES.map((p, i) => {
              const Icon = icons[i] ?? Globe2;
              const on = i === active;
              const done = i < active;
              return (
                <button
                  key={p.phase}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-controls="roadmap-spotlight"
                  onClick={() => pick(i)}
                  className="roadmap-step group flex flex-col items-center gap-3 rounded-xl border border-transparent px-1 py-2 text-center transition-colors hover:bg-home-tint focus-visible:outline-2 focus-visible:outline-ring data-[on=true]:border-home-brand/30 data-[on=true]:bg-home-tint data-[on=true]:shadow-sm"
                  data-on={on}
                  data-done={done}
                >
                  <span className="roadmap-dot grid size-12 place-items-center rounded-full border-2 bg-card sm:size-14">
                    <Icon className="size-5 sm:size-6" strokeWidth={1.7} />
                  </span>
                  <span className="hidden text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:block">
                    Phase {String(p.phase).padStart(2, "0")}
                  </span>
                  <span className="hidden text-sm font-semibold leading-snug md:block">
                    {p.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        </div>
        <p className="mt-5 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          Planned milestones, not delivery commitments. No dates are committed and planned
          partnerships are not confirmed relationships.
        </p>
      </div>
    </section>
  );
}

const regionCodes = { USA: "US", UK: "GB", UAE: "AE", IN: "IN" };
const regionNames = {
  USA: "United States",
  UK: "United Kingdom",
  UAE: "United Arab Emirates",
  IN: "India",
};

function CompanyLogo({ c }: { c: EcosystemCompany }) {
  const [broken, setBroken] = useState(false);
  if (!c.logo || broken) {
    return (
      <span className="text-center text-base font-semibold text-foreground">{c.name}</span>
    );
  }
  return (
    <img
      src={c.logo}
      alt={`${c.name} logo`}
      loading="lazy"
      onError={() => setBroken(true)}
      className="partner-logo max-h-14 max-w-full object-contain"
    />
  );
}

export function EcosystemSection({ compact = false }: { compact?: boolean } = {}) {
  const companies = publicEcosystem();
  if (!companies.length) return null;
  return (
    <section
      className={`relative overflow-hidden ${compact ? "home-section" : "mt-32"}`}
      id="ecosystem"
    >
      <div className="home-container">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="home-eyebrow">Business ecosystem</p>
            <h2 className="home-heading">Partners ready to adopt.</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Across investment, logistics, property and digital services.
            </p>
          </div>
        </div>
        <ul
          aria-label="Business partner logos"
          className="partner-slider mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto border-y border-border py-5"
        >
          {companies.map((c) => (
            <li key={c.name} className="w-[240px] shrink-0 snap-start sm:w-[260px]">
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg bg-card px-5 py-4 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <CompanyLogo c={c} />
                <h3 className="mt-3 flex min-h-10 items-center justify-center text-center text-sm font-semibold leading-snug">
                  {c.name}
                </h3>
                <p className="mt-1 text-center text-[11px] font-semibold uppercase tracking-wide text-home-brand">
                  {c.sector}
                </p>
                <p className="mt-2 line-clamp-3 min-h-[3.75rem] text-center text-xs leading-relaxed text-muted-foreground">
                  {c.description}
                </p>
                <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                  {c.region === "UAE" ? (
                    <svg
                      viewBox="0 0 24 16"
                      width="20"
                      height="14"
                      aria-hidden="true"
                      className="shrink-0 rounded-sm"
                    >
                      <rect width="24" height="16" fill="#fff" />
                      <rect width="24" height="5.33" fill="#00843D" />
                      <rect y="10.67" width="24" height="5.33" fill="#000" />
                      <rect width="7" height="16" fill="#C8102E" />
                    </svg>
                  ) : (
                    <Flag code={regionCodes[c.region]} size={20} />
                  )}
                  {regionNames[c.region]}
                </div>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Onboarding PLANNED. Business adoption readiness—not live integrations, financial backing
          or bank endorsement.
        </p>
      </div>
    </section>
  );
}
