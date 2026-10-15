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
  { code: "USD", country: "US", label: "US dollar" },
  { code: "GBP", country: "GB", label: "British pound" },
  { code: "INR", country: "IN", label: "Indian rupee" },
  { code: "PHP", country: "PH", label: "Philippine peso" },
];

export function HomeGlance() {
  return (
    <div
      aria-label="Crypto in, local money out"
      className="home-currency-summary mx-auto mt-5 max-w-xl"
    >
          <div className="home-currency-crypto" aria-label="Crypto in">
            {CRYPTO_IN.map(({ symbol, label }) => (
              <span key={symbol} className="inline-flex items-center gap-1.5 text-sm font-semibold" title={label}>
                <TokenIcon symbol={symbol} size={22} />
                {label}
              </span>
            ))}
          </div>
          <ArrowRight aria-hidden className="size-5 text-home-brand" />
          <div className="home-currency-fiat" aria-label="Local money out">
            {MONEY_OUT.map(({ code, country, label }) => (
              <span key={code} className="inline-flex items-center gap-1.5 text-sm font-semibold" title={label}>
                <Flag code={country} size={22} />
                {code}
              </span>
            ))}
          </div>
    </div>
  );
}
