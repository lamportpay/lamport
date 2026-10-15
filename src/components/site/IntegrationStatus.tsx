import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Check } from "lucide-react";
import { INTEGRATION_GROUPS } from "@/content/integration-status";

const initials = (name: string) => name.split(" ").map((word) => word[0]).join("").slice(0, 2);
type Item = { name: string; status: string; detail: string; asset?: string; group: string };
const all: Item[] = INTEGRATION_GROUPS.flatMap((group) => group.entries.map((entry) => ({ ...entry, group: group.title })));
const cut = all.findIndex((entry) => entry.name === "Hyperliquid");
const items = cut >= 0 ? all.slice(0, cut + 1) : all.filter((entry) => entry.group === "Connected today");

function Logo({ entry }: { entry: Item }) {
  return (
    <span className="integration-logo relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-home-brand bg-background shadow-sm">
      {entry.name === "Hyperliquid" && <span aria-hidden="true" className="integration-progress-ring absolute -inset-1.5 rounded-full" />}
      {entry.asset ? <img src={entry.asset} alt="" width="28" height="28" className="size-7 object-contain" /> : <span className="text-xs font-bold text-home-brand">{initials(entry.name)}</span>}
      {entry.group === "Connected today" && <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-success text-primary-foreground shadow ring-2 ring-background" aria-label="Completed"><Check className="size-3" strokeWidth={3.5} /></span>}
    </span>
  );
}

export function IntegrationStatus() {
  const listRef = useRef<HTMLOListElement>(null);
  const [paths, setPaths] = useState<string[]>([]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const nodes = Array.from(list.querySelectorAll<HTMLElement>(":scope > .integration-stop"));
    const measure = () => {
      const desktop = window.matchMedia("(min-width: 768px)").matches;
      const points = nodes.map((node) => ({ x: node.offsetLeft + (desktop ? node.clientWidth / 2 : 24), y: node.offsetTop + 24 }));
      setPaths(points.slice(1).map((point, index) => {
        const previous = points[index];
        if (desktop && Math.abs(point.y - previous.y) > 50) {
          const edge = Math.min(list.clientWidth - 4, Math.max(point.x, previous.x) + nodes[index].clientWidth / 2 - 8);
          const radius = Math.min(48, (point.y - previous.y) / 2);
          return `M ${previous.x} ${previous.y} H ${edge - radius} Q ${edge} ${previous.y} ${edge} ${previous.y + radius} V ${point.y - radius} Q ${edge} ${point.y} ${edge - radius} ${point.y} H ${point.x}`;
        }
        return `M ${previous.x} ${previous.y} L ${point.x} ${point.y}`;
      }));
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(list);
    window.addEventListener("resize", measure);
    if (typeof IntersectionObserver === "undefined") return () => { resize.disconnect(); window.removeEventListener("resize", measure); };
    list.dataset.motionReady = "true";
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const index = nodes.indexOf(entry.target as HTMLElement);
        entry.target.setAttribute("data-visible", String(entry.isIntersecting));
        list.querySelector(`[data-segment="${index}"]`)?.setAttribute("data-visible", String(entry.isIntersecting));
      }
    }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });
    nodes.forEach((node) => observer.observe(node));
    return () => { observer.disconnect(); resize.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  return (
    <section id="integration-status" className="home-section border-t border-border bg-home-surface">
      <div className="home-container">
        <p className="home-eyebrow">Integration outlook</p>
        <h2 className="home-heading">Building a multi-chain fiat settlement ecosystem.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">Bringing Solana’s speed and Hyperliquid’s liquidity (in progress) into one non-custodial route to local bank payouts. Each stop shows its real status.</p>
        <ol ref={listRef} aria-label="Integration timeline" className="integration-timeline">
          <li aria-hidden="true" className="integration-path-layer">
            <svg width="100%" height="100%" aria-hidden="true">
              {paths.map((d, index) => <g key={index} data-segment={index + 1} data-visible="false" style={{ "--integration-delay": `${index * 0.45}s` } as CSSProperties}><path d={d} className="integration-path-track" /><path d={d} pathLength="1" className="integration-path-draw" /></g>)}
            </svg>
          </li>
          {items.map((entry, index) => (
            <li key={entry.name} className="integration-stop" data-visible="false" style={{ "--integration-column": index < 3 ? index + 1 : 3 - (index % 3), "--integration-row": Math.floor(index / 3) + 1 } as CSSProperties}>
              <Logo entry={entry} />
              <div className="integration-card rounded-lg border border-border bg-background p-4">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">{entry.group}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{entry.name}</h3>
                  <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-home-brand">{entry.status}</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{entry.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-xs text-muted-foreground">Token symbols identify assets, not issuer partnerships. Technology connections are not financial backing.</p>
      </div>
    </section>
  );
}
