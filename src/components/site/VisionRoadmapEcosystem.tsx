import { ArrowRight, CheckCircle2, Compass, ExternalLink, Globe2, Handshake, Layers3, Network, ShieldCheck, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CURRENT_FLOW, FUTURE_EXPLORATION, ROADMAP_NOTE, ROADMAP_PHASES } from "@/content/roadmap";
import {
  ECOSYSTEM_STATUS_LABEL,
  publicEcosystem,
  type EcosystemCompany,
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
          intro="What works today, and what we plan to explore next. Only the first row is built."
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

        <div className="mt-4 rounded-3xl border border-dashed border-[color:var(--neon-cyan)]/50 bg-card/50 p-6 md:p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--neon-cyan)]">
            <Compass className="w-4 h-4" /> Future exploration · not current functionality
          </div>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {FUTURE_EXPLORATION.map((f) => (
              <li
                key={f}
                className="rounded-full border border-dashed border-[color:var(--neon-cyan)]/50 px-4 py-1.5 text-sm font-medium"
              >
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Each depends on technical feasibility, partner support and compliance review. No
            delivery dates are committed.
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
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.15 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);
  const icons = [Wallet, ShieldCheck, Layers3, Handshake, Globe2];
  return (
    <section ref={sectionRef} className="relative mt-32 overflow-hidden" id="roadmap" data-visible={visible}>
      <div className="max-w-7xl mx-auto px-5">
        <Heading
          eyebrow="Roadmap"
          title="The path to global payouts."
          intro="Five milestones. A validated foundation, followed by security, broader asset routes and market expansion."
        />
        <ol className="roadmap-timeline mt-12 grid lg:grid-cols-5" aria-label="LamportPay development timeline">
          {ROADMAP_PHASES.map((p, index) => {
            const current = p.status === "current";
            const Icon = icons[index] ?? Globe2;
            return (
              <li
                key={p.phase}
                className="roadmap-stage relative grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-5 pb-9 last:pb-0 lg:block lg:pb-0 lg:pr-6"
                aria-current={current ? "step" : undefined}
              >
                <div className="roadmap-track relative flex justify-center lg:justify-start" aria-hidden="true">
                  {index < ROADMAP_PHASES.length - 1 && <span className="roadmap-connector absolute bg-border"><span className="roadmap-flow absolute bg-primary/50" /></span>}
                  <span className={`roadmap-node relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full border-2 ${current ? "border-success bg-background text-success" : "border-border bg-background text-primary"}`}>
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
                      current
                        ? "text-success"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span className={`size-1.5 rounded-full ${current ? "bg-success" : "bg-muted-foreground/50"}`} aria-hidden="true" />
                    {current ? "DEMO / TEST MODE" : "PLANNED"}
                  </span>
                </div>
                <h3 className="mt-3 font-semibold leading-snug">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">
                  {p.summary}
                </p>
                <div className="mt-5 border-t border-border/60 pt-3 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-foreground">
                    <CheckCircle2 className="size-3.5 text-primary" aria-hidden="true" /> Milestone
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

function initials(name: string) {
  const words = name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w));
  return (words[0][0] + (words[1]?.[0] ?? "")).toUpperCase();
}

function CompanyCard({ c }: { c: EcosystemCompany }) {
  const pending = c.status === "owner-confirmation-required";
  return (
    <li className="flex gap-4 rounded-2xl border border-border/60 bg-card/80 p-5">
      {/* Monogram, not a logo: company logos need written permission first. */}
      <div
        aria-hidden
        className="w-12 h-12 shrink-0 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center font-semibold text-primary"
      >
        {initials(c.name)}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{c.name}</h3>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              pending
                ? "bg-[color:var(--warning)]/15 text-[color:var(--warning)]"
                : "bg-primary/10 text-primary"
            }`}
          >
            {ECOSYSTEM_STATUS_LABEL[c.status]}
          </span>
        </div>
        <a
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 inline-flex items-center gap-1 text-xs font-mono text-primary hover:underline"
        >
          {new URL(c.url).hostname.replace(/^www\./, "")} <ExternalLink className="w-3 h-3" />
        </a>
        {c.description && <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>}
        {pending && (
          <p className="mt-2 text-xs text-[color:var(--warning)]">To confirm: {c.toConfirm}</p>
        )}
      </div>
    </li>
  );
}

export function EcosystemSection() {
  // Unconfirmed entries are a draft for the owner: shown in local development only.
  const companies = publicEcosystem(import.meta.env.DEV);
  if (companies.length === 0) return null;
  return (
    <section className="relative mt-32 overflow-hidden" id="ecosystem">
      <div className="max-w-6xl mx-auto px-5">
        <Heading
          eyebrow="Strategic ecosystem"
          title="Built on Solana. Growing an ecosystem."
          intro="Technology we integrate today, and companies in our wider ecosystem. Listing a company does not imply a partnership, investment or commitment unless its label says so."
        />
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
        <ul className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <CompanyCard key={c.name} c={c} />
          ))}
        </ul>
      </div>
    </section>
  );
}
