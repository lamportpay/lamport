import { useEffect, useState } from "react";

/**
 * Fixed bottom ticker with live prices for the top 20 cryptocurrencies by
 * market cap. Data: CoinGecko public markets API, refreshed every 60 s.
 * Display only — reference prices, not LamportPay payout quotes.
 */
const API_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h";
const REFRESH_MS = 60_000;

type Coin = {
  id: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number | null;
};

const fmtPrice = (n: number) =>
  n >= 1
    ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : n.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 6 });

/**
 * `bottomClass` lifts the strip above another fixed bar (the app's phone tab
 * bar) without changing its behaviour anywhere else.
 */
export function CryptoPriceTicker({
  bottomClass = "bottom-0",
  inline = false,
}: {
  bottomClass?: string;
  /** Render as a strip inside the header instead of a fixed bottom bar. */
  inline?: boolean;
}) {
  const [coins, setCoins] = useState<Coin[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch(API_URL)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data: Coin[]) => {
          if (!cancelled && Array.isArray(data)) setCoins(data.slice(0, 20));
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

  if (coins.length === 0) return null;

  const strip = (
    <>
      {coins.map((c) => {
        const change = c.price_change_percentage_24h;
        const up = (change ?? 0) >= 0;
        return (
          <span key={c.id} className="flex shrink-0 items-center gap-1.5 tabular-nums">
            <span className="font-semibold uppercase">{c.symbol}</span>
            <span className="font-medium">${fmtPrice(c.current_price)}</span>
            {typeof change === "number" && (
              <span className={up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                {up ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
              </span>
            )}
          </span>
        );
      })}
    </>
  );

  return (
    <div
      role="note"
      aria-label="Live cryptocurrency prices, top 20 by market cap"
      className={
        inline
          ? "border-t border-border/40 print:hidden"
          : `fixed inset-x-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-lg print:hidden ${bottomClass}`
      }
    >
      <div className="crypto-ticker overflow-hidden py-1.5 text-[11px]">
        <div className="crypto-ticker-track flex w-max items-center gap-6 motion-reduce:animate-none">
          <span className="flex shrink-0 items-center gap-1.5 pl-4 font-semibold uppercase tracking-wide text-home-brand">
            <span className="size-1.5 rounded-full bg-home-brand motion-safe:animate-pulse" />
            Top 20 crypto
          </span>
          {strip}
          {/* duplicate for seamless loop */}
          <span aria-hidden="true" className="flex items-center gap-6 pl-6">
            {strip}
          </span>
        </div>
      </div>
    </div>
  );
}
