import { useEffect, useRef, useState } from 'react';
import { Bitcoin, ScanSearch, ShieldCheck, Landmark, Banknote, Pause, Play, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NODES = [
  { title: 'Digital assets', caption: 'SOL / SPL today', note: 'More assets planned', logo: '/logos/solana.png' },
  { title: 'Detect & route', caption: 'Asset · network · liquidity', note: 'Compare available quotes', icon: ScanSearch },
  { title: 'Liquidity', caption: 'Jupiter · live quotes', note: 'Hyperliquid in development', logo: '/logos/jupiter-exchange-solana.png' },
  { title: 'Identity check', caption: 'Stables hosted KYC', note: 'SANDBOX', icon: ShieldCheck },
  { title: 'USDC settlement', caption: 'One settlement asset', note: 'SANDBOX', logo: '/logos/usd-coin.png' },
  { title: 'Payout partner', caption: 'Stables', note: 'SANDBOX', logo: '/partners/stables.svg' },
  { title: 'Local currency', caption: 'USD · GBP · INR · PHP', note: 'SANDBOX', icon: Banknote },
  { title: 'Recipient bank', caption: 'Local bank account', note: 'SANDBOX', icon: Landmark },
];

export function MultiAssetFlow() {
  const canvas = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const measure = () => {
      const box = element.getBoundingClientRect();
      const circles = Array.from(element.querySelectorAll<HTMLElement>('[data-flow-anchor]'));
      const points = circles.map(circle => {
        const r = circle.getBoundingClientRect();
        return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2, radius: r.width / 2 };
      });
      setPaths(points.slice(0, -1).map((p, i) => {
        const q = points[i + 1];
        if (!q) return '';
        if (Math.abs(p.y - q.y) < 2) {
          const direction = q.x > p.x ? 1 : -1;
          return `M ${p.x + direction * (p.radius + 5)} ${p.y} L ${q.x - direction * (q.radius + 5)} ${q.y}`;
        }
        const right = p.x > box.width / 2;
        const x = right ? box.width - 8 : 8;
        const direction = right ? 1 : -1;
        return `M ${p.x + direction * (p.radius + 5)} ${p.y} H ${x} V ${q.y} H ${q.x + direction * (q.radius + 5)}`;
      }));
    };
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    const intersection = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? false), { threshold: 0.1 });
    intersection.observe(element);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update(); measure();
    media.addEventListener('change', update);
    return () => { resize.disconnect(); intersection.disconnect(); media.removeEventListener('change', update); };
  }, []);

  const moving = visible && !paused && !reduced;
  return (
    <section aria-labelledby="maf-title" className="maf-motion bg-muted/30 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">One connected infrastructure</p>
            <h2 id="maf-title" className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">Multi-asset in. Local currency out.</h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">Different assets. One settlement layer. A connected route to local bank payouts.</p>
          </div>
          <Button variant="outline" size="icon" className="mt-1 shrink-0" onClick={() => setPaused(p => !p)} aria-label={paused ? 'Play flow animation' : 'Pause flow animation'} title={paused ? 'Play flow animation' : 'Pause flow animation'} aria-pressed={paused}>
            {paused ? <Play /> : <Pause />}
          </Button>
        </div>

        <div ref={canvas} className="maf-motion-canvas relative mt-8" data-moving={moving}>
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <defs><marker id="maf-arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" className="fill-primary" /></marker></defs>
            {paths.map((d, i) => <g key={`${i}-${d}`}>
              <path d={d} fill="none" className="maf-wire" markerEnd="url(#maf-arrowhead)" />
              <path d={d} fill="none" className="maf-wire-travel" />
              {moving && <circle r="4" className="fill-primary"><animateMotion dur="3.5s" begin={`${i * 0.35}s`} repeatCount="indefinite" path={d} /></circle>}
            </g>)}
          </svg>
          <ol className="maf-motion-grid relative m-0 list-none p-0">
            {NODES.map((node, i) => {
              const Icon = node.icon;
              return <li key={node.title} className={`maf-station maf-station-${i + 1} flex min-w-0 flex-col items-center text-center`}>
                <span className="mb-3 text-[10px] font-semibold text-muted-foreground">0{i + 1}</span>
                <div data-flow-anchor className="maf-logo relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-background">
                  {node.logo ? <img src={node.logo} alt="" className="h-11 w-11 object-contain" /> : Icon ? <Icon className="h-9 w-9 text-primary" /> : null}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{node.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{node.caption}</p>
                <p className={`mt-2 text-[10px] font-semibold ${node.note === 'SANDBOX' ? 'text-warning' : 'text-primary'}`}>{node.note}</p>
                {i === 0 && <div className="mt-3 flex items-center justify-center gap-2" title="Additional asset routes are planned">
                  <Bitcoin className="h-4 w-4 text-muted-foreground" /><img src="/logos/ethereum.png" alt="Ethereum planned" className="h-4 w-4 object-contain" /><img src="/logos/tether.png" alt="Additional stablecoin routes planned" className="h-4 w-4 object-contain" /><Layers className="h-4 w-4 text-muted-foreground" />
                </div>}
                {i === 2 && <img src="/logos/hyperliquid.jpg" alt="Hyperliquid in development" className="mt-3 h-5 w-5 rounded-full object-contain opacity-60" />}
              </li>;
            })}
          </ol>
        </div>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Non-custodial · Your wallet stays yours</span>
          <span>Illustrative journey · KYC and bank payouts are sandbox-only</span>
        </div>
      </div>
    </section>
  );
}
