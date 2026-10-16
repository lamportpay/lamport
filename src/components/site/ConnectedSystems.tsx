import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Check, CircleDollarSign, Globe2, Landmark, Layers3, Maximize2, Minimize2, Network, Pause, Play, ShieldCheck, SlidersHorizontal, Undo2, Wallet, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFlowPlayback } from "@/hooks/use-flow-playback";

const assets = [
  { id: "btc", name: "Bitcoin (BTC)", status: "PLANNED" },
  { id: "eth", name: "Ethereum (ETH)", status: "PLANNED" },
  { id: "usdt", name: "USDT", status: "PLANNED" },
  { id: "usdc", name: "USDC", status: "SANDBOX" },
  { id: "sol", name: "Solana (SOL / SPL)", status: "LIVE QUOTES" },
  { id: "bnb", name: "BNB Chain (BNB)", status: "PLANNED" },
  { id: "other", name: "Other major assets and networks", status: "PLANNED" },
];
const venues = [
  { id: "jupiter", name: "Solana / SPL", status: "LIVE QUOTES", symbol: "sol", names: ["Jupiter", "Raydium", "Orca", "Meteora"], note: "Jupiter live quotes; other venues via aggregator routes, not direct integrations." },
  { id: "ethereum", name: "Ethereum & L2", status: "PLANNED", symbol: "eth", names: ["Uniswap", "1inch", "Curve", "Balancer"], note: "Candidate venues · Not integrated" },
  { id: "bnb-route", name: "BNB Chain", status: "PLANNED", symbol: "bnb", names: ["PancakeSwap", "Biswap", "Thena", "ApeSwap"], note: "Candidate venues · Not integrated" },
  { id: "other-route", name: "Other chains", status: "PLANNED", symbol: "other", names: ["Polygon", "Arbitrum", "Optimism", "Base", "and more"], note: "Future network coverage" },
];
type Connection = { from: string; to: string; planned?: boolean; failed?: boolean; token?: string };
const connections: Connection[] = [
  ...assets.map(asset => ({ from: asset.id, to: "kyc", planned: !["sol", "usdc"].includes(asset.id), token: ["sol", "usdc"].includes(asset.id) ? asset.id : undefined })),
  { from: "kyc", to: "routing", token: "sol" },
  ...venues.map(venue => ({ from: "routing", to: venue.id, planned: venue.id !== "jupiter", token: venue.id === "jupiter" ? "sol" : undefined })),
  { from: "routing", to: "hyperliquid", planned: true },
  ...venues.map(venue => ({ from: venue.id, to: "settlement", planned: venue.id !== "jupiter", token: venue.id === "jupiter" ? "usdc" : undefined })),
  { from: "hyperliquid", to: "settlement", planned: true },
  { from: "settlement", to: "partner", token: "usdc" }, { from: "partner", to: "fx", token: "usdc" }, { from: "fx", to: "recipient", token: "usdc" },
  { from: "kyc", to: "failed", failed: true }, { from: "failed", to: "assets", failed: true, planned: true },
];
type Wire = Connection & { id: string; path: string };
function Status({ children }: { children: string }) {
  return <span className={`eco-status ${children.includes("LIVE") ? "eco-status-live" : children.includes("SANDBOX") ? "eco-status-sandbox" : ""}`}>{children}</span>;
}
function Token({ symbol }: { symbol: string }) {
  return ["sol", "usdc", "usdt", "btc", "eth"].includes(symbol) ? <img src={`/tokens/${symbol}.svg`} alt="" width="26" height="26" className="rounded-full shrink-0" /> : <span className="eco-symbol">{symbol === "bnb" ? "BNB" : <Layers3 className="size-5" />}</span>;
}
function Stage({ id, step, title, children }: { id: string; step: string; title: string; children: ReactNode }) {
  return <div data-eco-node={id} className="eco-stage"><h3 className="eco-stage-heading"><span>{step}</span>{title}</h3>{children}</div>;
}
function Checks({ items }: { items: string[] }) {
  return <ul className="eco-criteria">{items.map(item => <li key={item}><Check className="size-3 shrink-0" />{item}</li>)}</ul>;
}

