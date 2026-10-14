import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
  KeyRound,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VERIFICATION_JOURNEY } from "@/content/payment-flow";

const icons = [KeyRound, Fingerprint, UserCheck, ShieldCheck];

export function VerificationJourney({ compact = false }: { compact?: boolean }) {
  return (
    <section
      id="verification"
      aria-labelledby="verification-heading"
      className="mt-10 border-t border-border pt-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">
            Wallet identity & payment eligibility
          </p>
          <h2 id="verification-heading" className="mt-3 text-2xl font-semibold">
            Your wallet proves ownership. Verification opens the next step.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Two distinct checks: LamportPay verifies wallet control; Stables handles hosted identity
            verification.
          </p>
        </div>
        {compact && (
          <Button asChild variant="link" className="px-0">
            <Link to="/workflow" hash="verification">
              Explore verification <ArrowRight />
            </Link>
          </Button>
        )}
      </div>
      <VerificationFlow compact={compact} />
      {!compact && (
        <div className="mt-7 grid gap-6 border-y border-border py-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">No custody. No identity-document collection.</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Your wallet keeps its keys. LamportPay coordinates quotes, recipient checks and
              status; Stables provides the single-use deposit address and payout infrastructure.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold">A sandbox completion is not production KYC.</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The app can retain verification from a completed payment, avoiding repeat prompts.
              Current completions are sandbox records only; production identity verification and
              real fiat payouts remain DISABLED.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

const NODE_Y = [130, 215, 300, 385];
const LEAVES = [
  { side: -1, text: "Message signed" },
  { side: 1, text: "Ed25519 ✓ · one-time" },
  { side: -1, text: "Hosted check · Stables" },
  { side: 1, text: "Eligible · bank ready" },
];

/** Animated tree: a user travels down the trunk, each step lights a branch. */
function VerificationFlow({ compact }: { compact: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) return setVisible(true);
    const o = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setVisible(true);
          o.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    o.observe(el);
    return () => o.disconnect();
  }, []);
  useEffect(() => {
    if (!visible || !auto) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % NODE_Y.length), 3800);
    return () => window.clearInterval(id);
  }, [visible, auto]);
  const pick = (i: number) => {
    setAuto(false);
    setActive((i + NODE_Y.length) % NODE_Y.length);
  };
  const step = VERIFICATION_JOURNEY[active];
  const Icon = icons[active] ?? ShieldCheck;
  const n = VERIFICATION_JOURNEY.length;
  return (
    <div
      ref={ref}
      data-visible={visible}
      className="verify-flow mt-8 grid overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
    >
      <div className="verify-scene relative p-4 sm:p-6">
        <svg
          viewBox="0 0 360 450"
          className="mx-auto h-auto w-full max-w-[400px]"
          role="img"
          aria-label="Animated verification flow: wallet signature, server check, hosted identity check, eligibility"
        >
          <defs>
            <linearGradient id="vf-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--home-brand)" />
              <stop offset="1" stopColor="oklch(0.58 0.2 300)" />
            </linearGradient>
          </defs>
          {/* trunk */}
          <path d="M180 70 V420" className="vf-trunk-bg" />
          <path
            d="M180 70 V420"
            className="vf-trunk"
            style={{ strokeDashoffset: 350 - ((NODE_Y[active] - 70) / 350) * 350 }}
          />
          {/* branches + leaves */}
          {NODE_Y.map((y, i) => {
            const leaf = LEAVES[i];
            const x2 = 180 + leaf.side * 100;
            const on = i <= active;
            return (
              <g key={y} className="vf-branch" data-on={on} data-current={i === active}>
                <path
                  d={`M180 ${y} C ${180 + leaf.side * 40} ${y}, ${180 + leaf.side * 60} ${y - 28}, ${x2} ${y - 28}`}
                  className="vf-branch-line"
                />
                <g transform={`translate(${x2} ${y - 28})`} className="vf-leaf">
                  <rect x={-74} y={-15} width={148} height={30} rx={15} />
                  <text textAnchor="middle" dy="4">
                    {leaf.text}
                  </text>
                </g>
                <circle
                  cx={180}
                  cy={y}
                  r={17}
                  className="vf-node"
                  onClick={() => pick(i)}
                  style={{ cursor: "pointer" }}
                />
                <text x={180} y={y + 5} textAnchor="middle" className="vf-node-num">
                  {i + 1}
                </text>
              </g>
            );
          })}
          {/* bank root */}
          <g transform="translate(180 428)" className="vf-bank" data-on={active === n - 1}>
            <rect x={-46} y={-12} width={92} height={24} rx={6} />
            <text textAnchor="middle" dy="4">
              Bank payout
            </text>
          </g>
          {/* traveling user */}
          <g
            className="vf-traveler"
            style={{ transform: `translate(180px, ${NODE_Y[active] - 2}px)` }}
          >
            <circle r={26} className="vf-halo" />
          </g>
          <g transform="translate(180 38)" className="vf-user">
            <circle r={26} className="vf-user-bg" />
            <circle cy={-6} r={8} className="vf-user-ink" />
            <path d="M-14 16 C -14 4, 14 4, 14 16" className="vf-user-ink" />
            <g className="vf-wallet" transform="translate(22 12)">
              <rect x={-11} y={-8} width={22} height={16} rx={4} />
              <circle cx={5} r={2.2} />
            </g>
          </g>
          <text x={180} y={84} textAnchor="middle" className="vf-caption" dy="0">
            You
          </text>
        </svg>
      </div>
      <div key={active} className="verify-spot p-6 sm:p-8" aria-live="polite">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-home-tint text-home-brand">
            <Icon className="size-5" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-home-brand">
            {step.label}
          </span>
        </div>
        <p className="mt-6 font-mono text-4xl font-semibold text-home-brand/30">0{active + 1}</p>
        <h3 className="mt-1 text-xl font-semibold leading-snug">{step.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {compact ? step.summary : step.detail}
        </p>
        <ol className="mt-6 grid gap-2" aria-label="Customer verification journey">
          {VERIFICATION_JOURNEY.map((st, i) => (
            <li key={st.title}>
              <button
                type="button"
                onClick={() => pick(i)}
                aria-current={i === active ? "step" : undefined}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${i === active ? "border-home-brand bg-home-tint font-semibold" : "border-border hover:bg-muted"}`}
              >
                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                {st.title}
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex items-center gap-2">
          <Button size="icon" variant="outline" aria-label="Previous step" onClick={() => pick(active - 1)}>
            <ChevronLeft />
          </Button>
          <Button size="icon" variant="outline" aria-label="Next step" onClick={() => pick(active + 1)}>
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
