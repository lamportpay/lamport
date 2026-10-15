import { useMemo, useState } from "react";
import { geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Topology, GeometryCollection } from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { Flag } from "@/components/app/Flag";

/**
 * Interactive payout-reach world map (Natural Earth 110m countries).
 * Click a country to zoom into it; supported demo corridors and planned
 * corridors are highlighted. Purely presentational — never live payout state.
 */

const W = 1000;
const H = 500;

type Status = "supported" | "planned";
interface Corridor { code: string; name: string; currency: string; symbol: string; lon: number; lat: number; status: Status }

const CORRIDORS: Corridor[] = [
  { code: "US", name: "United States of America", currency: "USD", symbol: "$", lon: -98, lat: 39, status: "supported" },
  { code: "GB", name: "United Kingdom", currency: "GBP", symbol: "£", lon: -2, lat: 54, status: "supported" },
  { code: "IN", name: "India", currency: "INR", symbol: "₹", lon: 78, lat: 22, status: "supported" },
  { code: "PH", name: "Philippines", currency: "PHP", symbol: "₱", lon: 122, lat: 13, status: "supported" },
  { code: "NG", name: "Nigeria", currency: "NGN", symbol: "₦", lon: 8, lat: 10, status: "planned" },
  { code: "PK", name: "Pakistan", currency: "PKR", symbol: "₨", lon: 69, lat: 30, status: "planned" },
];
const BY_NAME = new Map(CORRIDORS.map((c) => [c.name, c]));
const display = (n: string) => (n === "United States of America" ? "United States" : n);

const projection = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
const path = geoPath(projection);

type Country = Feature<Geometry, { name: string }>;

export function SupportedCorridors() {
  const countries = useMemo(() => {
    const topo = world as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
    const fc = feature(topo, topo.objects.countries) as unknown as FeatureCollection<Geometry, { name: string }>;
    return fc.features.filter((f) => f.properties.name !== "Antarctica") as Country[];
  }, []);

  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });

  const zoomTo = (f: Country) => {
    const [[x0, y0], [x1, y1]] = path.bounds(f);
    const dx = Math.max(x1 - x0, 1);
    const dy = Math.max(y1 - y0, 1);
    const k = Math.min(8, 0.6 / Math.max(dx / W, dy / H));
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    setView({ k, x: W / 2 - k * cx, y: H / 2 - k * cy });
    setSelected(f.properties.name);
  };
  const reset = () => { setView({ k: 1, x: 0, y: 0 }); setSelected(null); };
  const zoomBy = (factor: number) =>
    setView((v) => {
      const k = Math.min(8, Math.max(1, v.k * factor));
      if (k === 1) return { k: 1, x: 0, y: 0 };
      const cx = (W / 2 - v.x) / v.k;
      const cy = (H / 2 - v.y) / v.k;
      return { k, x: W / 2 - k * cx, y: H / 2 - k * cy };
    });

  const sel = selected ? BY_NAME.get(selected) : undefined;
  const s = 1 / view.k;

  return (
    <section className="home-section border-t border-border" id="supported-corridors" style={{ overflowX: "clip" }}>
      <div className="home-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="home-eyebrow">Global payout reach</p>
          <h2 className="home-heading">Four corridors, verified end to end.</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Click any country to zoom in. Highlighted countries completed demo bank payouts today;
            Nigeria and Pakistan are planned.
          </p>
        </div>

        <div className="corridor-map-frame relative mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl">
          <svg viewBox={`0 0 ${W} ${H}`} className="corridor-map" role="img" aria-label="Interactive world map of LamportPay payout corridors">
            <rect width={W} height={H} fill="transparent" onClick={reset} />
            <g
              style={{
                transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
                transformOrigin: "0 0",
                transition: "transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              {countries.map((f) => {
                const c = BY_NAME.get(f.properties.name);
                const isSel = selected === f.properties.name;
                const fill = c?.status === "supported"
                  ? "var(--home-brand)"
                  : c?.status === "planned"
                    ? "oklch(0.78 0.13 75)"
                    : "oklch(0.82 0.05 275)";
                return (
                  <path
                    key={f.properties.name + String(f.id)}
                    d={path(f) ?? undefined}
                    fill={fill}
                    fillOpacity={isSel ? 1 : c ? 0.85 : 0.55}
                    stroke="var(--background)"
                    strokeWidth={0.6 * s}
                    className="cursor-pointer transition-[fill-opacity] hover:fill-opacity-100"
                    onClick={() => zoomTo(f)}
                  >
                    <title>{display(f.properties.name)}</title>
                  </path>
                );
              })}
              {CORRIDORS.map((m) => {
                const [x, y] = projection([m.lon, m.lat])!;
                const planned = m.status === "planned";
                return (
                  <g key={m.code} style={{ pointerEvents: "none" }} className={planned ? "corridor-marker-planned" : "corridor-marker"}>
                    {!planned && <circle cx={x} cy={y} r={18 * s} className="corridor-marker-ping" />}
                    <circle cx={x} cy={y} r={5 * s} className={planned ? "corridor-marker-planned-core" : "corridor-marker-core"} />
                    <image href={`/flags/${m.code}.svg`} x={x - 10 * s} y={y - 25 * s} width={20 * s} height={13.3 * s} />
                    <text x={x} y={y + 18 * s} textAnchor="middle" fontSize={11 * s} fontWeight={700} fill="var(--foreground)">
                      {display(m.name)}{planned ? " · Planned" : ""}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          <div className="absolute right-3 top-3 flex flex-col gap-1.5">
            {[
              { icon: Plus, label: "Zoom in", on: () => zoomBy(1.6) },
              { icon: Minus, label: "Zoom out", on: () => zoomBy(1 / 1.6) },
              { icon: RotateCcw, label: "Reset map", on: reset },
            ].map(({ icon: Icon, label, on }) => (
              <button key={label} type="button" aria-label={label} onClick={on} className="grid size-8 place-items-center rounded-lg border border-border bg-background/90 shadow-sm backdrop-blur hover:bg-accent">
                <Icon className="size-4" />
              </button>
            ))}
          </div>

          {selected && (
            <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-xl border border-border bg-background/95 px-4 py-2.5 shadow-md backdrop-blur">
              {sel && <Flag code={sel.code} size={22} />}
              <div>
                <p className="text-sm font-semibold">{display(selected)}</p>
                <p className="text-xs text-muted-foreground">
                  {sel
                    ? sel.status === "supported"
                      ? `${sel.symbol} ${sel.currency} · Demo payouts verified`
                      : `${sel.symbol} ${sel.currency} · Planned corridor`
                    : "Not yet supported"}
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="mx-auto mt-6 max-w-xl text-center text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold">DEMO / SIMULATED</span> · Corridor status reflects
          demo test completions. Production bank payouts remain disabled until approval.
        </p>
      </div>
    </section>
  );
}
