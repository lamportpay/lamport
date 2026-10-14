import { useState } from "react";
import { Landmark, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BankIcon } from "@/components/app/BankIcon";
import { Flag } from "@/components/app/Flag";
import { Button } from "@/components/ui/button";
import bitcoinLogo from "@/assets/tokens/bitcoin.png.asset.json";
import ethereumLogo from "@/assets/tokens/ethereum.png.asset.json";

const destinations = [
  {
    code: "US",
    name: "United States",
    currency: "USD",
    banks: ["JPMorgan Chase", "Bank of America", "Citibank", "Wells Fargo"],
  },
  {
    code: "GB",
    name: "United Kingdom",
    currency: "GBP",
    banks: ["Barclays", "HSBC UK", "NatWest", "Monzo"],
  },
  {
    code: "IN",
    name: "India",
    currency: "INR",
    banks: ["HDFC Bank", "ICICI Bank", "Axis Bank", "Bank of Baroda"],
  },
  {
    code: "PH",
    name: "Philippines",
    currency: "PHP",
    banks: [
      "Banco De Oro Unibank, Inc.",
      "Bank of the Philippine Islands (BPI)",
      "Metropolitan Bank and Trust Company (Metrobank)",
      "Union Bank of the Philippines (UBP)",
    ],
  },
];
const shortNames: Record<string, string> = {
  "Banco De Oro Unibank, Inc.": "BDO Unibank",
  "Bank of the Philippine Islands (BPI)": "BPI",
  "Metropolitan Bank and Trust Company (Metrobank)": "Metrobank",
  "Union Bank of the Philippines (UBP)": "UnionBank",
};

export function HomeBankNetwork() {
  const [country, setCountry] = useState("GB");
  const destination = destinations.find((d) => d.code === country) ?? destinations[0];
  return (
    <section className="home-section bg-home-surface border-b border-border" id="banks">
      <div className="home-container">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="home-eyebrow">Bank destinations</p>
            <h2 className="home-heading">Familiar banks. Local currencies.</h2>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Explore examples in our test-mode destination picker. Final bank availability is
              checked by Stables.
            </p>
          </div>
          <Landmark className="hidden size-10 text-home-brand md:block" strokeWidth={1.3} />
        </div>
        <div
          role="group"
          aria-label="Bank destination country"
          className="mt-8 grid grid-cols-2 gap-2 md:flex md:flex-wrap"
        >
          {destinations.map((d) => (
            <Button
              key={d.code}
              variant="outline"
              aria-pressed={country === d.code}
              onClick={() => setCountry(d.code)}
              className={`h-12 justify-start gap-2 whitespace-normal px-3 text-left text-xs md:text-sm ${country === d.code ? "border-home-brand bg-home-tint text-home-brand" : "bg-card"}`}
            >
              <Flag code={d.code} size={24} />
              {d.name}
            </Button>
          ))}
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
          {destination.banks.map((name) => (
            <div
              key={name}
              className="flex min-h-24 items-center gap-4 rounded-lg border border-border bg-card p-5"
            >
              <BankIcon name={name} country={destination.code} size={44} />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{shortNames[name] ?? name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {destination.currency} · Bank account
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Illustrative bank listings, not direct bank partnerships or endorsements. Fiat payout is
            DISABLED; sandbox support varies by country and currency.
          </p>
          <Button variant="link" asChild className="px-0 text-home-brand">
            <Link to="/pay">
              View payment options <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
      <div className="home-container mt-12 border-t border-border pt-10" id="future-currencies">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="home-eyebrow">Expansion outlook · PLANNED</p>
            <h3 className="home-heading">More choice. Wider reach.</h3>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">New assets and priority markets, one connected ambition.</p>
        </div>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div>
            <h4 className="border-b border-border pb-3 text-xs font-semibold uppercase">Digital assets</h4>
            <div className="divide-y divide-border">
              {[{ name: "Bitcoin", code: "BTC", logo: bitcoinLogo.url }, { name: "Ethereum", code: "ETH", logo: ethereumLogo.url }].map(asset => (
                <div key={asset.code} className="flex items-center gap-4 py-5">
                  <img src={asset.logo} alt={`${asset.name} logo`} width={32} height={32} className="size-8 shrink-0 object-contain" />
                  <div className="flex-1"><p className="text-sm font-semibold">{asset.name}</p><p className="mt-1 text-xs text-muted-foreground">{asset.code} · Future asset route</p></div>
                  <span className="text-[10px] font-semibold text-home-brand">PLANNED</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="border-b border-border pb-3 text-xs font-semibold uppercase">Priority markets</h4>
            <div className="divide-y divide-border">
              {[{ name: "Pakistan", code: "PK", currency: "PKR" }, { name: "Nigeria", code: "NG", currency: "NGN" }].map(market => (
                <div key={market.code} className="flex items-center gap-4 py-5">
                  <Flag code={market.code} size={32} />
                  <div className="flex-1"><p className="text-sm font-semibold">{market.name}</p><p className="mt-1 text-xs text-muted-foreground">{market.currency} · Market development</p></div>
                  <span className="text-[10px] font-semibold text-home-brand">PLANNED</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-5 max-w-3xl text-xs leading-relaxed text-muted-foreground">Expansion plans—not enabled deposits or confirmed payout corridors. Pakistan and Nigeria coverage requires provider and compliance validation; no bank partnership or launch date is implied.</p>
      </div>
    </section>
  );
}
