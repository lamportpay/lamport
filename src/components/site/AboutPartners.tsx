import { useState } from "react";
import { publicEcosystem, type EcosystemCompany } from "@/content/ecosystem";

function PartnerLogo({ c }: { c: EcosystemCompany }) {
  const [broken, setBroken] = useState(false);
  if (!c.logo || broken) {
    return <span className="text-sm font-semibold text-muted-foreground">{c.name}</span>;
  }
  return (
    <img
      src={c.logo}
      alt={c.name}
      loading="lazy"
      onError={() => setBroken(true)}
      className="h-12 w-auto max-w-[160px] object-contain opacity-80"
    />
  );
}

/** Transparent, auto-moving partner logo strip for the About hero. Not clickable by design. */
export function AboutPartners() {
  const companies = publicEcosystem();
  if (!companies.length) return null;
  const row = (dup: boolean) =>
    companies.map((c) => (
      <li
        key={`${dup ? "d" : "a"}-${c.name}`}
        aria-hidden={dup || undefined}
        className={`flex shrink-0 items-center px-8 ${dup ? "partner-marquee-dup" : ""}`}
      >
        <PartnerLogo c={c} />
      </li>
    ));
  return (
    <div className="mt-12" aria-label="Business ecosystem partners">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Business ecosystem · onboarding planned
      </p>
      <div className="partner-marquee mt-5 overflow-hidden pointer-events-none select-none">
        <ul className="partner-marquee-track flex w-max items-center">
          {row(false)}
          {row(true)}
        </ul>
      </div>
    </div>
  );
}
