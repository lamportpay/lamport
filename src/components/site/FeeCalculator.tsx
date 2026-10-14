import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronDown, Info } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { percentageModel, splitTotal } from "@/lib/payments/fee-math";

/**
 * Payout estimate calculator — two-panel "You send / Recipient gets" layout.
 * Stables fees mirror the sandbox quotes recorded on 30 Sep 2026:
 * 0.25% platform fee + a fixed bank payout (payment-method) fee per currency.
 * Rates: live mid-market reference with fallbacks. Estimate only — Stables quotes the real numbers.
 */
const CURRENCIES = [
  { code: "USD", country: "United States", fallbackRate: 1, payoutFee: 5 },
  { code: "GBP", country: "United Kingdom", fallbackRate: 0.79, payoutFee: 1 },
  { code: "INR", country: "India", fallbackRate: 88.5, payoutFee: 5 },
  { code: "PHP", country: "Philippines", fallbackRate: 58.5, payoutFee: 0.34 },
] as const;
type CurrencyCode = (typeof CURRENCIES)[number]["code"];
const RATES_URL = "https://open.er-api.com/v6/latest/USD";
const STABLES_PLATFORM = 0.0025;
const MODEL = percentageModel(200n);
const PRESETS = [100, 250, 500, 1000];
const fmt = (n: number, d = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

function compute(value: number, cur: (typeof CURRENCIES)[number], rate: number) {
  const { netMinor, feeMinor } = splitTotal(BigInt(Math.round(value * 1e6)), MODEL);
  const net = Number(netMinor) / 1e6;
  const ours = Number(feeMinor) / 1e6;
  const stables = net * STABLES_PLATFORM + cur.payoutFee;
  const arriving = Math.max(0, net - stables);
  return { ours, stables, local: arriving * rate, totalPct: ((ours + stables) / value) * 100 };
}

export function FeeCalculator() {
  const [amount, setAmount] = useState("500");
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

  const value = Number(amount);
  const result = useMemo(
    () => (value >= 15 && value <= 1_000_000 ? compute(value, cur, rate) : null),
    [value, cur, rate],
  );

  return (
    <section className="home-section border-y border-border bg-home-surface" id="costs">
      <div className="home-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="home-eyebrow">Payout calculator</p>
          <h2 className="home-heading">See what arrives in the bank.</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Our fee is 2%. The bank payout fee is fixed, so the bigger the payment, the smaller the total share.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl overflow-hidden rounded-3xl border border-border bg-background shadow-xl md:grid-cols-2">
          {/* You send */}
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">You send</p>
              <span className="rounded-full bg-home-brand/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-home-brand">Demo</span>
            </div>

            <div className="mt-4 flex items-end gap-3">
              <input
                value={amount}
                inputMode="decimal"
                aria-label="Amount you send in USDC"
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.]/g, "");
                  if ((v.match(/\./g) ?? []).length > 1) return;
                  if (v.includes(".") && v.split(".")[1].length > 2) return;
                  if (Number(v) > 1_000_000) return;
                  setAmount(v);
                }}
                className="w-full min-w-0 bg-transparent text-5xl font-semibold tabular-nums tracking-tight outline-none placeholder:text-muted-foreground/40"
                placeholder="0"
              />
              <span className="mb-1.5 shrink-0 rounded-full border border-border bg-home-surface px-3.5 py-1.5 text-sm font-semibold">USDC</span>
            </div>

            <div className="mt-5 flex gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(String(p))}
                  className={`flex-1 rounded-full border py-1.5 text-xs font-medium transition ${Number(amount) === p ? "border-home-brand bg-home-brand/10 text-home-brand" : "border-border hover:border-home-brand"}`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="fc-country" className="text-xs font-medium text-muted-foreground">Recipient country</label>
                <div className="relative mt-1.5">
                  <select
                    id="fc-country"
                    value={code}
                    onChange={(e) => setCode(e.target.value as CurrencyCode)}
                    className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium outline-none transition focus:border-home-brand"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.country}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Payout method</p>
                <p className="mt-1.5 rounded-xl border border-home-brand/40 bg-home-brand/5 px-4 py-3 text-center text-sm font-semibold text-home-brand">Bank account</p>
              </div>
            </div>
          </div>

          {/* Recipient gets */}
          <div className="border-t border-border bg-home-surface/60 p-6 sm:p-8 md:border-l md:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recipient gets</p>
            <p
              key={result ? `${cur.code}-${result.local.toFixed(2)}` : "none"}
              className="mt-4 truncate text-4xl font-semibold tabular-nums tracking-tight motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 sm:text-5xl"
              aria-live="polite"
            >
              {result ? (
                <>
                  {fmt(result.local)} <span className="text-xl font-medium text-muted-foreground">{cur.code}</span>
                </>
              ) : (
                <span className="text-2xl text-muted-foreground">Min. 15 USDC</span>
              )}
            </p>

            <dl className="mt-6 space-y-3 border-t border-border pt-5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Estimated USDC settlement</dt>
                <dd className="font-medium tabular-nums">{value > 0 ? `${fmt(value)} USDC` : "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">FX rate{liveRates[code] ? " · live" : ""}</dt>
                <dd className="font-medium tabular-nums">1 USD = {fmt(rate, rate < 2 ? 2 : 1)} {cur.code}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Partner payout fee</dt>
                <dd className="font-medium tabular-nums">{result ? `$${fmt(result.stables)}` : "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">LamportPay fee</dt>
                <dd className="font-medium tabular-nums">{result ? `$${fmt(result.ours)}` : "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Estimated delivery</dt>
                <dd className="font-medium">Under 5 minutes</dd>
              </div>
            </dl>

            <Link
              to="/pay"
              className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-[image:var(--home-gradient)] px-6 py-4 text-sm font-semibold text-primary-foreground shadow-lg transition motion-safe:hover:scale-[1.01] motion-safe:active:scale-[0.99]"
            >
              Send a payment <ArrowRight className="size-4" />
            </Link>
            <p className="mt-4 flex items-start justify-center gap-1.5 text-center text-[11px] leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 size-3 shrink-0" />
              Demo values only. No real crypto, fiat, or KYC is processed.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-sm overflow-hidden rounded-xl border border-border bg-background text-sm">
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
    </section>
  );
}
