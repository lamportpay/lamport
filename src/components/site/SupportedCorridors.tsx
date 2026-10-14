import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Supported-corridors world map.
 * A dotted world map (simplified equirectangular land mask) with pulsing
 * markers on the four countries where LamportPay's sandbox payout route
 * completes end to end: United States, United Kingdom, India, Philippines.
 * Purely presentational — it must never imply live fiat payouts.
 */

// Coarse land mask: 64 columns x 26 rows, equirectangular projection.
// "#" = land, "." = ocean. Hand-tuned for a clean dotted look.
const MASK = [
  "................................................................",
  "....######......................................................",
  "...#########..........####..######..............................",
  "..###########........#####..######..######..#####...............",
  "..##########..........####...####..#####################........",
  "...########............###....##..########################......",
  "....#####......##......###....#...#########################.....",
  ".....###......####......##....#...##########################....",
  "......#......######.....##........##########################....",
  "............########....##.........########################.....",
  ".............########...##..........######################......",
  "..............######.....#............####################......",
  "...............####......#.............##################.......",
  "................##.......#..............################........",
  "................##......................##############..#.......",
  "...............####......................############...##......",
  "..............######......................##########....###.....",
  "..............######.......................########.....##......",
  "...............####.........................######......#.......",
  "................##...........................####...............",
  "................#.............................##................",
  "................................................................",
  "................................................................",
  "................................................................",
  "................................................................",
  "................................................................",
];

const COLS = 64;
const ROWS = 26;

interface Marker {
  code: string;
  name: string;
  currency: string;
  // lon/lat on the equirectangular grid
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

function toXY(lon: number, lat: number) {
  const x = ((lon + 180) / 360) * COLS;
  const y = ((90 - lat) / 180) * ROWS;
  return { x, y };
}

export function SupportedCorridors() {
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    setScanning(true);
  }, []);

  const dots = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    MASK.forEach((row, y) => {
      for (let x = 0; x < row.length; x += 1) {
        if (row[x] === "#") out.push({ x, y });
      }
    });
    return out;
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
            viewBox={`0 0 ${COLS} ${ROWS}`}
            className="corridor-map"
            role="img"
            aria-label="World map highlighting the United States, United Kingdom, India and the Philippines as supported payout countries"
          >
            {dots.map((d) => (
              <circle
                key={`${d.x}-${d.y}`}
                cx={d.x + 0.5}
                cy={d.y + 0.5}
                r={0.22}
                className="corridor-map-dot"
              />
            ))}
            {MARKERS.map((m) => {
              const { x, y } = toXY(m.lon, m.lat);
              return (
<g
                  key={m.code}
                  className="corridor-marker"
                  style={{ "--ping-delay": `${m.delay}s` } as React.CSSProperties}
                >
                  <circle cx={x} cy={y} r={1.6} className="corridor-marker-ping" />
                  <circle cx={x} cy={y} r={0.9} className="corridor-marker-ping corridor-marker-ping-late" />
                  <circle cx={x} cy={y} r={0.45} className="corridor-marker-core" />
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
                <span className="corridor-legend-dot" aria-hidden="true" />
                <span className="font-semibold text-home-ink">{m.name}</span>
                <span className="corridor-legend-currency">{m.currency}</span>
                <span className="corridor-legend-status">Verified in sandbox</span>
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
