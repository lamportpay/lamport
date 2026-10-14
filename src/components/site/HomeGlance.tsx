/**
 * Compact "Crypto in → Local money out" card under the hero.
 * Shows only what works in TEST MODE today: SOL/USDC in, USD/GBP/INR/PHP out.
 */
import { ArrowRight } from "lucide-react";
import { TokenIcon } from "@/components/app/TokenIcon";

const CRYPTO_IN = [
  { symbol: "sol", label: "SOL" },
  { symbol: "usdc", label: "USDC" },
] as const;

const MONEY_OUT = [
  { symbol: "$", code: "USD" },
  { symbol: "£", code: "GBP" },
  { symbol: "₹", code: "INR" },
  { symbol: "₱", code: "PHP" },
];

export function HomeGlance() {
  return (
    <section aria-label="Crypto in, local money out" className="py-6">
      <div className="home-container">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Crypto in</span>
            {CRYPTO_IN.map(({ symbol, label }) => (
              <span key={symbol} className="inline-flex items-center gap-1.5 text-sm font-semibold" title={label}>
                <TokenIcon symbol={symbol} size={22} />
                {label}
              </span>
            ))}
          </div>
          <ArrowRight aria-hidden className="size-5 text-home-brand" />
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Local money out</span>
            {MONEY_OUT.map(({ symbol, code }) => (
              <span
                key={code}
                title={code}
                aria-label={code}
                className="grid size-8 place-items-center rounded-full bg-home-brand/10 text-sm font-bold text-home-brand"
              >
                {symbol}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
