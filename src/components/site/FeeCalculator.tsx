import { useEffect, useMemo, useState } from "react";
import { Delete } from "lucide-react";
import { percentageModel, splitTotal } from "@/lib/payments/fee-math";

/**
 * Payout estimate calculator (keypad style).
 * Stables fees mirror the sandbox quotes recorded on 30 Sep 2026:
 * 0.25% platform fee + a fixed bank payout (payment-method) fee per currency.
 * Rates: live mid-market reference with fallbacks. Estimate only — Stables quotes the real numbers.
 */
const CURRENCIES = [
  { code: "USD", flag: "US", fallbackRate: 1, payoutFee: 5 },
  { code: "GBP", flag: "GB", fallbackRate: 0.79, payoutFee: 1 },
  { code: "INR", flag: "IN", fallbackRate: 88.5, payoutFee: 5 },
  { code: "PHP", flag: "PH", fallbackRate: 58.5, payoutFee: 0.34 },
] as const;
type CurrencyCode = (typeof CURRENCIES)[number]["code"];
const RATES_URL = "https://open.er-api.com/v6/latest/USD";
const STABLES_PLATFORM = 0.0025;
const MODEL = percentageModel(200n);
const PRESETS = [100, 250, 500, 1000];
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"];
const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

function compute(value: number, cur: (typeof CURRENCIES)[number], rate: number) {
  const { netMinor, feeMinor } = splitTotal(BigInt(Math.round(value * 1e6)), MODEL);
  const net = Number(netMinor) / 1e6;
  const ours = Number(feeMinor) / 1e6;
  const stables = net * STABLES_PLATFORM + cur.payoutFee;
  const arriving = Math.max(0, net - stables);
  return { ours, stables, local: arriving * rate, totalPct: ((ours + stables) / value) * 100 };
}

export function FeeCalculator() {
  const [amount, setAmount] = useState("100");
  const [code, setCode] = useState<CurrencyCode>("USD");
  const [liveRates, setLiveRates] = useState<Partial<Record<CurrencyCode, number>>>({});
  const cur = CURRENCIES.find((c) => c.code === code)!;
  const rate = liveRates[code] ?? cur.fallbackRate;

  useEffect(() => {
    let cancelled = false;
    fetch(RATES_URL)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { rates?: Record<string, number> }) => {
        if (cancelled || !data.rates) return;
        const next: Partial<Record<CurrencyCode, number>> = {};
        for (const c of CURRENCIES) {
          const v = data.rates[c.code];
          if (typeof v === "number" && v > 0) next[c.code] = v;
        }
        setLiveRates(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const press = (k: string) =>
    setAmount((a) => {
      if (k === "del") return a.slice(0, -1);
      if (k === "." && a.includes(".")) return a;
      if (a.includes(".") && a.split(".")[1].length >= 2) return a;
      const next = a === "0" && k !== "." ? k : a + k;
      return Number(next) > 1_000_000 ? a : next;
    });

  const value = Number(amount);
  const result = useMemo(
    () => (value >= 15 ? compute(value, cur, rate) : null),
    [value, cur, rate],
  );

  return (
    <section className="home-section border-y border-border bg-home-surface" id="costs">
      <div className="home-container grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="home-eyebrow">Payout calculator</p>
          <h2 className="home-heading">See what arrives<br />in the bank.</h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Our fee is 2%. The bank payout fee is fixed, so the bigger the payment, the smaller the total share.
          </p>
          <div className="mt-6 max-w-sm overflow-hidden rounded-xl border border-border bg-background text-sm">
            <div className="grid grid-cols-2 border-b border-border px-4 py-2 text-xs font-semibold text-muted-foreground">
              <span>You send</span><span className="text-right">All fees ({cur.code})</span>
            </div>
            {PRESETS.map((p) => (
              <div key={p} className="grid grid-cols-2 px-4 py-2 odd:bg-home-surface">
                <span>{fmt(p, 0)} USDC</span>
                <span className="text-right font-medium">≈ {fmt(compute(p, cur, rate).totalPct, 1)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm rounded-3xl border border-border bg-background p-5 shadow-lg">
          <div className="grid grid-cols-4 gap-1 rounded-full bg-home-surface p-1">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setCode(c.code)}
                aria-pressed={c.code === code}
                className={`rounded-full py-1.5 text-xs font-semibold transition ${c.code === code ? "bg-home-brand text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
              >
                {c.code}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-2xl bg-home-surface p-4 text-right">
            <p className="text-xs text-muted-foreground">You send</p>
            <p className="truncate text-4xl font-semibold tabular-nums" aria-live="polite">
              {amount || "0"} <span className="text-base text-muted-foreground">USDC</span>
            </p>
            <div className="mt-3 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">Bank receives about</p>
              <p className="truncate text-2xl font-semibold tabular-nums text-home-brand">
                {result ? `${fmt(result.local)} ${cur.code}` : "Min. 15 USDC"}
              </p>
            </div>
          </div>

          {result && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-border p-2.5">
                <p className="text-muted-foreground">LamportPay fee</p>
                <p className="font-semibold">{fmt(result.ours)} USDC</p>
              </div>
              <div className="rounded-xl border border-border p-2.5">
                <p className="text-muted-foreground">Bank payout fee</p>
                <p className="font-semibold">{fmt(result.stables)} USDC</p>
              </div>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            {PRESETS.map((p) => (
              <button key={p} type="button" onClick={() => setAmount(String(p))} className="flex-1 rounded-full border border-border py-1 text-xs font-medium hover:border-home-brand">
                {p}
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {KEYS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => press(k)}
                aria-label={k === "del" ? "Delete" : k}
                className="flex h-12 items-center justify-center rounded-xl bg-home-surface text-lg font-semibold transition active:scale-95 hover:bg-muted"
              >
                {k === "del" ? <Delete className="size-5" /> : k}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setAmount("")} className="mt-2 w-full rounded-xl py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
            Clear
          </button>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">Estimate only · DEMO. Final numbers come from Stables at checkout.</p>
        </div>
      </div>
    </section>
  );
}
