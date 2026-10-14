import {
  ArrowRight,
  CheckCircle2,
  Compass,
  ExternalLink,
  Globe2,
  Handshake,
  Layers3,
  Network,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CURRENT_FLOW, FUTURE_EXPLORATION, ROADMAP_NOTE, ROADMAP_PHASES } from "@/content/roadmap";
import {
  ECOSYSTEM_REGIONS,
  publicEcosystem,
  type EcosystemCompany,
  type EcosystemRegion,
} from "@/content/ecosystem";

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
            <CheckCircle2 className="w-4 h-4" /> Built · working end to end in test mode
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
            Test mode runs on Solana devnet with the payout partner&apos;s sandbox: no real funds
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
      { threshold: 0.15 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);
  const icons = [Wallet, ShieldCheck, Layers3, Handshake, Globe2];
  return (
    <section
      ref={sectionRef}
      className="relative mt-32 overflow-hidden"
      id="roadmap"
      data-visible={visible}
    >
      <div className="max-w-7xl mx-auto px-5">
        <Heading
          eyebrow="Roadmap"
          title="The path to global payouts."
          intro="Five milestones. A validated foundation, followed by security, broader asset routes and market expansion."
        />
        <ol
          className="roadmap-timeline mt-12 grid lg:grid-cols-5"
          aria-label="LamportPay development timeline"
        >
          {ROADMAP_PHASES.map((p, index) => {
            const current = p.status === "current";
            const Icon = icons[index] ?? Globe2;
            return (
              <li
                key={p.phase}
                className="roadmap-stage relative grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-5 pb-9 last:pb-0 lg:block lg:pb-0 lg:pr-6"
                aria-current={current ? "step" : undefined}
              >
                <div
                  className="roadmap-track relative flex justify-center lg:justify-start"
                  aria-hidden="true"
                >
                  {index < ROADMAP_PHASES.length - 1 && (
                    <span className="roadmap-connector absolute bg-border">
                      <span className="roadmap-flow absolute bg-primary/50" />
                    </span>
                  )}
                  <span
                    className={`roadmap-node relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full border-2 ${current ? "border-success bg-background text-success" : "border-border bg-background text-primary"}`}
                  >
                    <Icon className="size-6" strokeWidth={1.7} />
                  </span>
                </div>
                <div className="min-w-0 lg:mt-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      Phase {String(p.phase).padStart(2, "0")}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${
                        current ? "text-success" : "text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${current ? "bg-success" : "bg-muted-foreground/50"}`}
                        aria-hidden="true"
                      />
                      {current ? "DEMO" : "PLANNED"}
                    </span>
                  </div>
                  <h3 className="mt-3 font-semibold leading-snug">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">
                    {p.summary}
                  </p>
                  <div className="mt-5 border-t border-border/60 pt-3 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-foreground">
                      <CheckCircle2 className="size-3.5 text-primary" aria-hidden="true" />{" "}
                      Milestone
                    </div>
                    <div className="mt-1 text-muted-foreground">{p.dependsOn}</div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-6 text-center text-sm text-muted-foreground max-w-3xl mx-auto">
          {ROADMAP_NOTE}
        </p>
      </div>
    </section>
  );
}

/**
 * Country flags drawn as inline SVG. Unicode flag emoji do not render on every desktop
 * OS (Windows shows letter pairs instead), so the partner flags box cannot rely on them.
 */
function FlagIcon({ id, className = "" }: { id: EcosystemRegion; className?: string }) {
  const svg = "h-3.5 w-5";
  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden rounded-[3px] ring-1 ring-foreground/15 ${className}`}
    >
      {id === "USA" && (
        <svg viewBox="0 0 24 16" className={svg} aria-hidden="true">
          <rect width="24" height="16" fill="#fff" />
          {Array.from({ length: 7 }, (_, i) => (
            <rect key={i} x="0" y={i * 2 * (16 / 13)} width="24" height={16 / 13} fill="#B22234" />
          ))}
          <rect width="9.6" height={7 * (16 / 13)} fill="#3C3B6E" />
          {Array.from({ length: 20 }, (_, i) => (
            <circle
              key={i}
              cx={1.1 + (i % 5) * 1.9}
              cy={1.1 + Math.floor(i / 5) * 1.8}
              r="0.34"
              fill="#fff"
            />
          ))}
        </svg>
      )}
      {id === "UK" && (
        <svg viewBox="0 0 24 16" className={svg} aria-hidden="true">
          <rect width="24" height="16" fill="#012169" />
          <path d="M0 0 24 16 M24 0 0 16" stroke="#fff" strokeWidth="3.4" />
          <path d="M0 0 24 16 M24 0 0 16" stroke="#C8102E" strokeWidth="1.4" />
          <path d="M12 0V16M0 8h24" stroke="#fff" strokeWidth="5" />
          <path d="M12 0V16M0 8h24" stroke="#C8102E" strokeWidth="3" />
        </svg>
      )}
      {id === "UAE" && (
        <svg viewBox="0 0 24 16" className={svg} aria-hidden="true">
          <rect width="24" height="16" fill="#fff" />
          <rect width="24" height={16 / 3} fill="#00843D" />
          <rect y={2 * (16 / 3)} width="24" height={16 / 3} fill="#000" />
          <rect width="7" height="16" fill="#C8102E" />
        </svg>
      )}
    </span>
  );
}

function initials(name: string) {
  const words = name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w));
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase();
}

function CompanyLogo({ c }: { c: EcosystemCompany }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="flex h-28 w-full items-center justify-center overflow-hidden border-b border-border bg-background px-6 py-4">
      {c.logo && !broken ? (
        <img
          src={c.logo}
          alt={`${c.name} logo`}
          loading="lazy"
          onError={() => setBroken(true)}
          className="max-h-20 max-w-full object-contain"
        />
      ) : (
        <span className="text-2xl font-semibold text-primary">{c.name === "AGC Global Logistics" ? "AGC Global Logistics" : initials(c.name)}</span>
      )}
    </div>
  );
}

function CompanyCard({ c, compact = false }: { c: EcosystemCompany; compact?: boolean }) {
  return (
    <li>
      <a
        href={c.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/50"
      >
        <CompanyLogo c={c} />
        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold leading-snug">{c.name}</h3>
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-mono text-primary">
              {new URL(c.url).hostname.replace(/^www\./, "")} <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        <p className="text-sm leading-relaxed text-muted-foreground flex-1">{compact ? `${c.sector} · Business payments` : c.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-primary">ONBOARDING PLANNED</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <CheckCircle2 className="w-3 h-3 text-primary" /> Ready to adopt
          </span>
        </div>
        </div>
      </a>
    </li>
  );
}

export function EcosystemSection({ compact = false }: { compact?: boolean } = {}) {
  const companies = publicEcosystem();
  const present = ECOSYSTEM_REGIONS.filter((r) => companies.some((c) => c.region === r.id));
  if (companies.length === 0) return null;
  return (
    <section
      className={`relative overflow-hidden ${compact ? "home-section" : "mt-32"}`}
      id="ecosystem"
    >
      <div className="max-w-6xl mx-auto px-5">
        <Heading
          eyebrow="Business partners"
          title="Partners ready to adopt LamportPay."
          intro={
            compact
              ? undefined
              : "Our confirmed business partners are ready to use LamportPay's payment services. We are also in discussions with additional businesses to grow our ecosystem and bring more partners on board."
          }
        />
        <p className="mt-4 mx-auto max-w-2xl text-center text-sm text-muted-foreground">
          {compact
            ? "Business adoption partners · Onboarding PLANNED, not live payment integrations."
            : "Onboarding is planned. Fiat payouts remain demo-only until production approval; readiness does not mean live payment processing."}
        </p>
        <div
          aria-label="Countries where our partners are based"
          className="mx-auto mt-8 w-fit max-w-full border-y border-border py-3"
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="flex items-center gap-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Globe2 className="w-3.5 h-3.5" /> Partners in
            </span>
            {present.map((r) => (
              <span
                key={r.id}
                className="flex items-center gap-2 px-3 py-1.5"
              >
                <FlagIcon id={r.id} />
                <span className="text-xs font-semibold uppercase tracking-wider">{r.label}</span>
              </span>
            ))}
          </div>
        </div>
        {!compact && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Network className="w-4 h-4" /> Integrated today:
            </span>
            {[
              "Solana",
              "Jupiter (live quotes)",
              "Licensed payout partner (sandbox)",
              "Phantom · Solflare",
            ].map((t) => (
              <span key={t} className="rounded-full border border-border/60 bg-card/70 px-3 py-1">
                {t}
              </span>
            ))}
          </div>
        )}
        <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <CompanyCard key={c.name} c={c} compact={compact} />
          ))}
        </ul>
      </div>
    </section>
  );
}
