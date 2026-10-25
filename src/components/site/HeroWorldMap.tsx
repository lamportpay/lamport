import { useMemo } from "react";
import { geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import type { Topology, GeometryCollection } from "topojson-specification";
import world from "world-atlas/countries-110m.json";

/** Faint dotted world map blended into the hero background. Decorative only. */
const W = 1000;
const H = 500;
const projection = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
const path = geoPath(projection);

export function HeroWorldMap() {
  const land = useMemo(() => {
    const topo = world as unknown as Topology<{ countries: GeometryCollection }>;
    const fc = feature(topo, topo.objects.countries) as unknown as FeatureCollection<Geometry, { name: string }>;
    return fc.features.filter((f) => f.properties?.name !== "Antarctica").map((f) => path(f) ?? "").join("");
  }, []);
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center text-home-brand opacity-[0.22]"
      style={{
        maskImage: "radial-gradient(ellipse 70% 65% at 50% 50%, #000 40%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 70% 65% at 50% 50%, #000 40%, transparent 100%)",
      }}
      aria-hidden="true"
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="h-full w-full" focusable="false">
        <defs>
          <pattern id="hero-map-dots" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.4" fill="currentColor" />
          </pattern>
          <mask id="hero-map-mask"><path d={land} fill="#fff" /></mask>
        </defs>
        <rect width={W} height={H} fill="url(#hero-map-dots)" mask="url(#hero-map-mask)" />
      </svg>
    </div>
  );
}
