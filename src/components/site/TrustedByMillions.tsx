import { useEffect, useState } from "react";
import { ShieldCheck, TrendingUp, Globe2, Zap } from "lucide-react";

// Diverse avatar set (DiceBear seeds -> deterministic faces)
const seeds = [
  "Aisha", "Ravi", "Chen", "Maria", "Kwame", "Yuki", "Diego", "Fatima",
  "Omar", "Priya", "Luca", "Sofia", "Kenji", "Zara", "Noah", "Amara",
  "Hiro", "Lena", "Mateo", "Ines", "Tariq", "Nadia", "Emeka", "Aria",
];

const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear`;

function useCounter(target: number, duration = 1800) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.floor(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return n;
}

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

export function TrustedByMillions() {
  const users = useCounter(2_450_000);
  const volume = useCounter(1_820);
  const countries = useCounter(64);
  const txns = useCounter(11_400_000);

  return (
    <section className="relative mt-32 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-uv opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] rounded-full bg-[image:var(--gradient-hero)] opacity-[0.08] blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/60 backdrop-blur px-4 py-1.5 text-xs font-medium text-muted-foreground mb-5">
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-[color:var(--success)] animate-live-dot" />
              <span className="relative rounded-full w-2 h-2 bg-[color:var(--success)]" />
            </span>
            Trusted worldwide
          </div>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
            Trusted by <span className="text-uv">millions</span> across 60+ countries.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            LamportPay routes through Bridge, Jupiter, and Solana — the same infrastructure powering millions of global payouts every month.
          </p>
        </div>

        {/* Avatar wall */}
        <div className="mt-14 relative">
          <div className="mx-auto max-w-5xl grid grid-cols-8 md:grid-cols-12 gap-2 md:gap-3">
            {seeds.slice(0, 24).map((s, i) => (
              <div
                key={s}
                className="relative group"
                style={{ animation: `fade-in 0.6s ease-out ${i * 40}ms both` }}
              >
                <div className="aspect-square rounded-2xl overflow-hidden border border-border/60 bg-card shadow-[var(--shadow-soft)] group-hover:border-primary/50 group-hover:shadow-[var(--shadow-neon)] transition">
                  <img
                    src={avatar(s)}
                    alt={`Verified user ${s}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                {i % 6 === 0 && (
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[color:var(--success)] ring-2 ring-background animate-live-dot" />
                )}
              </div>
            ))}
          </div>

          {/* Big verified stat overlay */}
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            <StatCard
              icon={ShieldCheck}
              value={`${fmt(users)}+`}
              label="Verified accounts"
              sub="Across partner network"
            />
            <StatCard
              icon={TrendingUp}
              value={`$${fmt(volume)}M+`}
              label="Monthly volume"
              sub="Bridge settlement network"
            />
            <StatCard
              icon={Globe2}
              value={`${countries}`}
              label="Countries served"
              sub="Local payout corridors"
            />
            <StatCard
              icon={Zap}
              value={`${fmt(txns)}+`}
              label="Transactions routed"
              sub="Jupiter + Solana"
            />
          </div>
        </div>

        {/* Partner credibility strip */}
        <div className="mt-16">
          <div className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
            Powered by industry-leading infrastructure
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <PartnerCard
              name="Bridge"
              tagline="Stablecoin settlement"
              stat="$5B+"
              statLabel="processed"
              accent="from-[oklch(0.7_0.2_260)] to-[oklch(0.62_0.28_295)]"
            />
            <PartnerCard
              name="Jupiter"
              tagline="Solana DEX aggregator"
              stat="$1T+"
              statLabel="cumulative swap volume"
              accent="from-[oklch(0.75_0.2_200)] to-[oklch(0.7_0.28_330)]"
            />
            <PartnerCard
              name="Solana"
              tagline="Sub-second settlement"
              stat="~400ms"
              statLabel="block time"
              accent="from-[oklch(0.7_0.28_330)] to-[oklch(0.75_0.2_170)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  sub,
}: {
  icon: any;
  value: string;
  label: string;
  sub: string;
}) {
  return (
    <div className="relative rounded-2xl p-6 bg-card/80 backdrop-blur border border-border/60 hover:border-primary/40 hover:shadow-[var(--shadow-neon)] transition overflow-hidden group">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--neon-violet)] to-transparent opacity-60" />
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[image:var(--gradient-uv)] opacity-0 group-hover:opacity-20 blur-2xl transition" />
      <div className="w-10 h-10 rounded-xl bg-[image:var(--gradient-uv)] text-white flex items-center justify-center mb-4 shadow-[0_0_20px_-4px_oklch(0.62_0.28_295_/_0.6)]">
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-3xl md:text-4xl font-semibold tracking-tight tabular-nums text-uv">
        {value}
      </div>
      <div className="mt-1 font-medium">{label}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

function PartnerCard({
  name,
  tagline,
  stat,
  statLabel,
  accent,
}: {
  name: string;
  tagline: string;
  stat: string;
  statLabel: string;
  accent: string;
}) {
  return (
    <div className="relative rounded-2xl p-6 bg-card/80 backdrop-blur border border-border/60 hover:border-primary/40 transition overflow-hidden group">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold tracking-tight">{name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{tagline}</div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[color:var(--success)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--success)] animate-live-dot" />
          Live
        </div>
      </div>
      <div className="mt-6">
        <div className="font-mono text-2xl font-semibold text-uv tabular-nums">{stat}</div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">
          {statLabel}
        </div>
      </div>
    </div>
  );
}