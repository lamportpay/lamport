import { useState } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";
import { ECOSYSTEM_REGIONS, publicEcosystem, type EcosystemCompany } from "@/content/ecosystem";

function PartnerLogo({ c }: { c: EcosystemCompany }) {
  const [broken, setBroken] = useState(false);
  if (!c.logo || broken) {
    return (
      <span className="text-2xl font-semibold tracking-tight text-primary">
        {c.name
          .split(" ")
          .slice(0, 2)
          .map((w) => w[0])
          .join("")}
      </span>
    );
  }
  return (
    <img
      src={c.logo}
      alt={`${c.name} logo`}
      loading="lazy"
      onError={() => setBroken(true)}
      className="max-h-16 max-w-[75%] object-contain transition duration-300 group-hover:scale-105"
    />
  );
}

/** Business ecosystem on the About page: shared content, no backing or endorsement claims. */
export function AboutPartners() {
  const companies = publicEcosystem();
  if (!companies.length) return null;
  const regionLabel = (id: string) => ECOSYSTEM_REGIONS.find((r) => r.id === id)?.label ?? id;
  return (
    <section id="ecosystem" className="max-w-6xl mx-auto px-5 pb-16 md:pb-24">
      <div className="flex flex-col gap-3 border-t border-border pt-12 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Business ecosystem
          </div>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold leading-tight">
            Companies ready to adopt LamportPay.
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">
            Businesses across investment, logistics, property and digital services that plan to
            use LamportPay for stablecoin-to-bank payouts.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
          Onboarding PLANNED
        </span>
      </div>

      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((c) => (
          <li key={c.name}>
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex h-36 items-center justify-center border-b border-border bg-gradient-to-br from-primary/10 via-background to-violet-500/10">
                <PartnerLogo c={c} />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
                    {c.sector}
                  </span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <MapPin className="size-3" aria-hidden="true" />
                    {regionLabel(c.region)}
                  </span>
                </div>
                <h3 className="mt-3 font-semibold leading-snug">{c.name}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">
                  {c.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Visit website
                  <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        Adoption readiness only — not live integrations, financial backing or bank endorsement.
      </p>
    </section>
  );
}
