import { useEffect, useState } from "react";

/**
 * Live reference rates strip for the marketing site header.
 * SOL/USD from Jupiter's price API; fiat from a public mid-market feed,
 * refreshed every 30 s. Display only — Stables quotes the real payout numbers.
 */
const RATES_URL = "https://open.er-api.com/v6/latest/USD";
const SOL_MINT = "So11111111111111111111111111111111111111112";
const SOL_PRICE_URL = `https://lite-api.jup.ag/price/v3?ids=${SOL_MINT}`;
const REFRESH_MS = 30_000;

const FIAT = [
  { code: "GBP", symbol: "£", fallback: 0.79 },
  { code: "INR", symbol: "₹", fallback: 88.5 },
  { code: "PHP", symbol: "₱", fallback: 58.5 },
] as const;

const fmt = (n: number, d = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export function LiveRatesTicker() {
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [fiat, setFiat] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch(RATES_URL)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data: { rates?: Record<string, number> }) => {
          if (cancelled || !data.rates) return;
          const next: Record<string, number> = {};
          for (const f of FIAT) {
            const v = data.rates[f.code];
            if (typeof v === "number" && v > 0) next[f.code] = v;
          }
          setFiat(next);
        })
        .catch(() => {});
      fetch(SOL_PRICE_URL)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data: Record<string, { usdPrice?: number }>) => {
          const v = data[SOL_MINT]?.usdPrice;
          if (!cancelled && typeof v === "number" && v > 0) setSolPrice(v);
        })
        .catch(() => {});
    };
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const items: { label: string; value: string }[] = [
    { label: "USDC/USD", value: "1.00" },
    { label: "SOL/USD", value: solPrice ? `$${fmt(solPrice)}` : "—" },
    ...FIAT.map((f) => ({
      label: `USD/${f.code}`,
      value: fmt(fiat[f.code] ?? f.fallback, f.code === "GBP" ? 2 : 2),
    })),
  ];

  return (
    <div
      role="note"
      aria-label="Live reference exchange rates"
      className="border-b border-border/60 bg-secondary/40"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-4 py-1.5 text-[11px] sm:px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="flex shrink-0 items-center gap-1.5 font-semibold uppercase tracking-wide text-home-brand">
          <span className="size-1.5 rounded-full bg-home-brand motion-safe:animate-pulse" />
          Live rates
        </span>
        {items.map((it) => (
          <span key={it.label} className="flex shrink-0 items-center gap-1.5 tabular-nums">
            <span className="font-medium text-muted-foreground">{it.label}</span>
            <span className="font-semibold">{it.value}</span>
          </span>
        ))}
        <span className="ml-auto hidden shrink-0 text-muted-foreground sm:inline">
          Reference only · Stables quotes the real payout
        </span>
      </div>
    </div>
  );
}
