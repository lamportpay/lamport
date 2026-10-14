/**
 * Homepage "at a glance" strip directly under the hero: the crypto a user can
 * send in, and the countries / local currencies it can pay out to. Compact by
 * design — the full bank explorer lives in HomeBankNetwork further down.
 */
import { ArrowRight } from "lucide-react";
import bitcoinLogo from "@/assets/tokens/bitcoin.png.asset.json";
import ethereumLogo from "@/assets/tokens/ethereum.png.asset.json";
import { Flag } from "@/components/app/Flag";
import { TokenIcon } from "@/components/app/TokenIcon";
import { DEFAULT_PAYOUT_COUNTRIES, payoutCountriesFrom } from "@/lib/payout-countries";

const CRYPTO_IN = [
  { symbol: "sol", label: "SOL", note: "Swapped to USDC" },
  { symbol: "usdc", label: "USDC", note: "Sent directly" },
  { symbol: "usdt", label: "USDT", note: "Planned" },
] as const;

const DESTINATIONS = payoutCountriesFrom(DEFAULT_PAYOUT_COUNTRIES);

export function HomeGlance() {
  return (
    <section aria-label="Supported crypto and payout countries" className="border-b border-border bg-card">
      <div className="home-container grid gap-6 py-8 md:grid-cols-[auto_auto_1fr] md:items-center md:gap-8">
        <div>
          <p className="home-eyebrow">Crypto in</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CRYPTO_IN.map(({ symbol, label, note }) => (
              <span
                key={symbol}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5"
                title={note}
              >
                <TokenIcon symbol={symbol} size={20} />
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-[11px] text-muted-foreground">{note}</span>
              </span>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase text-home-brand">Next · Planned</span>
            {[
              { name: "BTC", logo: bitcoinLogo.url },
              { name: "ETH", logo: ethereumLogo.url },
            ].map((a) => (
              <span
                key={a.name}
                className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border bg-background px-2.5 py-1"
                title={`${a.name} deposits are planned, not enabled`}
              >
                <img src={a.logo} alt="" width={16} height={16} className="size-4" />
                <span className="text-xs font-medium">{a.name}</span>
              </span>
            ))}
          </div>
        </div>
        <ArrowRight
          aria-hidden
          className="hidden size-6 shrink-0 text-home-brand md:block"
          strokeWidth={1.6}
        />
        <div className="min-w-0">
          <p className="home-eyebrow">Local money out · {DESTINATIONS.length} countries</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {DESTINATIONS.map(({ code, currency }) => (
              <span
                key={code}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1"
              >
                <Flag code={code} size={18} />
                <span className="text-xs font-medium">{currency}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
