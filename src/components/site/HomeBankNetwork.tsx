import { useState } from "react";
import { Landmark, ArrowRight, Bitcoin, Coins, Globe2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BankIcon } from "@/components/app/BankIcon";
import { Flag } from "@/components/app/Flag";
import { Button } from "@/components/ui/button";
import { FUTURE_EXPLORATION } from "@/content/roadmap";

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
        <p className="home-eyebrow">Future currency coverage · PLANNED</p>
        <h3 className="home-heading">More assets. More local destinations.</h3>
        <div className="mt-7 grid gap-6 md:grid-cols-3">
          {[
            { title: "Bitcoin · BTC", Icon: Bitcoin, detail: "A future Bitcoin intake and conversion route. Deposits are not available today." },
            { title: "Ethereum · ETH", Icon: Coins, detail: "A future Ethereum intake and conversion route. Deposits are not available today." },
            { title: "More local currencies", Icon: Globe2, detail: FUTURE_EXPLORATION[5].detail },
          ].map(({ title, Icon, detail }) => (
            <div key={title} className="border-t-2 border-home-brand/40 pt-5">
              <Icon className="mb-4 size-7 text-home-brand" strokeWidth={1.5} />
              <p className="text-[10px] font-semibold text-home-brand">PLANNED</p>
              <h4 className="mt-2 text-lg font-semibold">{title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Future exploration, not enabled payment options. Additional local currencies and launch dates
          are not yet confirmed; availability depends on validated routes and payout coverage.
        </p>
      </div>
    </section>
  );
}
