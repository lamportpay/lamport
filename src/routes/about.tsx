import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Globe2, ShieldCheck, Wallet } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { pageSeo, breadcrumbSchema } from "@/lib/seo";
import { AboutPartners } from "@/components/site/AboutPartners";
import { COMPANY } from "@/lib/company-profile";
import { TEAM } from "@/lib/team";

export const Route = createFileRoute("/about")({
  head: () => ({
    ...pageSeo({
      path: "/about",
      title: "Lamport Pay Ltd — Company profile & founder Zoaib Ali",
      description:
        "Lamport Pay Ltd (11464834): incorporated 16 July 2018, registered in London, led by founder and CEO Zoaib Ali. Explore the company and its sandbox payment platform.",
    }),
    scripts: [{ type: "application/ld+json", children: JSON.stringify(breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Company profile", path: "/about" }])) }],
  }),
  component: About,
});

const values = [
  {
    icon: Wallet,
    title: "Non-custodial by design",
    detail:
      "Funds move from the customer's own wallet. LamportPay never holds customer money, private keys or balances.",
  },
  {
    icon: ShieldCheck,
    title: "Built on licensed partners",
    detail:
      "Identity checks and bank payouts run through Stables. Swap quotes come from Jupiter. We do not offer our own API — we build on theirs.",
  },
  {
    icon: Globe2,
    title: "Local money, globally",
    detail:
      "Our goal is simple: crypto in, local money out — starting with the US, UK, India and the Philippines in our sandbox environment.",
  },
  {
    icon: Building2,
    title: "Honest about status",
    detail:
      "Every capability is labeled Live, Sandbox, Disabled or Planned. We never claim a payout, partnership or licence we do not have.",
  },
];

const facts = [
  { label: "Brand", value: "LamportPay" },
  { label: "Legal entity", value: "Lamport Pay Ltd" },
  { label: "Company number", value: COMPANY.number },
  { label: "Incorporated", value: COMPANY.incorporationLabel },
  { label: "Company status", value: COMPANY.status },
  { label: "Company type", value: COMPANY.type },
  { label: "Founder & CEO", value: COMPANY.founder.name },
  { label: "Registered office", value: COMPANY.office },
  { label: "Network", value: "Solana" },
  { label: "Settlement asset", value: "USDC" },
  { label: "Payout partner", value: "Stables" },
  { label: "Stage", value: "Sandbox" },
];

function About() {
  const founder = TEAM.find((member) => member.slug === "zoaib-ali");
  return (
    <SiteLayout>
      <section className="max-w-6xl mx-auto px-5 py-12 md:py-16">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">About us</div>
        <h1 className="mt-3 max-w-3xl text-4xl md:text-5xl font-semibold leading-tight">
          Lamport Pay Ltd
        </h1>
        <p className="mt-3 text-xl font-medium text-primary">Crypto in. Local money out.</p>
        <p className="mt-4 max-w-3xl text-lg text-muted-foreground leading-relaxed">
          LamportPay is built by Lamport Pay Ltd. We help people and businesses turn stablecoins on
          Solana into money in a local bank account — simply, transparently and without handing
          their funds to us.
        </p>
        <AboutPartners />

        <div className="mt-12 grid gap-10 md:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-10">
            <div>
              <h2 className="text-2xl font-semibold">The company behind LamportPay</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Lamport Pay Ltd is an active UK private limited company, incorporated on {COMPANY.incorporationLabel}.
                The company adopted its current name on 14 September 2026. Its legal incorporation date is not the launch date of the LamportPay product.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild variant="outline"><a href={COMPANY.registerUrl} target="_blank" rel="noopener noreferrer">Companies House record <ArrowRight className="size-4" /></a></Button>
              </div>
            </div>
            {founder && (
              <div className="grid items-start gap-6 sm:grid-cols-[144px_minmax(0,1fr)]">
                <img src={founder.photo} alt="Zoaib Ali, Founder and CEO of LamportPay" loading="lazy" className="aspect-square w-36 rounded-lg object-cover object-top" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Leadership</p>
                  <h2 className="mt-2 text-2xl font-semibold">{founder.name}</h2>
                  <p className="mt-1 font-medium text-primary">Founder & CEO · Director</p>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{founder.summary} Companies House records his appointment as director on 16 July 2018.</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button asChild variant="outline"><Link to="/people">Meet the leadership <ArrowRight className="size-4" /></Link></Button>
                    <a href={COMPANY.officersUrl} target="_blank" rel="noopener noreferrer" className="self-center text-sm text-primary underline underline-offset-4">Official director record</a>
                  </div>
                </div>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-semibold">Company history</h2>
              <ol className="mt-5 space-y-4 border-l border-border pl-5">
                {COMPANY.previousNames.map((entry) => <li key={entry.name}><p className="text-sm text-muted-foreground">{entry.from} – {entry.to}</p><p className="mt-1 font-medium">{entry.name}</p></li>)}
                <li><p className="text-sm text-muted-foreground">14 September 2026 – present</p><p className="mt-1 font-medium">{COMPANY.legalName}</p></li>
              </ol>
              <p className="mt-5 text-sm text-muted-foreground">Registered activities: {COMPANY.sic.map((activity) => `${activity.code} — ${activity.name}`).join("; ")}.</p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Our mission</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Sending money across borders is still slow and expensive. Stablecoins already move
                in seconds — the hard part is the last step into a real bank account. LamportPay
                connects that last step: one clear quote, one fee, and a payout handled by a
                licensed partner.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold">What we stand for</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {values.map(({ icon: Icon, title, detail }) => (
                  <div key={title} className="overflow-hidden rounded-xl border border-border bg-card">
                    <div
                      aria-hidden="true"
                      className="flex h-28 items-center justify-center border-b border-border bg-gradient-to-br from-primary/10 via-transparent to-violet-500/10"
                    >
                      <Icon className="size-12 text-primary" strokeWidth={1.4} />
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold">{title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Where we are</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                LamportPay is in a controlled sandbox phase. Wallet sign-in and live swap quotes work
                today; bank payouts and identity checks run in our partner's sandbox until
                production approval. Our next step is a dedicated security phase — an independent audit and hardening — before a controlled mainnet launch; see the public roadmap.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/roadmap">
                    View roadmap <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/people">Meet our people</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/contact">Contact us</Link>
                </Button>
              </div>
            </div>
          </div>
          <aside className="min-w-0 self-start rounded-xl border border-border bg-card p-6 md:sticky md:top-24">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Company facts
            </h2>
            <dl className="mt-4 divide-y divide-border text-sm">
              {facts.map((f) => (
                <div key={f.label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 py-3">
                  <dt className="text-muted-foreground">{f.label}</dt>
                  <dd className="break-words text-right font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">Source: Companies House, checked 28 October 2026. Registration is not a financial-services licence or production payout approval. The registered office is a legal correspondence address; LamportPay operates online only.</p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">No public stock-exchange listing or ticker is claimed. Market capitalisation and share-price data are not presented.</p>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}
