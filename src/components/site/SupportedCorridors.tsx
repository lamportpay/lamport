import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { WORLD_LAND_PATH } from "@/lib/world-map-paths";
import { Flag } from "@/components/app/Flag";

/**
 * Supported-corridors world map.
 * Real world land outlines (Natural Earth 110m, equirectangular projection)
 * with pulsing markers on the four countries where LamportPay's sandbox
 * payout route completes end to end: US, UK, India, Philippines.
 * Purely presentational — it must never imply live fiat payouts.
 */

const W = 1000;
const H = 500;

interface Marker {
  code: string;
  name: string;
  currency: string;
  lon: number;
  lat: number;
  delay: number;
}

const MARKERS: Marker[] = [
  { code: "US", name: "United States", currency: "USD", lon: -98, lat: 39, delay: 0 },
  { code: "GB", name: "United Kingdom", currency: "GBP", lon: -2, lat: 54, delay: 0.6 },
  { code: "IN", name: "India", currency: "INR", lon: 78, lat: 22, delay: 1.2 },
  { code: "PH", name: "Philippines", currency: "PHP", lon: 122, lat: 13, delay: 1.8 },
];

interface PlannedMarker {
  code: string;
  name: string;
  currency: string;
  lon: number;
  lat: number;
}

// Roadmap Phase 2 corridors — proposed after funding, not active today.
const PLANNED_MARKERS: PlannedMarker[] = [
  { code: "NG", name: "Nigeria", currency: "NGN", lon: 8, lat: 10 },
  { code: "PK", name: "Pakistan", currency: "PKR", lon: 69, lat: 30 },
];

function toXY(lon: number, lat: number) {
  return { x: ((lon + 180) / 360) * W, y: ((90 - lat) / 180) * H };
}

export function SupportedCorridors() {
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    setScanning(true);
  }, []);

  return (
    <section className="home-section border-t border-border" id="supported-corridors">
      <div className="home-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="home-eyebrow">Global payout reach</p>
          <h2 className="home-heading">Four corridors, verified end to end.</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Our sandbox payment route completes bank payouts to these four countries today.
            More corridors are planned as payout-partner coverage grows.
          </p>
        </div>

        <div className="corridor-map-frame mx-auto mt-10 max-w-4xl">
          <div className="corridor-map-scan" aria-hidden="true" data-active={scanning} />
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="corridor-map"
            role="img"
            aria-label="World map highlighting the United States, United Kingdom, India and the Philippines as supported payout countries"
          >
            <defs>
              <linearGradient id="corridor-land" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="oklch(0.72 0.13 285)" />
                <stop offset="100%" stopColor="oklch(0.66 0.14 255)" />
              </linearGradient>
            </defs>
            <path d={WORLD_LAND_PATH} className="corridor-land" fill="url(#corridor-land)" />
            {MARKERS.map((m) => {
              const { x, y } = toXY(m.lon, m.lat);
              return (
                <g
                  key={m.code}
                  className="corridor-marker"
                  style={{ "--ping-delay": `${m.delay}s` } as React.CSSProperties}
                >
                  <circle cx={x} cy={y} r={26} className="corridor-marker-ping" />
                  <circle cx={x} cy={y} r={14} className="corridor-marker-ping corridor-marker-ping-late" />
                  <circle cx={x} cy={y} r={6.5} className="corridor-marker-core" />
                  <image
                    href={`/flags/${m.code}.svg`}
                    x={x - 10}
                    y={y - 29}
                    width={20}
                    height={13.3}
                    className="corridor-marker-flag"
                  />
                  <g className="corridor-marker-tick" transform={`translate(${x + 10}, ${y - 26})`}>
                    <circle r={6.5} className="corridor-marker-tick-bg" />
                    <path d="M-3 0.4 L-0.8 2.6 L3.2 -2.4" className="corridor-marker-tick-check" />
                  </g>
                  <text x={x} y={y + 24} textAnchor="middle" className="corridor-marker-label">
                    {m.name}
                  </text>
                </g>
              );
            })}
            {PLANNED_MARKERS.map((m) => {
              const { x, y } = toXY(m.lon, m.lat);
              return (
                <g key={m.code} className="corridor-marker-planned">
                  <circle cx={x} cy={y} r={10} className="corridor-marker-planned-ring" />
                  <circle cx={x} cy={y} r={4.5} className="corridor-marker-planned-core" />
                  <image
                    href={`/flags/${m.code}.svg`}
                    x={x - 10}
                    y={y - 27}
                    width={20}
                    height={13.3}
                    className="corridor-marker-flag"
                  />
                  <text x={x} y={y - 33} textAnchor="middle" className="corridor-marker-planned-label">
                    PLANNED
                  </text>
                  <text x={x} y={y + 22} textAnchor="middle" className="corridor-marker-planned-name">
                    {m.name}
                  </text>
                </g>
              );
            })}
          </svg>

          <ul className="corridor-legend" aria-label="Supported payout countries">
            {MARKERS.map((m) => (
              <li
                key={m.code}
                className={cn("corridor-legend-item")}
                style={{ "--ping-delay": `${m.delay}s` } as React.CSSProperties}
              >
                <Flag code={m.code} size={20} />
                <span className="font-semibold text-home-ink">{m.name}</span>
                <span className="corridor-legend-currency">{m.currency}</span>
                <span className="corridor-legend-status">Verified in sandbox</span>
              </li>
            ))}
            {PLANNED_MARKERS.map((m) => (
              <li key={m.code} className="corridor-legend-item corridor-legend-item-planned">
                <Flag code={m.code} size={20} />
                <span className="font-semibold text-home-ink">{m.name}</span>
                <span className="corridor-legend-currency">{m.currency}</span>
                <span className="corridor-legend-status">Planned — Phase 2, after funding</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mx-auto mt-6 max-w-xl text-center text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold">DEMO / SIMULATED</span> · Corridor status reflects
          sandbox test completions. Production bank payouts remain disabled until approval.
        </p>
      </div>
    </section>
  );
}
