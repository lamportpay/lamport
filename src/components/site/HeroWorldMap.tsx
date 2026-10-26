import { useMemo } from "react";
import { geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import type { Topology, GeometryCollection } from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import lamportMark from "@/assets/lamportpay-mark.png";

/**
 * Full-width world map behind the hero: LamportPay in the centre with
 * illustrative USDC → local-currency transactions to many countries.
 * Decorative only; motion stops under reduced motion (CSS).
 */
const W = 1000;
const H = 500;
const projection = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
const path = geoPath(projection);
const HUB: [number, number] = [W / 2, H / 2 - 20];

const DESTS: Array<{ cur: string; lon: number; lat: number }> = [
  { cur: "USD", lon: -98, lat: 39 }, { cur: "CAD", lon: -79, lat: 44 }, { cur: "MXN", lon: -99, lat: 19 },
  { cur: "BRL", lon: -47, lat: -15 }, { cur: "ARS", lon: -58, lat: -34 }, { cur: "COP", lon: -74, lat: 4.6 },
  { cur: "GBP", lon: -0.1, lat: 51.5 }, { cur: "EUR", lon: 2.3, lat: 48.8 }, { cur: "PLN", lon: 21, lat: 52 },
  { cur: "NGN", lon: 3.4, lat: 6.5 }, { cur: "KES", lon: 36.8, lat: -1.3 }, { cur: "ZAR", lon: 28, lat: -26 },
  { cur: "AED", lon: 55.3, lat: 25.2 }, { cur: "PKR", lon: 67, lat: 24.9 }, { cur: "INR", lon: 77.2, lat: 28.6 },
  { cur: "PHP", lon: 121, lat: 14.6 }, { cur: "JPY", lon: 139.7, lat: 35.7 }, { cur: "AUD", lon: 151, lat: -33.9 },
];

function arc(a: [number, number], b: [number, number]) {
  const mx = (a[0] + b[0]) / 2;
  const my = Math.min(a[1], b[1]) - Math.abs(a[0] - b[0]) * 0.2 - 15;
  return `M${a[0]},${a[1]} Q${mx},${my} ${b[0]},${b[1]}`;
}

export function HeroWorldMap() {
  const land = useMemo(() => {
    const topo = world as unknown as Topology<{ countries: GeometryCollection }>;
    const fc = feature(topo, topo.objects.countries) as unknown as FeatureCollection<Geometry, { name: string }>;
    return fc.features.filter((f) => f.properties?.name !== "Antarctica").map((f) => path(f) ?? "").join("");
  }, []);
  const routes = DESTS.map((d) => {
    const pt = (projection([d.lon, d.lat]) ?? [0, 0]) as [number, number];
    return { ...d, pt, d: arc(HUB, pt) };
  });
  return (
    <div className="hero-map pointer-events-none absolute inset-0 -z-10 text-home-brand" aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="h-full w-full" focusable="false">
        <defs>
          <pattern id="hero-map-dots" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.4" fill="currentColor" />
          </pattern>
          <mask id="hero-map-mask"><path d={land} fill="#fff" /></mask>
          <linearGradient id="hero-map-grad" x1="0" x2="1">
            <stop offset="0%" stopColor="var(--home-cap-stroke-a, currentColor)" />
            <stop offset="100%" stopColor="var(--home-cap-stroke-b, currentColor)" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#hero-map-dots)" mask="url(#hero-map-mask)" opacity={0.28} />
        {routes.map((r, i) => {
          const dur = 4 + (i % 4) * 0.7;
          const begin = `-${(i * 0.9) % dur}s`;
          return (
            <g key={r.cur}>
              <path id={`hero-route-${i}`} d={r.d} fill="none" stroke="url(#hero-map-grad)" strokeWidth={1.2} strokeOpacity={0.45} strokeDasharray="3 4" className="hero-map-route" />
              <circle cx={r.pt[0]} cy={r.pt[1]} r={3} fill="currentColor" opacity={0.7} className="hero-map-node" />
              <g className="hero-map-token">
                <animateMotion dur={`${dur}s`} begin={begin} repeatCount="indefinite">
                  <mpath href={`#hero-route-${i}`} />
                </animateMotion>
                <rect x={-17} y={-8} width={34} height={16} rx={8} fill="var(--home-surface, #fff)" stroke="currentColor" strokeOpacity={0.5} />
                <text y={3.5} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="currentColor">USDC
                  <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.55;1" dur={`${dur}s`} begin={begin} repeatCount="indefinite" />
                </text>
                <text y={3.5} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="currentColor" opacity={0}>{r.cur}
                  <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.5;0.55;1" dur={`${dur}s`} begin={begin} repeatCount="indefinite" />
                </text>
              </g>
            </g>
          );
        })}
        <circle cx={HUB[0]} cy={HUB[1]} r={30} fill="currentColor" opacity={0.12} className="hero-map-hub-glow" />
        <circle cx={HUB[0]} cy={HUB[1]} r={20} fill="var(--home-surface, #fff)" stroke="currentColor" strokeOpacity={0.4} />
        <image href={lamportMark} x={HUB[0] - 13} y={HUB[1] - 13} width={26} height={26} />
      </svg>
    </div>
  );
}
