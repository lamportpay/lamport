import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronDown, Info, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { percentageModel, splitTotal } from "@/lib/payments/fee-math";
import { Button } from "@/components/ui/button";

/**
 * Payout estimate calculator — two-panel "You send / Recipient gets" layout.
 * Stables fees mirror the sandbox quotes recorded on 30 Sep 2026:
 * 0.25% platform fee + a fixed bank payout (payment-method) fee per currency.
 * Rates: live mid-market reference with fallbacks. Estimate only — Stables quotes the real numbers.
 */
const CURRENCIES = [
  { code: "USD", iso: "US", country: "United States", fallbackRate: 1, payoutFee: 5 },
  { code: "GBP", iso: "GB", country: "United Kingdom", fallbackRate: 0.79, payoutFee: 1 },
  { code: "INR", iso: "IN", country: "India", fallbackRate: 88.5, payoutFee: 5 },
  { code: "PHP", iso: "PH", country: "Philippines", fallbackRate: 58.5, payoutFee: 0.34 },
] as const;
type CurrencyCode = (typeof CURRENCIES)[number]["code"];
const RATES_URL = "https://open.er-api.com/v6/latest/USD";
const SOL_MINT = "So11111111111111111111111111111111111111112";
const SOL_PRICE_URL = `https://lite-api.jup.ag/price/v3?ids=${SOL_MINT}`;
const REFRESH_MS = 30_000;
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
  const [token, setToken] = useState<"USDC" | "SOL">("USDC");
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const navigate = useNavigate();
  const [liveRates, setLiveRates] = useState<Partial<Record<CurrencyCode, number>>>({});
  // Brief "fetching a quote" state whenever the inputs change, so the panel
  // feels like a live server quote rather than instant local math.
  const [quoting, setQuoting] = useState(false);
  const cur = CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
  const rate = liveRates[code] ?? cur.fallbackRate;

  useEffect(() => {
    if (!Number(amount)) return;
    setQuoting(true);
    const id = window.setTimeout(() => setQuoting(false), 550);
    return () => window.clearTimeout(id);
  }, [amount, code, token]);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
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
          setUpdatedAt(new Date());
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

  const entered = Number(amount);
  // Value in USDC: SOL is priced live via Jupiter.
  const value = token === "SOL" ? (solPrice ? entered * solPrice : 0) : entered;
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

        <div className="relative mx-auto mt-10 max-w-5xl">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-[linear-gradient(135deg,color-mix(in_oklab,var(--home-brand)_35%,transparent),transparent_40%,color-mix(in_oklab,var(--home-brand)_20%,transparent))] opacity-70 blur-xl"
          />
          <div className="relative grid overflow-hidden rounded-3xl border border-home-brand/25 bg-background shadow-2xl shadow-home-brand/10 ring-1 ring-home-brand/10 md:grid-cols-2">
          {/* You send */}
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">You send</p>
              <span className="flex items-center gap-1.5 rounded-full bg-home-brand/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-home-brand"><span className="size-1.5 rounded-full bg-home-brand motion-safe:animate-pulse" />Live rates</span>
            </div>

            <div className="mt-4 flex items-end gap-3">
              <input
                value={amount}
                inputMode="decimal"
                aria-label={`Amount you send in ${token}`}
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
              <div className="relative mb-1.5 shrink-0">
                <select
                  aria-label="Token you send"
                  value={token}
                  onChange={(e) => setToken(e.target.value as "USDC" | "SOL")}
                  className="appearance-none rounded-full border border-border bg-home-surface py-1.5 pl-3.5 pr-8 text-sm font-semibold outline-none focus:border-home-brand"
                >
                  <option value="USDC">USDC</option>
                  <option value="SOL">SOL</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <p className="mt-5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Quick amounts</p>
            <div className="mt-2 grid grid-cols-4 gap-2 rounded-xl bg-home-surface p-1.5">
              {PRESETS.map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant="outline"
                  aria-pressed={Number(amount) === p}
                  onClick={() => setAmount(String(p))}
                  className={`h-10 min-w-0 flex-1 rounded-lg px-1 text-xs font-medium transition ${Number(amount) === p ? "border-home-brand bg-home-tint text-home-brand" : "border-border hover:border-home-brand"}`}
                >
                  {p}
                </Button>
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
          <div className="relative border-t border-border bg-home-surface/60 p-6 sm:p-8 md:border-l md:border-t-0">
            {quoting && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-none bg-home-surface/80 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in" role="status" aria-live="polite">
                <Loader2 className="size-7 text-home-brand motion-safe:animate-spin" />
                <p className="text-xs font-medium text-muted-foreground">Fetching live quote…</p>
              </div>
            )}
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
                <span className="text-2xl text-muted-foreground">{token === "SOL" && !solPrice ? "Loading SOL price…" : "Min. 15 USDC"}</span>
              )}
            </p>

            <dl className="mt-6 space-y-3 border-t border-border pt-5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Estimated USDC settlement</dt>
                <dd className="font-medium tabular-nums">{value > 0 ? `${fmt(value)} USDC` : "—"}</dd>
              </div>
              {token === "SOL" && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">SOL price · Jupiter</dt>
                  <dd className="font-medium tabular-nums">{solPrice ? `$${fmt(solPrice)}` : "—"}</dd>
                </div>
              )}
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

            <Button
              type="button"
              disabled={!result}
              onClick={() =>
                void navigate({
                  to: "/pay",
                  search: { amount: value.toFixed(2), country: cur.iso },
                })
              }
              className="mt-6 h-12 w-full gap-2 rounded-lg bg-home-brand px-4 text-sm font-semibold text-primary-foreground shadow-lg transition disabled:opacity-50 motion-safe:hover:scale-[1.01] motion-safe:active:scale-[0.99]"
            >
              Get live quote & pay <ArrowRight className="size-4" />
            </Button>
            <p className="mt-4 flex items-start justify-center gap-1.5 text-center text-[11px] leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 size-3 shrink-0" />
              Rates refresh every 30 s{updatedAt ? ` · updated ${updatedAt.toLocaleTimeString()}` : ""}. Your firm quote comes from Stables on the payment page.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
