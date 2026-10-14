import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAYMENT_COSTS } from "@/content/payment-flow";
import { percentageModel, splitTotal } from "@/lib/payments/fee-math";

/** Illustrative reference rates only — never a quote. Stables quotes the real rate at checkout. */
const CURRENCIES = [
  { code: "USD", country: "United States", rate: 1 },
  { code: "GBP", country: "United Kingdom", rate: 0.75 },
  { code: "INR", country: "India", rate: 84 },
  { code: "PHP", country: "Philippines", rate: 57 },
] as const;

const MODEL = percentageModel(200n);
const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export function FeeCalculator() {
  const [amount, setAmount] = useState("150");
  const [code, setCode] = useState<(typeof CURRENCIES)[number]["code"]>("GBP");
  const currency = CURRENCIES.find((c) => c.code === code)!;

  const result = useMemo(() => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || value > 1_000_000) return null;
    const total = BigInt(Math.round(value * 1e6));
    const { netMinor, feeMinor } = splitTotal(total, MODEL);
    const net = Number(netMinor) / 1e6;
    return { total: value, fee: Number(feeMinor) / 1e6, net, local: net * currency.rate };
  }, [amount, currency.rate]);

  const rows = result
    ? [
        { label: "You send", value: `${fmt(result.total)} USDC` },
        { label: "LamportPay fee", value: `− ${fmt(result.fee)} USDC` },
        { label: "Sent to Stables", value: `${fmt(result.net)} USDC` },
        { label: "Payout partner fee", value: "Quoted by Stables" },
        { label: "Swap & network costs", value: "Shown before approval" },
      ]
    : [];

  return (
    <section className="home-section border-y border-border bg-home-surface" id="costs">
      <div className="home-container grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="home-eyebrow">The business model</p>
          <h2 className="home-heading">One service fee.<br />No hidden layers.</h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            LamportPay earns a single fee, taken out of the total you send. Provider and network costs are shown separately.
          </p>
          <dl className="mt-6 divide-y divide-border border-y border-border">
            {PAYMENT_COSTS.map((cost) => (
              <div key={cost.title} className="py-4">
                <dt className="text-sm font-semibold">{cost.title}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{cost.detail}</dd>
              </div>
            ))}
          </dl>
          <Button asChild variant="link" className="mt-4 px-0 text-home-brand">
            <Link to="/how-it-works">How payments work <ArrowRight /></Link>
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Calculator className="size-6 text-home-brand" />
            <div>
              <h3 className="text-lg font-semibold">Payout estimate calculator</h3>
              <p className="text-xs text-muted-foreground">See where every part of your payment goes.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="calc-amount">You send (USDC)</Label>
              <Input id="calc-amount" inputMode="decimal" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calc-currency">Payout currency</Label>
              <select
                id="calc-currency"
                value={code}
                onChange={(e) => setCode(e.target.value as typeof code)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.country}</option>)}
              </select>
            </div>
          </div>
          {result ? (
            <>
              <dl className="mt-6 divide-y divide-border">
                {rows.map((r) => (
                  <div key={r.label} className="flex items-center justify-between py-3 text-sm">
                    <dt className="text-muted-foreground">{r.label}</dt>
                    <dd className="font-medium">{r.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 rounded-xl bg-home-surface p-4">
                <p className="text-xs text-muted-foreground">Estimated payout before partner costs</p>
                <p className="mt-1 text-3xl font-semibold text-home-brand">≈ {fmt(result.local)} {currency.code}</p>
              </div>
            </>
          ) : (
            <p className="mt-6 text-sm text-destructive">Enter an amount greater than 0.</p>
          )}
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            ESTIMATE ONLY · DEMO. Exchange rates are illustrative, not quotes. Stables provides the real rate and its fees at checkout. Fiat payouts are DISABLED in TEST MODE.
          </p>
        </div>
      </div>
    </section>
  );
}
