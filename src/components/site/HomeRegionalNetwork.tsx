import { useEffect, useMemo, useRef, useState } from "react";
import { geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import type { Topology, GeometryCollection } from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import { ArrowLeftRight, Database, Globe2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Regional expansion strategy. Regions are NOT partners: Stables (sandbox) is the
 * only payout infrastructure relationship. Motion is decorative only.
 */
const W = 1000;
const H = 500;
const projection = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
const path = geoPath(projection);

const HUB: [number, number] = [20, 30];
const REGIONS = [
  { name: "North America", lon: -100, lat: 42, pos: "left-[3%] top-[14%]" },
  { name: "Europe", lon: 12, lat: 52, pos: "left-[40%] top-[4%]" },
  { name: "Asia", lon: 95, lat: 35, pos: "right-[3%] top-[22%]" },
  { name: "South America", lon: -60, lat: -15, pos: "left-[6%] bottom-[12%]" },
  { name: "Africa", lon: 20, lat: 3, pos: "left-[42%] bottom-[6%]" },
  { name: "Oceania", lon: 135, lat: -25, pos: "right-[3%] bottom-[10%]" },
];

const FACTORS = [
  { n: "01", icon: Globe2, title: "Corridor Coverage", text: "Local infrastructure suited to each supported corridor." },
  { n: "02", icon: Database, title: "Liquidity", text: "Access available liquidity for the selected route." },
  { n: "03", icon: ArrowLeftRight, title: "FX", text: "Compare available rates and total conversion costs." },
  { n: "04", icon: Zap, title: "Settlement", text: "Select the appropriate payout route based on availability and settlement conditions." },
];

function arc(a: [number, number], b: [number, number]) {
  const mx = (a[0] + b[0]) / 2;
  const my = Math.min(a[1], b[1]) - Math.abs(a[0] - b[0]) * 0.18 - 20;
  return `M${a[0]},${a[1]} Q${mx},${my} ${b[0]},${b[1]}`;
}

export function HomeRegionalNetwork() {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setSeen(true);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const land = useMemo(() => {
    const topo = world as unknown as Topology<{ countries: GeometryCollection }>;
    const fc = feature(topo, topo.objects.countries) as unknown as FeatureCollection<Geometry, { name: string }>;
    return fc.features.filter((f) => f.properties?.name !== "Antarctica").map((f) => path(f) ?? "").join("");
  }, []);
  const hub = projection(HUB)!;
  const routes = REGIONS.map((r) => ({ ...r, pt: projection([r.lon, r.lat])!, d: arc(hub as [number, number], projection([r.lon, r.lat]) as [number, number]) }));
  const reveal = (i: number) => ({ className: cn("rn-reveal", seen && "rn-in"), style: { transitionDelay: `${i * 90}ms` } });

  return (
    <section ref={ref} className="home-section border-t border-border" id="regional-network" style={{ overflowX: "clip" }}>
      <div className="home-container">
        <div className="mx-auto max-w-3xl text-center" {...reveal(0)}>
          <p className="home-eyebrow">Regional expertise. Global reach.</p>
          <h2 className="home-heading">One global network, built corridor by corridor.</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
            LamportPay is building a network of specialist payout partners across regions. We evaluate local
            coverage, liquidity, FX rates and settlement capabilities to identify the right infrastructure for each corridor.
          </p>
        </div>

        <p className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-muted-foreground" {...reveal(1)}>
          {["LamportPay", "Smart Routing", "Regional Infrastructure", "Local Payout"].map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true" className="text-primary">→</span>}
              <span className="rounded-full border border-border bg-card px-3 py-1 text-foreground">{s}</span>
            </span>
          ))}
        </p>

        <div className="rn-map relative mx-auto mt-8 max-w-5xl overflow-hidden rounded-2xl border border-border" {...reveal(2)}>
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="World map showing LamportPay's planned regional payout expansion">
            <defs>
              <linearGradient id="rn-grad" x1="0" x2="1">
                <stop offset="0%" stopColor="var(--home-brand)" />
                <stop offset="100%" stopColor="var(--primary)" />
              </linearGradient>
            </defs>
            <path d={land} className="rn-land" />
            {routes.map((r, i) => (
              <g key={r.name}>
                <path id={`rn-route-${i}`} d={r.d} className="rn-route" stroke="url(#rn-grad)" style={{ animationDelay: `${i * 0.6}s` }} />
                <circle r={4} className="rn-spark">
                  <animateMotion dur={`${6 + i}s`} begin={`${i * 0.8}s`} repeatCount="indefinite" rotate="auto">
                    <mpath href={`#rn-route-${i}`} />
                  </animateMotion>
                </circle>
                <circle cx={r.pt[0]} cy={r.pt[1]} r={6} className="rn-node" />
              </g>
            ))}
            <circle cx={hub[0]} cy={hub[1]} r={22} className="rn-hub-glow" />
            <circle cx={hub[0]} cy={hub[1]} r={11} className="rn-hub" />
          </svg>
          {REGIONS.map((r) => (
            <div key={r.name} className={cn("absolute hidden rounded-xl border border-border bg-card/95 px-3 py-2 shadow-sm backdrop-blur md:block", r.pos)}>
              <p className="text-sm font-semibold text-foreground">{r.name}</p>
              <p className="text-xs text-muted-foreground">Partner expansion</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 md:hidden">
          {REGIONS.map((r) => (
            <div key={r.name} className="rounded-xl border border-border bg-card px-3 py-2">
              <p className="text-sm font-semibold text-foreground">{r.name}</p>
              <p className="text-xs text-muted-foreground">Partner expansion</p>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center" {...reveal(3)}>
          <h3 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Built around the best available route.</h3>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FACTORS.map((f, i) => (
            <div key={f.n} {...reveal(4 + i)} className={cn("rn-reveal rounded-2xl border border-border bg-card p-5 shadow-sm", seen && "rn-in")}>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{f.n}</span>
                <f.icon className="size-5 text-primary" />
              </div>
              <p className="mt-3 font-semibold text-foreground">{f.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-base font-semibold text-foreground md:text-lg">
          Our objective: <span className="home-brand-text">help more of the original value reach the recipient.</span>
        </p>
        <p className="mx-auto mt-5 flex w-fit flex-wrap items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Current payout infrastructure:</span> Stables
          <span className="home-cap-status home-cap-status--sandbox rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning-foreground">SANDBOX</span>
        </p>
      </div>
    </section>
  );
}
