import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Check, CircleDollarSign, Globe2, Landmark, Layers3, Loader2, Maximize2, Minimize2, Network, Pause, Play, ShieldCheck, SlidersHorizontal, Undo2, X, Zap } from "lucide-react";
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
  { id: "jupiter", name: "Jupiter", status: "LIVE QUOTES", symbol: "sol", names: [], note: "Solana liquidity · Solana / SPL → Jupiter → USDC", tag: "Live FX rate · Deep liquidity · Low cost" },
  { id: "other-route", name: "Other chains & DEXs", status: "PLANNED", symbol: "eth", names: ["Uniswap", "PancakeSwap", "Curve", "1inch", "and more"], note: "More chains and leading DEXs being evaluated · Not integrated" },
];
type Connection = { from: string; to: string; planned?: boolean; failed?: boolean };
const connections: Connection[] = [
  ...assets.map(asset => ({ from: asset.id, to: "routing", planned: asset.id !== "sol" })),
  ...venues.map(venue => ({ from: "routing", to: venue.id, planned: venue.id !== "jupiter" })),
  { from: "routing", to: "hyperliquid", planned: true },
  ...venues.map(venue => ({ from: venue.id, to: "kyc", planned: venue.id !== "jupiter" })),
  { from: "hyperliquid", to: "kyc", planned: true },
  { from: "kyc", to: "settlement" }, { from: "settlement", to: "partner" }, { from: "partner", to: "fx" }, { from: "fx", to: "recipient" },
  { from: "kyc", to: "failed", failed: true }, { from: "failed", to: "assets", failed: true },
];
type Wire = Connection & { id: string; path: string };
type Kyc = "idle" | "checking" | "passed" | "failed";
type Step = { node?: string; wire?: string; token?: string; kyc?: Kyc; done?: boolean };
const START: Step[] = [
  { node: "sol" }, { wire: "sol-routing", token: "sol" }, { node: "routing" }, { wire: "routing-jupiter", token: "sol" },
  { node: "jupiter" }, { wire: "jupiter-kyc", token: "usdc" }, { node: "kyc", kyc: "checking" },
];
const PASS: Step[] = [...START, { node: "kyc", kyc: "passed" }, { wire: "kyc-settlement", token: "usdc", kyc: "passed" }, { node: "settlement", kyc: "passed" },
  { wire: "settlement-partner", token: "usdc", kyc: "passed" }, { node: "partner", kyc: "passed" }, { wire: "partner-fx", token: "usdc", kyc: "passed" }, { node: "fx", kyc: "passed" },
  { wire: "fx-recipient", token: "usdc", kyc: "passed" }, { node: "recipient", kyc: "passed", done: true }];
const FAIL: Step[] = [...START, { wire: "kyc-failed", token: "usdc", kyc: "failed" }, { node: "failed", kyc: "failed" }, { wire: "failed-assets", token: "sol", kyc: "failed" }, { node: "sol", kyc: "failed" }];

function Status({ children }: { children: string }) {
  return <span className={`eco-status ${children.includes("LIVE") ? "eco-status-live" : children.includes("SANDBOX") ? "eco-status-sandbox" : ""}`}>{children}</span>;
}
function Token({ symbol }: { symbol: string }) {
  return ["sol", "usdc", "usdt", "btc", "eth"].includes(symbol) ? <img src={`/tokens/${symbol}.svg`} alt="" width="26" height="26" className="rounded-full shrink-0" /> : <span className="eco-symbol">{symbol === "bnb" ? "BNB" : <Layers3 className="size-5" />}</span>;
}
function Stage({ id, step, title, sub, children }: { id: string; step: string; title: string; sub?: string; children: ReactNode }) {
  return <div data-eco-node={id} className="eco-stage"><h3 className="eco-stage-heading"><span>{step}</span><div>{title}{sub && <small>{sub}</small>}</div></h3>{children}</div>;
}
function Checks({ items }: { items: string[] }) {
  return <ul className="eco-criteria">{items.map(item => <li key={item}><Check className="size-3 shrink-0" />{item}</li>)}</ul>;
}

