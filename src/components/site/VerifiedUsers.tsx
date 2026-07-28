import { useMemo } from "react";
import { CheckCircle2, Globe2, ShieldCheck } from "lucide-react";

const COUNT = 60;

// Deterministic pseudo-random so SSR/CSR match and tiles don't reshuffle.
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

type Tile = {
  src: string;
  x: number; // percent left (0-100)
  y: number; // percent top within collage (0-100)
  size: number; // px
  rot: number; // deg
  delay: number; // s
  z: number;
};

function buildTiles(): Tile[] {
  const tiles: Tile[] = [];
  for (let i = 0; i < COUNT; i++) {
    const r1 = rand(i + 1);
    const r2 = rand(i + 101);
    const r3 = rand(i + 202);
    const r4 = rand(i + 303);
    const r5 = rand(i + 404);
    // Arrange as a shallow "mound" — wider at bottom, narrower at top
    const col = i % 10;
    const row = Math.floor(i / 10);
    const rowBias = row / 5; // 0..1 top→bottom
    const spread = 6 + rowBias * 10; // more spread at the base
    const x = col * 10 + (r1 - 0.5) * spread;
    const y = row * 18 + (r2 - 0.5) * 8;
    const size = 68 + r3 * 72; // 68 → 140px
    const rot = (r4 - 0.5) * 18; // -9 → 9 deg
    tiles.push({
      src: `https://i.pravatar.cc/160?img=${(i % 70) + 1}`,
      x,
      y,
      size,
      rot,
      delay: r5 * 4,
      z: Math.round(rowBias * 10 + r3 * 5),
    });
  }
  return tiles;
}

export function VerifiedUsers() {
  const tiles = useMemo(buildTiles, []);
  return (
    <section className="relative mt-24 md:mt-32 overflow-hidden">
      {/* Deep space backdrop */}
      <div className="absolute inset-0 bg-[oklch(0.09_0.04_275)]" />
      <div className="absolute inset-0 bg-grid-uv opacity-40" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      {/* UV glows */}
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 w-[720px] h-[720px] rounded-full bg-[oklch(0.62_0.28_295)] opacity-20 blur-3xl pointer-events-none" />
      <div className="absolute left-1/3 bottom-0 w-[520px] h-[520px] rounded-full bg-[oklch(0.7_0.28_330)] opacity-15 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 py-24 md:py-32">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-white/70 border border-white/10 rounded-full px-3 py-1.5 bg-black/40 backdrop-blur">
            <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--success)] animate-live-dot" />
            Trusted by senders across 40+ corridors
          </div>
          <h2 className="mt-6 text-6xl md:text-8xl font-semibold tracking-tight text-white tabular-nums">
            <span className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
              2,400,000<span className="text-uv">+</span>
            </span>
          </h2>
          <div className="mt-3 text-sm md:text-base text-white/60 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[color:var(--success)]" />
            Verified users · sending crypto home every day
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono uppercase tracking-widest text-white/50">
            <span className="flex items-center gap-1.5"><Globe2 className="w-3.5 h-3.5" /> 180 countries</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[color:var(--success)]" /> 99.98% success</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>24/7 · never sleeps</span>
          </div>
        </div>

        {/* Photo collage mound */}
        <div className="relative mt-14 md:mt-20 h-[420px] md:h-[520px]">
          {/* Curved mask fading to darkness at edges */}
          <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_70%_80%_at_50%_35%,black_55%,transparent_100%)]">
            {tiles.map((t, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `calc(50% + ${(t.x - 50) * 0.9}%)`,
                  top: `${t.y}%`,
                  width: t.size,
                  height: t.size,
                  transform: `translate(-50%, -50%) rotate(${t.rot}deg)`,
                  zIndex: t.z,
                }}
              >
                <div
                  className="relative w-full h-full rounded-xl overflow-hidden border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] bg-[oklch(0.14_0.05_275)] animate-collage-float will-change-transform"
                  style={{ animationDelay: `${t.delay}s` }}
                >
                  <img
                    src={t.src}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  {/* Verified badge on a few tiles */}
                  {i % 7 === 0 && (
                    <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-[color:var(--success)] border-2 border-[oklch(0.09_0.04_275)] flex items-center justify-center shadow-[0_0_10px_var(--success)]">
                      <CheckCircle2 className="w-3 h-3 text-black" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Bottom fade */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[oklch(0.09_0.04_275)] to-transparent" />
        </div>
      </div>
    </section>
  );
}