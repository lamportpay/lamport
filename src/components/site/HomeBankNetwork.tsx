import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BankIcon } from "@/components/app/BankIcon";
import { Button } from "@/components/ui/button";
import { FlowControls } from "@/components/site/FlowPresentation";
import { useFlowPlayback } from "@/hooks/use-flow-playback";
import { BankRestrictions } from "@/components/site/BankRestrictions";

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
  const flow = useFlowPlayback(destinations.length, 1);
  const destination = destinations[flow.active] ?? destinations[0];
  const country = destination.code;
  return (
    <section
      className="home-section relative isolate overflow-hidden bg-home-surface border-b border-border"
      id="banks"
    >
      <div className="home-orbits home-orbits-corner-left" aria-hidden="true">
        <span className="home-orbit home-orbit-outer" />
        <span className="home-orbit home-orbit-middle" />
        <span className="home-orbit home-orbit-inner" />
      </div>
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
        <div ref={flow.ref} {...flow.focusProps} data-running={flow.inView && flow.playing && !flow.reduced} className="flow-presentation mt-8 grid overflow-hidden rounded-lg border border-border md:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
          <div className="flow-spotlight p-6 sm:p-8">
            <div key={country} className="flow-detail">
              <p className="text-xs font-semibold text-home-brand">BANK DESTINATIONS · DEMO / SIMULATED</p>
              <div className="mt-7 flex items-center gap-4"><Flag code={country} size={44} /><span className="text-4xl font-semibold text-home-ink">{destination.currency}</span></div>
              <h3 className="mt-4 text-2xl font-semibold text-home-ink">{destination.name}</h3>
              <p className="mt-3 text-sm text-muted-foreground">Local currency. Familiar bank accounts. Availability checked by Stables.</p>
            </div>
            <div role="group" aria-label="Bank destination country" className="mt-6 grid grid-cols-2 gap-2">
              {destinations.map((d, index) => <Button key={d.code} variant="outline" aria-pressed={country === d.code} onClick={() => flow.pick(index)} className={`h-12 justify-start gap-2 whitespace-normal px-3 text-left text-xs ${country === d.code ? "border-home-brand bg-home-tint text-home-brand" : "bg-card"}`}><Flag code={d.code} size={24} />{d.name}</Button>)}
            </div>
            <FlowControls flow={flow} count={destinations.length} label="bank destinations" />
          </div>
          <div className="bank-flow-scene p-6 sm:p-8">
            <div className="flex items-center justify-center gap-3 text-sm font-semibold"><img src="/tokens/usdc.svg" width="28" height="28" alt="" />USDC <ArrowRight className="size-4 text-home-brand" /><Flag code={country} size={28} />{destination.currency}</div>
            <div className="bank-flow-trunk" aria-hidden="true"><span /></div>
            <div key={country} className="grid gap-3 sm:grid-cols-2">
              {destination.banks.map((name) => <div key={name} className="bank-flow-item flex min-h-28 items-center gap-3 rounded-lg border border-border bg-card p-4"><BankIcon name={name} country={country} size={44} /><div className="min-w-0"><p className="text-sm font-semibold">{shortNames[name] ?? name}</p><p className="mt-1 text-xs text-muted-foreground">{destination.currency} · Bank account</p></div></div>)}
            </div>
            <p className="mt-5 text-center text-[10px] font-semibold text-home-brand">ILLUSTRATIVE ROUTE · FIAT PAYOUT DISABLED</p>
          </div>
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
      <BankRestrictions />
    </section>
  );
}
