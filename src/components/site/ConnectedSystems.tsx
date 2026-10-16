import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, CircleDollarSign, Globe2, Landmark, Layers3, Network, Pause, Play, ScanLine, ShieldCheck, SlidersHorizontal, Undo2, Wallet, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFlowPlayback } from "@/hooks/use-flow-playback";

const assets = [
  { id: "btc", name: "Bitcoin", symbol: "BTC", status: "PLANNED" },
  { id: "eth", name: "Ethereum", symbol: "ETH", status: "PLANNED" },
  { id: "usdt", name: "Stablecoins", symbol: "USDT / USDC", status: "PLANNED" },
  { id: "sol", name: "Solana assets", symbol: "SOL / SPL", status: "LIVE QUOTES" },
  { id: "other", name: "Other major assets", symbol: "& networks", status: "PLANNED" },
];
const criteria = ["Best available FX rate", "Deepest available liquidity", "Lowest total cost", "Fastest settlement", "Supported network", "Payout availability"];
type Connection = { from: string; to: string; planned?: boolean; failed?: boolean; token?: string };
const connections: Connection[] = [
  ...assets.map(asset => ({ from: asset.id, to: "detection", planned: asset.id !== "sol", token: asset.id === "sol" ? "sol" : undefined })),
  { from: "detection", to: "kyc", token: "sol" }, { from: "kyc", to: "routing", token: "sol" },
  { from: "routing", to: "jupiter", token: "sol" }, { from: "routing", to: "hyperliquid", planned: true }, { from: "routing", to: "additional", planned: true },
  { from: "jupiter", to: "settlement", token: "usdc" }, { from: "hyperliquid", to: "settlement", planned: true }, { from: "additional", to: "settlement", planned: true },
  { from: "settlement", to: "fx", token: "usdc" }, { from: "fx", to: "partner", token: "usdc" }, { from: "partner", to: "recipient", token: "usdc" },
  { from: "kyc", to: "failed", failed: true }, { from: "failed", to: "assets", failed: true, planned: true },
];
type Wire = Connection & { id: string; path: string };
function Status({ children, live = false, sandbox = false }: { children: ReactNode; live?: boolean; sandbox?: boolean }) {
  return <span className={`eco-status ${live ? "eco-status-live" : sandbox ? "eco-status-sandbox" : ""}`}>{children}</span>;
}
function Stage({ id, step, title, children }: { id: string; step: string; title: string; children: ReactNode }) {
  return <div data-eco-node={id} className="eco-stage"><h3 className="eco-stage-heading"><span>{step}</span>{title}</h3>{children}</div>;
}

