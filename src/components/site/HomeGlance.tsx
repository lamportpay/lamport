/**
 * Compact "Crypto in → Local money out" summary integrated into the hero.
 * Shows only what works in TEST MODE today: SOL/USDC in, USD/GBP/INR/PHP out.
 */
import { ArrowRight } from "lucide-react";
import { TokenIcon } from "@/components/app/TokenIcon";
import { Flag } from "@/components/app/Flag";

const CRYPTO_IN = [
  { symbol: "sol", label: "SOL" },
  { symbol: "usdc", label: "USDC" },
] as const;

const MONEY_OUT = [
  { code: "USD", label: "US dollar" },
  { code: "GBP", label: "British pound" },
  { code: "INR", label: "Indian rupee" },
  { code: "PHP", label: "Philippine peso" },
];

export function HomeGlance() {
  return (
    <div aria-label="Crypto in, local money out" className="home-currency-summary mx-auto mt-5 flex max-w-xl flex-wrap items-center justify-center gap-3 sm:gap-5">
          <div className="flex items-center gap-3" aria-label="Crypto in">
            {CRYPTO_IN.map(({ symbol, label }) => (
              <span key={symbol} className="inline-flex items-center gap-1.5 text-sm font-semibold" title={label}>
                <TokenIcon symbol={symbol} size={22} />
                {label}
              </span>
            ))}
          </div>
          <ArrowRight aria-hidden className="size-5 text-home-brand" />
          <div className="flex items-center gap-3" aria-label="Local money out">
            {MONEY_OUT.map(({ code, label }) => (
              <span key={code} className="inline-flex items-center gap-1.5 text-sm font-semibold" title={label}>
                <Flag code={code} size={22} />
                {code}
              </span>
            ))}
          </div>
    </div>
  );
}