/** Fixed cards; one decorative particle walks the live route (wallet → routing → Jupiter → KYC → USDC → Stables → FX → recipient). Never drives financial state. */
export function ConnectedSystems() {
  const flow = useFlowPlayback(1);
  const frame = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const particle = useRef<SVGGElement>(null);
  const [wires, setWires] = useState<Wire[]>([]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState(0);
  const [height, setHeight] = useState(550);
  const [paused, setPaused] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loop, setLoop] = useState(0);
  const [index, setIndex] = useState(0);
  const running = flow.inView && !flow.reduced && !paused;
  const sequence = loop % 3 === 2 ? FAIL : PASS;
  const step: Step = running ? sequence[Math.min(index, sequence.length - 1)] : {};
  const kyc: Kyc = step.kyc ?? (running && index >= 6 ? "checking" : "idle");

  useEffect(() => {
    const viewport = frame.current, root = canvas.current;
    if (!viewport || !root) return;
    const measure = () => {
      const zoom = expanded ? 1 : Math.min(viewport.clientWidth / 1440, 1.12);
      setScale(zoom);
      setOffset(expanded ? 0 : Math.max(0, (viewport.clientWidth - 1440 * zoom) / 2));
      setHeight(root.offsetHeight);
      const box = root.getBoundingClientRect();
      const s = box.width / 1440;
      setWires(connections.flatMap(connection => {
        const from = root.querySelector<HTMLElement>(`[data-eco-node="${connection.from}"]`), to = root.querySelector<HTMLElement>(`[data-eco-node="${connection.to}"]`);
        if (!from || !to) return [];
        const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
        const x1 = (a.right - box.left) / s, y1 = (a.top + a.height / 2 - box.top) / s;
        const x2 = (b.left - box.left) / s, y2 = (b.top + b.height / 2 - box.top) / s;
        const mid = (x1 + x2) / 2;
        let path = `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`;
        if (connection.to === "failed") {
          const x = (a.left + a.width / 2 - box.left) / s;
          path = `M${x},${(a.bottom - box.top) / s} V${(b.top - box.top) / s}`;
        }
        if (connection.from === "failed") {
          const top = 12;
          path = `M${(a.right - box.left) / s},${(a.top + a.height / 2 - box.top) / s} H${(a.right - box.left) / s + 10} V${top} H${(b.left + b.width / 2 - box.left) / s} V${(b.top - box.top) / s - 4}`;
        }
        return [{ ...connection, id: `${connection.from}-${connection.to}`, path }];
      }));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport); observer.observe(root);
    measure();
    return () => observer.disconnect();
  }, [expanded]);

  // Step timer: wires take 1.2 s, cards 0.9 s, 2.5 s rest after each loop.
  useEffect(() => {
    if (!running) return;
    const last = index >= sequence.length - 1;
    const wait = last ? 2800 : sequence[index]?.wire ? 1200 : 900;
    const timer = window.setTimeout(() => {
      if (last) { setIndex(0); setLoop(value => value + 1); } else setIndex(value => value + 1);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [running, index, sequence]);

  // Particle position along the active wire.
  useEffect(() => {
    const g = particle.current, root = canvas.current;
    if (!g || !root || !step.wire) return;
    const path = root.querySelector<SVGPathElement>(`[data-wire="${step.wire}"]`);
    if (!path) return;
    const length = path.getTotalLength();
    const started = performance.now();
    let frameId = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / 1150);
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      const point = path.getPointAtLength(eased * length);
      g.setAttribute("transform", `translate(${point.x},${point.y})`);
      if (t < 1) frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [step.wire, wires]);

  // Card highlight.
  useEffect(() => {
    const root = canvas.current;
    if (!root) return;
    root.querySelectorAll("[data-eco-active]").forEach(node => node.removeAttribute("data-eco-active"));
    if (step.node) root.querySelector(`[data-eco-node="${step.node}"]`)?.setAttribute("data-eco-active", step.node === "failed" ? "failed" : "true");
  }, [step.node]);

  return <section id="infrastructure" className="eco-section home-section border-b border-border">
    <div className="eco-container">
      <div className="eco-heading-row"><div><p className="home-eyebrow">The infrastructure behind the journey</p><h2 className="home-heading">Multi-asset in. Best route. Local currency out.</h2></div><div className="eco-top-benefits"><span><ShieldCheck />Non-custodial<br />by design</span><span><Zap />Live rates<br />across routes</span><span><Globe2 />Licensed<br />payout partners</span></div></div>
      <p className="eco-intro">LamportPay routes your digital assets through the best available liquidity, performs KYC, and settles to local currency via licensed payout partners.</p>
      <div ref={flow.ref} className="eco-model" data-running={running}>
        <div className="eco-model-caption"><span>Digital assets → Detection → Liquidity + live FX → KYC → USDC → Payout partner → Local currency → Recipient</span><div className="flex items-center gap-1"><span className="text-xs text-muted-foreground">Current + planned ecosystem</span><Button variant="ghost" size="icon" onClick={() => setExpanded(value => !value)} aria-label={expanded ? "Fit ecosystem to screen" : "Enlarge ecosystem"} title={expanded ? "Fit ecosystem to screen" : "Enlarge ecosystem"}>{expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}</Button><Button variant="ghost" size="icon" disabled={flow.reduced} aria-label={paused ? "Resume ecosystem motion" : "Pause ecosystem motion"} title={paused ? "Resume ecosystem motion" : "Pause ecosystem motion"} onClick={() => setPaused(value => !value)}>{paused ? <Play className="size-4" /> : <Pause className="size-4" />}</Button></div></div>
        <div ref={frame} className="eco-frame" data-expanded={expanded} style={{ height: height * scale + 4 } as CSSProperties}>
          <div ref={canvas} className="eco-canvas" data-kyc={kyc} style={{ transform: `scale(${scale})`, left: offset }}>
            <svg className="eco-wires" width="1440" height={height} aria-hidden="true">
              <defs><marker id="eco-return-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" className="eco-return-arrow" /></marker></defs>
              {wires.map(wire => <path key={wire.id} data-wire={wire.id} d={wire.path} markerEnd={wire.id === "failed-assets" ? "url(#eco-return-arrow)" : undefined} className={`eco-wire ${wire.planned ? "eco-wire-planned" : ""} ${wire.failed ? "eco-wire-failed" : ""} ${step.wire === wire.id ? "eco-wire-active" : ""}`} />)}
              {step.wire && <g ref={particle} className={`eco-particle ${step.wire.startsWith("failed") || step.wire === "kyc-failed" ? "eco-particle-failed" : ""}`}><circle r="13" className="eco-particle-glow" /><circle r="10" className="eco-token-background" /><image href={`/tokens/${step.token ?? "usdc"}.svg`} x="-8" y="-8" width="16" height="16" /></g>}
              {wires.some(wire => wire.id === "failed-assets") && <text x="720" y="26" textAnchor="middle" className="eco-return-label">If KYC fails, funds return to the client’s original wallet at the applicable live rate · PLANNED*</text>}
            </svg>
            <div className="eco-assets"><Stage id="assets" step="1" title="Digital assets" sub="Send from your wallet"><div className="eco-asset-list">{assets.map(asset => <div key={asset.id} data-eco-node={asset.id} className="eco-asset"><Token symbol={asset.id} /><strong>{asset.name}</strong><Status>{asset.status}</Status></div>)}</div></Stage></div>
            <div className="eco-routing"><Stage id="routing" step="2" title="Asset & network detection" sub="Find the available path"><Network className="eco-icon eco-route-icon" /><Checks items={["Identify asset and network", "Check available liquidity", "Find the best route", "Compare live FX rates", "Lowest total cost"]} /><Status>SOLANA LIVE · MULTI-ROUTE PLANNED</Status></Stage></div>
            <div className="eco-liquidity"><div className="eco-stage"><h3 className="eco-stage-heading"><span>3</span><div>Liquidity & conversion<small>Get the best live FX rate</small></div></h3>{venues.map(venue => <div key={venue.id} data-eco-node={venue.id} className={`eco-venue ${venue.status === "PLANNED" ? "eco-provider-planned" : "eco-provider-current"}`}><div className="eco-venue-heading">{venue.id === "jupiter" ? <img src="/partners/jupiter.svg" alt="" width="26" height="26" /> : <Token symbol={venue.symbol} />}<strong>{venue.name}</strong><Status>{venue.status}</Status></div>{venue.names.length > 0 && <div className="eco-venue-list">{venue.names.map(name => <div key={name}><span className="eco-venue-mark">{name.slice(0, 2)}</span><span>{name}</span></div>)}</div>}<p className="eco-footnote">{venue.note}</p>{venue.tag && <p className="eco-venue-tag">{venue.tag}</p>}</div>)}<div data-eco-node="hyperliquid" className="eco-venue eco-provider-planned"><div className="eco-venue-heading"><img src="/partners/hyperliquid.svg" alt="" width="24" height="24" /><strong>Hyperliquid</strong><Status>IN DEVELOPMENT</Status></div><p className="eco-footnote">Multi-asset liquidity · trading & transfers DISABLED</p></div></div></div>
            <div className="eco-gates"><Stage id="kyc" step="4" title="Identity check (KYC)" sub="Verify sender and recipient"><ShieldCheck className="eco-icon" /><p className="eco-copy">KYC is performed after the best route and conversion path is determined.</p><Status>SANDBOX</Status><p className="eco-kyc-checking"><Loader2 className="size-3 animate-spin" /> KYC checking…</p><div className="eco-pass"><Check className="size-4 shrink-0" /><div><strong>KYC passed</strong><span>Proceed to settlement</span></div></div></Stage><div data-eco-node="failed" className="eco-failed"><X className="size-4 shrink-0" /><div><strong>KYC failed</strong><p>Payment does not proceed.</p><span><Undo2 className="inline size-3" /> Return to original wallet · PLANNED*</span></div></div></div>
            <div className="eco-settlement"><Stage id="settlement" step="5" title="USDC settlement" sub="Common settlement asset"><Token symbol="usdc" /><p className="eco-copy">Converted value settles in USDC for payout processing.</p><Checks items={["Fast settlement", "Low network fees", "Multi-chain support · planned", "Non-custodial"]} /></Stage></div>
            <div className="eco-partner"><Stage id="partner" step="6" title="Licensed payout partners" sub="Regulated infrastructure"><div className="eco-partner-item eco-partner-current"><ShieldCheck className="eco-icon" /><strong>Stables</strong><Status>SANDBOX</Status><p className="eco-footnote">Current integration</p></div><div className="eco-partner-item"><Layers3 className="eco-icon" /><strong>Additional partners</strong><Status>COMING SOON</Status><p className="eco-copy">More licensed payout partners under evaluation.</p></div><div className="eco-partner-item"><Globe2 className="eco-icon" /><strong>Global coverage</strong><p className="eco-copy">Expanding currencies and countries · PLANNED</p></div></Stage></div>
            <div className="eco-fx"><Stage id="fx" step="7" title="Local currency" sub="USDC → recipient’s local currency"><CircleDollarSign className="eco-icon eco-fx-icon" /><p className="eco-copy">USDC is converted through partner infrastructure to the recipient’s local currency.</p><Checks items={["Live / competitive FX rates", "Transparent total cost", "Growing currency coverage"]} /><Status>FIAT CONVERSION · SANDBOX</Status></Stage></div>
            <div className="eco-recipient"><Stage id="recipient" step="8" title="Recipient" sub="Bank account / payment rail"><Landmark className="eco-icon" /><p className="eco-copy">Local currency delivered to the recipient’s bank account. Other local rails · PLANNED.</p><Checks items={["Fast delivery objective", "Verification before payout", "Growing country coverage"]} /><p className="eco-complete"><Check className="size-3" /> Local currency delivered · Payment complete</p><Status>FIAT PAYOUT DISABLED</Status></Stage></div>
          </div>
        </div>
      </div>
      <div className="eco-benefits">{[
        { icon: SlidersHorizontal, title: "Best FX rate", detail: "Multi-chain and multi-DEX route comparison." },
        { icon: Zap, title: "Faster settlement", detail: "Suitable fast networks and available liquidity." },
        { icon: ShieldCheck, title: "Non-custodial", detail: "Your wallet. Your keys. LamportPay does not custody client funds." },
        { icon: Globe2, title: "Global reach", detail: "More assets, chains, currencies and payout partners planned." },
      ].map(({ icon: Icon, title, detail }) => <div key={title}><Icon className="size-6 shrink-0 text-home-brand" /><div><strong>{title}</strong><p>{detail}</p></div></div>)}</div>
      <p className="eco-disclaimer">Solana / SPL live Jupiter quotes are the current route; mainnet swaps are disabled in this build. USDC settlement and Stables verification/payouts are SANDBOX. Bitcoin, Ethereum, BNB Chain, USDT, other chains and DEXs, Hyperliquid and additional payout partners are PLANNED or IN DEVELOPMENT, not enabled integrations. The moving particle illustrates the intended flow, not real funds. *Automatic returns after a failed KYC are not enabled; future returns depend on provider terms and applicable live rates. Production KYC and fiat payouts remain DISABLED.</p>
    </div>
  </section>;
}