/** Visual-only geometry; endpoints follow the responsive DOM, never payment state. */
export function ConnectedSystems() {
  const flow = useFlowPlayback(1);
  const canvas = useRef<HTMLDivElement>(null);
  const [wires, setWires] = useState<Wire[]>([]);
  const [dimensions, setDimensions] = useState({ width: 1, height: 1 });
  const [paused, setPaused] = useState(false);
  const running = flow.inView && !flow.reduced && !paused;
  useEffect(() => {
    const root = canvas.current;
    if (!root) return;
    const measure = () => {
      const box = root.getBoundingClientRect();
      setDimensions({ width: box.width, height: box.height });
      setWires(connections.flatMap(connection => {
        const from = root.querySelector<HTMLElement>(`[data-eco-node="${connection.from}"]`);
        const to = root.querySelector<HTMLElement>(`[data-eco-node="${connection.to}"]`);
        if (!from || !to) return [];
        const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
        const horizontal = b.left >= a.right - 2;
        const reverse = b.right < a.left;
        const x1 = (horizontal ? a.right : reverse ? a.left : a.left + a.width / 2) - box.left;
        const y1 = (horizontal || reverse ? a.top + a.height / 2 : a.bottom) - box.top;
        const x2 = (horizontal ? b.left : reverse ? b.right : b.left + b.width / 2) - box.left;
        const y2 = (horizontal || reverse ? b.top + b.height / 2 : b.top) - box.top;
        const mid = horizontal || reverse ? (x1 + x2) / 2 : (y1 + y2) / 2;
        let path = horizontal || reverse ? `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}` : `M${x1},${y1} C${x1},${mid} ${x2},${mid} ${x2},${y2}`;
        if (connection.from === "failed" && connection.to === "assets") {
          const rail = 4;
          path = `M${a.left - box.left},${a.top + a.height / 2 - box.top} H${rail} V${b.top - box.top - 12} H${b.left + b.width / 2 - box.left} V${b.top - box.top}`;
        }
        return [{ ...connection, id: `${connection.from}-${connection.to}`, path }];
      }));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    root.querySelectorAll<HTMLElement>("[data-eco-node]").forEach(node => observer.observe(node));
    measure();
    return () => observer.disconnect();
  }, []);
  return <section id="infrastructure" className="eco-section home-section border-b border-border">
    <div className="home-container">
      <p className="home-eyebrow">The infrastructure behind the journey</p>
      <h2 className="home-heading">Multi-asset in. Best route. Local currency out.</h2>
      <p className="eco-intro">LamportPay connects digital assets to available liquidity, conversion and payout routes. Our multi-asset vision compares routes for competitive FX and fast settlement.</p>
      <div ref={flow.ref} className="eco-model" data-running={running}>
        <div className="eco-model-caption"><span><Network className="size-4" /> Many assets <ArrowRight className="size-3" /> Multiple routes <ArrowRight className="size-3" /> One settlement</span><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Illustrative ecosystem</span><Button variant="ghost" size="icon" disabled={flow.reduced} aria-label={paused ? "Resume ecosystem motion" : "Pause ecosystem motion"} title={paused ? "Resume ecosystem motion" : "Pause ecosystem motion"} onClick={() => setPaused(value => !value)}>{paused ? <Play className="size-4" /> : <Pause className="size-4" />}</Button></div></div>
        <div ref={canvas} className="eco-canvas">
          <svg className="eco-wires" width={dimensions.width} height={dimensions.height} aria-hidden="true">
            <defs><marker id="eco-return-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" className="eco-return-arrow" /></marker></defs>
            {wires.map((wire, index) => <g key={wire.id}><path d={wire.path} markerEnd={wire.failed ? "url(#eco-return-arrow)" : undefined} className={`eco-wire ${wire.planned ? "eco-wire-planned" : ""} ${wire.failed ? "eco-wire-failed" : ""}`} />{wire.token && <g className="eco-moving-token"><circle r="11" className="eco-token-background" /><image href={`/tokens/${wire.token}.svg`} x="-8" y="-8" width="16" height="16" />{running && <animateMotion path={wire.path} dur="4s" begin={`${-(index % 4)}s`} repeatCount="indefinite" />}</g>}</g>)}
          </svg>
          <div className="eco-assets"><h3 className="eco-column-heading"><Wallet className="size-4" /> Digital assets</h3><div data-eco-node="assets" className="eco-asset-list">{assets.map(asset => <div key={asset.id} data-eco-node={asset.id} className="eco-asset"><div className="flex items-center gap-2">{asset.id === "other" ? <Layers3 className="size-7 shrink-0 text-home-brand" /> : <img src={`/tokens/${asset.id}.svg`} alt="" width="28" height="28" className="rounded-full" />}<div><strong>{asset.name}</strong><span className="eco-copy">{asset.symbol}</span></div></div><Status live={asset.id === "sol"}>{asset.status}</Status></div>)}</div><p className="eco-footnote">Availability is route-specific. Additional assets are not enabled for deposits.</p></div>
          <div className="eco-gates">
            <Stage id="detection" step="01" title="Asset & network"><ScanLine className="eco-icon" /><p className="eco-copy">Identify asset → network → available route</p></Stage>
            <Stage id="kyc" step="02" title="Identity check / KYC"><ShieldCheck className="eco-icon" /><p className="eco-copy">Verify sender and recipient where required</p><Status sandbox>SANDBOX</Status><p className="eco-pass"><Check className="size-3" /> Passed → routing</p></Stage>
            <div data-eco-node="failed" className="eco-failed"><Undo2 className="size-4 shrink-0" /><div><strong>KYC failed</strong><p>Payment does not proceed.</p><span>Return to original wallet · PLANNED</span></div></div>
          </div>
          <div className="eco-routing"><Stage id="routing" step="03" title="Smart routing"><SlidersHorizontal className="eco-icon" /><p className="eco-lead">Choose the best available route</p><Status>PLANNED · ROUTE COMPARISON</Status><ul className="eco-criteria">{criteria.map(item => <li key={item}><Check className="size-3 shrink-0" />{item}</li>)}</ul></Stage></div>
          <div className="eco-liquidity"><h3 className="eco-column-heading"><Layers3 className="size-4" /> Liquidity & conversion</h3>
            <div data-eco-node="jupiter" className="eco-provider eco-provider-current"><div className="eco-provider-name"><img src="/tokens/sol.svg" width="28" height="28" alt="" className="rounded-full" /><strong>Jupiter</strong></div><Status live>LIVE QUOTES</Status><p className="eco-copy">Solana / SPL assets → Jupiter → USDC</p><span className="eco-footnote">Current route · Mainnet swaps disabled in this build</span></div>
            <div data-eco-node="hyperliquid" className="eco-provider eco-provider-planned"><div className="eco-provider-name"><Layers3 className="size-6 text-home-brand" /><strong>Hyperliquid</strong></div><Status>PLANNED · IN DEVELOPMENT</Status><p className="eco-copy">Broader asset and liquidity integration</p><span className="eco-footnote">Trading & transfers DISABLED</span></div>
            <div data-eco-node="additional" className="eco-provider eco-provider-planned"><div className="eco-provider-name"><Network className="size-6 text-home-brand" /><strong>Additional DEX routes</strong></div><Status>PLANNED</Status><p className="eco-copy">More chains and leading decentralised exchanges under evaluation</p></div>
          </div>
          <div className="eco-settlement"><Stage id="settlement" step="04" title="USDC settlement"><img src="/tokens/usdc.svg" width="48" height="48" alt="" className="eco-settlement-logo rounded-full" /><p className="eco-lead">One common settlement asset</p><p className="eco-copy">Available conversion routes converge into USDC.</p><div className="eco-settlement-note"><ShieldCheck className="size-4" /><span>Single-use deposit<br />Non-custodial by design</span></div></Stage></div>
          <div className="eco-payout">
            <Stage id="fx" step="05" title="Local currency"><CircleDollarSign className="eco-icon" /><p className="eco-copy">USDC → recipient’s local currency</p><p className="eco-footnote">Live reference FX · Transparent total cost</p></Stage>
            <Stage id="partner" step="06" title="Payout infrastructure"><div className="eco-provider-name"><ShieldCheck className="size-5 text-home-brand" /><strong>Stables</strong></div><Status sandbox>SANDBOX · CURRENT INTEGRATION</Status><p className="eco-copy">Additional licensed and regional partners · PLANNED</p></Stage>
            <Stage id="recipient" step="07" title="Recipient"><Landmark className="eco-icon" /><p className="eco-lead">Local bank account</p><p className="eco-copy">Local currency delivered through the payout partner.</p><Status>FIAT PAYOUT DISABLED</Status><span className="eco-footnote">Other local payment rails · PLANNED</span></Stage>
          </div>
        </div>
      </div>
      <div className="eco-benefits">{[
        { icon: SlidersHorizontal, title: "Best FX rate", detail: "Compare available routes and liquidity" },
        { icon: Zap, title: "Faster settlement", detail: "The fastest suitable network and liquidity route" },
        { icon: ShieldCheck, title: "Non-custodial", detail: "Your wallet. Your keys. No LamportPay balances." },
        { icon: Globe2, title: "Global expansion", detail: "More chains, assets, currencies and payout partners" },
      ].map(({ icon: Icon, title, detail }) => <div key={title}><Icon className="size-6 shrink-0 text-home-brand" /><div><strong>{title}</strong><p>{detail}</p></div></div>)}</div>
      <p className="eco-disclaimer">Solana / SPL live Jupiter quotes are the current example; additional chains, liquidity venues and payout partners are planned. Hyperliquid trading and transfers remain disabled while integration is in development. Moving tokens illustrate the intended journey, not real transfers. Production KYC and fiat payouts remain disabled. Verification happens before funding; automatic returns at a live rate are not an enabled feature and any future return is subject to provider terms and applicable rates.</p>
    </div>
  </section>;
}
