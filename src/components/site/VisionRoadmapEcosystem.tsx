import {
  ArrowRight,
  CheckCircle2,
  Compass,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
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

const regionCodes = { USA: "US", UK: "GB", UAE: "AE", IN: "IN" };
const regionNames = {
  USA: "United States",
  UK: "United Kingdom",
  UAE: "United Arab Emirates",
  IN: "India",
};

function CompanyLogo({ c }: { c: EcosystemCompany }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="flex h-28 items-center justify-center px-3">
      {c.logo && !broken ? (
        <img
          src={c.logo}
          alt={`${c.name} logo`}
          loading="lazy"
          onError={() => setBroken(true)}
          className="max-h-20 max-w-full object-contain"
        />
      ) : (
        <span className="text-center text-lg font-semibold text-foreground">{c.name}</span>
      )}
    </div>
  );
}

export function EcosystemSection({ compact = false }: { compact?: boolean } = {}) {
  const companies = publicEcosystem();
  const slider = useRef<HTMLUListElement>(null);
  const section = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [position, setPosition] = useState({ start: true, end: false });
  const updatePosition = () => {
    const el = slider.current;
    if (el)
      setPosition({
        start: el.scrollLeft < 8,
        end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8,
      });
  };
  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    const el = section.current;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { threshold: 0.25 },
    );
    if (el) observer.observe(el);
    return () => {
      media.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);
  useEffect(() => {
    if (paused || interacting || reducedMotion || !inView) return;
    const timer = window.setInterval(() => {
      const el = slider.current;
      if (!el || document.hidden) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      const item = el.querySelector("li");
      el.scrollTo({
        left: atEnd ? 0 : el.scrollLeft + (item?.getBoundingClientRect().width ?? 260) + 16,
        behavior: "smooth",
      });
    }, 3500);
    return () => window.clearInterval(timer);
  }, [paused, interacting, reducedMotion, inView]);
  const move = (direction: number) => {
    const el = slider.current;
    if (!el) return;
    el.scrollBy({
      left: direction * el.clientWidth * 0.8,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };
  if (!companies.length) return null;
  return (
    <section
      ref={section}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false);
      }}
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label={paused ? "Play partner slider" : "Pause partner slider"}
              title={paused ? "Play partner slider" : "Pause partner slider"}
              aria-pressed={paused}
              disabled={reducedMotion}
              onClick={() => setPaused((value) => !value)}
            >
              {paused ? <Play /> : <Pause />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous partners"
              title="Previous partners"
              disabled={position.start}
              onClick={() => move(-1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next partners"
              title="Next partners"
              disabled={position.end}
              onClick={() => move(1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
        <ul
          ref={slider}
          onPointerDown={() => setPaused(true)}
          onScroll={updatePosition}
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
