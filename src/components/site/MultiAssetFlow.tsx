import { useEffect, useRef, useState } from 'react';
import { Bitcoin, ScanSearch, ShieldCheck, Landmark, Banknote, Pause, Play, Layers, Info, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

function Status({ children, tone = 'planned' }: { children: string; tone?: 'live' | 'sandbox' | 'planned' }) {
  return <span className={`maf-badge maf-badge-${tone}`}>{children}</span>;
}
function Heading({ number, children }: { number: string; children: React.ReactNode }) {
  return <h3 className="maf-card-heading"><span className="maf-number">{number}</span>{children}</h3>;
}
const ASSETS = [
  { name: 'Bitcoin (BTC)', detail: 'Additional asset route', icon: Bitcoin },
  { name: 'Ethereum (ETH)', detail: 'Ethereum network', logo: '/logos/ethereum.png' },
  { name: 'Stablecoins', detail: 'USDT / USDC · other networks', logo: '/logos/tether.png' },
  { name: 'Solana assets', detail: 'SOL / SPL', logo: '/logos/solana.png', live: true },
  { name: 'Other major assets', detail: 'and networks', icon: Layers },
];

export function MultiAssetFlow() {
  const canvas = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<{ d: string; failed?: boolean }[]>([]);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const measure = () => {
      const box = element.getBoundingClientRect();
      const rect = (id: string) => {
        const r = element.querySelector(`[data-flow="${id}"]`)?.getBoundingClientRect();
        return r ? { x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height } : undefined;
      };
      const connection = (from: string, to: string, failed = false) => {
        const a = rect(from), b = rect(to);
        if (!a || !b) return { d: '', failed };
        if (b.y >= a.y + a.h - 2 && Math.abs(a.x - b.x) < 4) {
          return { d: `M ${a.x + a.w / 2} ${a.y + a.h} V ${b.y}`, failed };
        }
        if (b.x >= a.x + a.w - 2) {
          const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2;
          return { d: `M ${x1} ${y1} C ${(x1+x2)/2} ${y1}, ${(x1+x2)/2} ${y2}, ${x2} ${y2}`, failed };
        }
        const y1 = a.y + a.h, y2 = b.y, x1 = a.x + a.w / 2, x2 = b.x + b.w / 2;
        return { d: `M ${x1} ${y1} C ${x1} ${(y1+y2)/2}, ${x2} ${(y1+y2)/2}, ${x2} ${y2}`, failed };
      };
      const next = Array.from({ length: 7 }, (_, i) => connection(String(i+1), String(i+2)));
      next.push(connection('4', 'fail', true));
      const fail = rect('fail'), first = rect('1');
      if (fail && first) next.push({ d: `M ${fail.x + fail.w / 2} ${fail.y} V 18 H ${first.x + first.w / 2} V ${first.y}`, failed: true });
      setPaths(next);
    };
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    element.querySelectorAll('[data-flow]').forEach(e => resize.observe(e));
    const intersection = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? false), { threshold: 0.1 });
    intersection.observe(element);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update(); measure(); media.addEventListener('change', update);
    return () => { resize.disconnect(); intersection.disconnect(); media.removeEventListener('change', update); };
  }, []);
  const moving = visible && !paused && !reduced;
  return <section aria-labelledby="maf-title" className="maf-infographic py-12 sm:py-16">
    <div className="maf-container">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">The infrastructure behind the journey</p>
          <h2 id="maf-title" className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">Multi-asset in. Local currency out.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">LamportPay connects digital assets to the right liquidity and payout route, with Solana/Jupiter live today and additional routes being integrated.</p>
        </div>
        <Button variant="outline" size="icon" className="shrink-0" onClick={() => setPaused(p => !p)} aria-label={paused ? 'Play flow animation' : 'Pause flow animation'} title={paused ? 'Play flow animation' : 'Pause flow animation'} aria-pressed={paused}>{paused ? <Play /> : <Pause />}</Button>
      </div>
      <div ref={canvas} className="maf-diagram" data-moving={moving}>
        <p className="maf-return-label">Funds returned to original wallet (live rate) · PLANNED / DISABLED</p>
        <svg className="maf-connections" aria-hidden="true">
          <defs><marker id="maf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" className="fill-primary" /></marker><marker id="maf-failed-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" className="fill-destructive" /></marker></defs>
          {paths.map(({ d, failed }, i) => <g key={`${i}-${d}`}><path d={d} className={failed ? 'maf-wire-failed' : 'maf-wire-route'} markerEnd={`url(#${failed ? 'maf-failed-arrow' : 'maf-arrow'})`} />{moving && !failed && <circle r="3.5" className="fill-primary"><animateMotion dur="4s" begin={`${i * .45}s`} repeatCount="indefinite" path={d} /></circle>}</g>)}
        </svg>
        <div className="maf-reference-grid">
          <div data-flow="1" className="maf-card maf-assets"><Heading number="01">Supported digital assets</Heading><div className="maf-asset-list">{ASSETS.map(asset => { const Icon = asset.icon; return <div className="maf-asset-row" key={asset.name}><span className="maf-asset-logo">{asset.logo ? <img src={asset.logo} alt="" /> : Icon ? <Icon /> : null}</span><div className="min-w-0"><strong>{asset.name}</strong><p>{asset.detail}</p></div><Status tone={asset.live ? 'live' : 'planned'}>{asset.live ? 'LIVE' : 'PLANNED'}</Status></div>; })}</div></div>
          <div data-flow="2" className="maf-card maf-detection"><Heading number="02">Asset &amp; Network Detection</Heading><ScanSearch className="mx-auto my-4 h-9 w-9 text-primary" /><p>Identify asset and network</p><p>Check available liquidity</p><p>Compare live FX quotes</p><p>Find the lowest-cost available route</p></div>
          <div data-flow="3" className="maf-liquidity"><Heading number="03">Liquidity &amp; Conversion</Heading><div className="maf-provider maf-provider-live"><img src="/logos/jupiter-exchange-solana.png" alt="" /><div><div className="maf-provider-title"><strong>Jupiter</strong><Status tone="live">LIVE</Status></div><p>Solana / SPL assets → USDC</p><p className="maf-provider-tag">Live FX rate · Deep liquidity · Low cost</p></div></div><div className="maf-provider"><img src="/logos/hyperliquid.jpg" alt="" /><div><div className="maf-provider-title"><strong>Hyperliquid</strong><Status>IN DEVELOPMENT</Status></div><p>Multi-asset liquidity → USDC</p></div></div><div className="maf-provider"><Layers className="h-8 w-8 shrink-0 text-primary" /><div><strong>Other chains &amp; DEXs</strong><p>Additional conversion routes</p><Status>PLANNED</Status></div></div></div>
          <div data-flow="4" className="maf-card maf-kyc"><Heading number="04">Identity Check (KYC)</Heading><div className="flex items-center gap-3"><ShieldCheck className="h-8 w-8 shrink-0 text-primary" /><p>Verify sender through Stables’ hosted identity check.</p></div><div className="mt-3 flex flex-wrap items-center gap-2"><Status tone="sandbox">SANDBOX</Status><span className="maf-kyc-pass"><Check className="h-3 w-3" /> KYC Passed</span></div></div>
          <div data-flow="fail" className="maf-card maf-failed"><div className="flex items-center gap-3"><X className="h-7 w-7 shrink-0 text-destructive" /><div><strong>KYC Failed</strong><p>Payment cannot proceed.</p></div><Status>DISABLED</Status></div><p className="mt-2">Automatic refund route is planned, not enabled.</p></div>
          <div data-flow="5" className="maf-card maf-settlement maf-output"><Heading number="05">USDC Settlement</Heading><img src="/logos/usd-coin.png" alt="USDC" className="maf-output-logo" /><p>Common settlement asset</p><Status tone="sandbox">SANDBOX</Status></div>
          <div data-flow="6" className="maf-card maf-currency maf-output"><Heading number="06">Local Currency</Heading><Banknote className="maf-output-logo text-primary" /><p>Convert USDC to local currency at quoted rates</p><Status tone="sandbox">SANDBOX</Status></div>
          <div data-flow="7" className="maf-card maf-partner maf-output"><Heading number="07">Payout Partner</Heading><img src="/partners/stables.svg" alt="Stables" className="maf-output-logo" /><p>Stables payout infrastructure</p><Status tone="sandbox">SANDBOX</Status></div>
          <div data-flow="8" className="maf-card maf-bank maf-output"><Heading number="08">Recipient Bank Account</Heading><Landmark className="maf-output-logo text-primary" /><p>Local fiat payout to the recipient</p><Status tone="sandbox">SANDBOX</Status></div>
        </div>
      </div>
      <div className="maf-disclosure"><Info className="h-5 w-5 shrink-0 text-primary" /><p>Solana / SPL assets use the live Jupiter route. Additional asset and liquidity routes are planned; Hyperliquid trading and transfers remain disabled. Identity checks and bank payouts are sandbox-only. The refund path is illustrative: automatic refunds are not switched on, and no funds move in this sandbox journey.</p></div>
    </div>
  </section>;
}