/** Reference-proportioned overview with independent decorative motion and a readable expanded view. */
export function ConnectedSystems() {
  const flow = useFlowPlayback(1);
  const frame = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const [wires, setWires] = useState<Wire[]>([]);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(550);
  const [paused, setPaused] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const running = flow.inView && !flow.reduced && !paused;
  useEffect(() => {
    const viewport = frame.current, root = canvas.current;
    if (!viewport || !root) return;
    const measure = () => {
      const zoom = expanded ? 1 : Math.min(viewport.clientWidth / 1440, 1);
      setScale(zoom);
      setHeight(root.offsetHeight);
      const box = root.getBoundingClientRect();
      const renderedScale = box.width / 1440;
      setWires(connections.flatMap(connection => {
        const from = root.querySelector<HTMLElement>(`[data-eco-node="${connection.from}"]`), to = root.querySelector<HTMLElement>(`[data-eco-node="${connection.to}"]`);
        if (!from || !to) return [];
        const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
        const x1 = (a.right - box.left) / renderedScale, y1 = (a.top + a.height / 2 - box.top) / renderedScale;
        const x2 = (b.left - box.left) / renderedScale, y2 = (b.top + b.height / 2 - box.top) / renderedScale;
        const mid = (x1 + x2) / 2;
        let path = `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`;
        if (connection.to === "failed") {
          const x = (a.left + a.width / 2 - box.left) / renderedScale;
          path = `M${x},${(a.bottom - box.top) / renderedScale} V${(b.top - box.top) / renderedScale}`;
        }
        if (connection.from === "failed") path = `M${(a.left - box.left) / renderedScale},${y1} H${(a.left - box.left) / renderedScale - 10} V8 H${(b.left + b.width / 2 - box.left) / renderedScale} V${(b.top - box.top) / renderedScale}`;
        return [{ ...connection, id: `${connection.from}-${connection.to}`, path }];
      }));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport); observer.observe(root);
    root.querySelectorAll<HTMLElement>("[data-eco-node]").forEach(node => observer.observe(node));
    measure();
    return () => observer.disconnect();
  }, [expanded]);
  return <section id="infrastructure" className="eco-section home-section border-b border-border">
    <div className="eco-container">
      <div className="eco-heading-row"><div><p className="home-eyebrow">The infrastructure behind the journey</p><h2 className="home-heading">Multi-asset in. Best route. Local currency out.</h2></div><div className="eco-top-benefits"><span><ShieldCheck />Non-custodial<br />by design</span><span><Zap />Live reference<br />rates</span><span><Globe2 />Payout partner<br />ecosystem</span></div></div>
      <p className="eco-intro">LamportPay’s multi-asset vision connects digital assets to the best available liquidity, conversion and payout route, comparing rates across chains and leading DEXs for local currency delivery.</p>
      <div ref={flow.ref} className="eco-model" data-running={running}>
        <div className="eco-model-caption"><span>Many assets → Routing options → One settlement → Local payout</span><div className="flex items-center gap-1"><span className="text-xs text-muted-foreground">Current + planned ecosystem</span><Button variant="ghost" size="icon" onClick={() => setExpanded(value => !value)} aria-label={expanded ? "Fit ecosystem to screen" : "Enlarge ecosystem"} title={expanded ? "Fit ecosystem to screen" : "Enlarge ecosystem"}>{expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}</Button><Button variant="ghost" size="icon" disabled={flow.reduced} aria-label={paused ? "Resume ecosystem motion" : "Pause ecosystem motion"} title={paused ? "Resume ecosystem motion" : "Pause ecosystem motion"} onClick={() => setPaused(value => !value)}>{paused ? <Play className="size-4" /> : <Pause className="size-4" />}</Button></div></div>
        <div ref={frame} className="eco-frame" data-expanded={expanded} style={{ height: height * scale + 4 } as CSSProperties}>
          <div ref={canvas} className="eco-canvas" style={{ transform: `scale(${scale})` }}>
            <svg className="eco-wires" width="1440" height={height} aria-hidden="true"><defs><marker id="eco-return-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" className="eco-return-arrow" /></marker></defs>{wires.map((wire, index) => <g key={wire.id}><path d={wire.path} markerEnd={wire.failed ? "url(#eco-return-arrow)" : undefined} className={`eco-wire ${wire.planned ? "eco-wire-planned" : ""} ${wire.failed ? "eco-wire-failed" : ""}`} />{wire.token && <g className="eco-moving-token"><circle r="10" className="eco-token-background" /><image href={`/tokens/${wire.token}.svg`} x="-8" y="-8" width="16" height="16" />{running && <animateMotion path={wire.path} dur="4s" begin={`${-(index % 4)}s`} repeatCount="indefinite" />}</g>}</g>)}</svg>
            <div className="eco-assets"><Stage id="assets" step="1" title="Supported digital assets (multi-chain)"><div className="eco-asset-list">{assets.map(asset => <div key={asset.id} data-eco-node={asset.id} className="eco-asset"><Token symbol={asset.id} /><strong>{asset.name}</strong><Status>{asset.status}</Status></div>)}</div><p className="eco-footnote">Asset → network → available route. More chains and assets planned.</p></Stage></div>
            <div className="eco-gates"><Stage id="kyc" step="2" title="Identity check (KYC)"><ShieldCheck className="eco-icon" /><p className="eco-copy">Verify sender and recipient where required.</p><Status>SANDBOX</Status><p className="eco-pass"><Check className="size-3" /> KYC passed → routing</p></Stage><div data-eco-node="failed" className="eco-failed"><Undo2 className="size-5 shrink-0" /><div><strong>KYC failed</strong><p>Payment does not proceed.</p><span>Original-wallet return at applicable rate · PLANNED*</span></div></div></div>
            <div className="eco-routing"><Stage id="routing" step="3" title="Smart routing"><Network className="eco-icon" /><p className="eco-lead">Choose the best available route</p><p className="eco-copy">For your asset, network and live FX rate.</p><Status>PLANNED · ROUTE COMPARISON</Status><Checks items={["Real-time price comparison", "Best liquidity across DEXs", "Lowest total cost", "Fastest settlement", "Multi-chain routing", "Supported payout route"]} /></Stage></div>
            <div className="eco-liquidity"><div className="eco-stage"><h3 className="eco-stage-heading"><span>4</span>Liquidity & conversion (multi-chain DEXs)</h3>{venues.map(venue => <div key={venue.id} data-eco-node={venue.id} className={`eco-venue ${venue.status === "PLANNED" ? "eco-provider-planned" : "eco-provider-current"}`}><div className="eco-venue-heading"><Token symbol={venue.symbol} /><strong>{venue.name}</strong><Status>{venue.status}</Status></div><div className="eco-venue-list">{venue.names.map(name => <div key={name}><span className="eco-venue-mark">{name === "Jupiter" ? <img src="/partners/jupiter.svg" alt="" width="24" height="24" /> : name.slice(0, 2)}</span><span>{name}</span></div>)}</div><p className="eco-footnote">{venue.note}</p></div>)}<div data-eco-node="hyperliquid" className="eco-venue eco-provider-planned"><strong>Hyperliquid · Multi-asset liquidity</strong><Status>PLANNED · IN DEVELOPMENT</Status><p className="eco-footnote">Trading & transfers DISABLED</p></div></div></div>
            <div className="eco-settlement"><Stage id="settlement" step="5" title="USDC settlement"><Token symbol="usdc" /><p className="eco-lead">Converted value</p><p className="eco-copy">Settled in USDC on a fast blockchain (e.g. Solana) for payout processing.</p><Checks items={["Fast settlement", "Low network fees", "Multi-chain support · planned", "Secure and transparent"]} /></Stage></div>
            <div className="eco-partner"><Stage id="partner" step="6" title="Licensed payout partners"><div className="eco-partner-item"><ShieldCheck className="eco-icon" /><strong>Stables</strong><Status>SANDBOX</Status><p className="eco-footnote">Current integration</p></div><div className="eco-partner-item"><Layers3 className="eco-icon" /><strong>Additional partners</strong><Status>PLANNED · COMING SOON</Status><p className="eco-copy">More licensed payout partners under evaluation.</p></div><div className="eco-partner-item"><Globe2 className="eco-icon" /><strong>Global coverage</strong><p className="eco-copy">Expanding currencies and countries · PLANNED</p></div></Stage></div>
            <div className="eco-fx"><Stage id="fx" step="7" title="Local currency conversion"><CircleDollarSign className="eco-icon" /><p className="eco-copy">USDC converted through partner infrastructure to local currency.</p><Checks items={["Competitive FX rates", "Transparent total fees", "Network availability 24/7*", "Expanding currencies · planned"]} /><Status>FIAT CONVERSION · SANDBOX</Status></Stage></div>
            <div className="eco-recipient"><Stage id="recipient" step="8" title="Recipient bank account"><Landmark className="eco-icon" /><p className="eco-copy">Local fiat payout to a bank account. Other local payment rails · PLANNED.</p><Checks items={["Fast delivery objective", "Verification before payout", "Growing country coverage"]} /><Status>FIAT PAYOUT DISABLED</Status></Stage></div>
          </div>
        </div>
      </div>
      <div className="eco-benefits">{[
        { icon: SlidersHorizontal, title: "Best FX rate", detail: "Multi-DEX and multi-chain route comparison for the lowest suitable total cost." },
        { icon: Zap, title: "Faster settlement", detail: "Fast blockchains and deep liquidity for quick conversion." },
        { icon: ShieldCheck, title: "Safe and compliant", detail: "Non-custodial design, hosted KYC and licensed payout infrastructure." },
        { icon: Globe2, title: "Global reach", detail: "More assets, partners, currencies and countries planned." },
      ].map(({ icon: Icon, title, detail }) => <div key={title}><Icon className="size-6 shrink-0 text-home-brand" /><div><strong>{title}</strong><p>{detail}</p></div></div>)}</div>
      <p className="eco-disclaimer">Solana / SPL live Jupiter quotes are the current route; mainnet swaps are disabled in this build. USDC settlement and Stables verification/payouts are SANDBOX. USDT, additional chains, named DEX candidates and payout partners are PLANNED, not enabled integrations. Hyperliquid trading and transfers remain disabled. Motion illustrates the intended ecosystem, not real funds. *Verification precedes funding; automatic returns are not enabled and future returns depend on provider terms and applicable rates. Blockchain availability does not guarantee bank settlement on holidays. Production KYC and fiat payouts remain DISABLED.</p>
    </div>
  </section>;
}
