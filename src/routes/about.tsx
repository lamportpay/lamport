import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Globe2, ShieldCheck, Wallet } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { pageSeo } from "@/lib/seo";
import { AboutPartners } from "@/components/site/AboutPartners";

export const Route = createFileRoute("/about")({
  head: () =>
    pageSeo({
      path: "/about",
      title: "About LamportPay — Crypto in. Local money out.",
      description:
        "Who we are: Lamport Pay Ltd builds LamportPay, a non-custodial way to turn Solana stablecoins into local bank payouts through licensed partners.",
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
  { label: "Network", value: "Solana" },
  { label: "Settlement asset", value: "USDC" },
  { label: "Payout partner", value: "Stables" },
  { label: "Stage", value: "Sandbox" },
];

function About() {
  return (
    <SiteLayout>
      <section className="max-w-6xl mx-auto px-5 py-12 md:py-16">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">About us</div>
        <h1 className="mt-3 max-w-3xl text-4xl md:text-5xl font-semibold leading-tight">
          Crypto in. Local money out.
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-muted-foreground leading-relaxed">
          LamportPay is built by Lamport Pay Ltd. We help people and businesses turn stablecoins on
          Solana into money in a local bank account — simply, transparently and without handing
          their funds to us.
        </p>
        <AboutPartners />

        <div className="mt-12 grid gap-10 md:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-10">
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
                production approval. Our next step is a dedicated security phase — an independent audit and hardening — before a controlled launch; see the public roadmap.
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
          <aside className="self-start rounded-xl border border-border bg-card p-6 md:sticky md:top-24">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Company facts
            </h2>
            <dl className="mt-4 divide-y divide-border text-sm">
              {facts.map((f) => (
                <div key={f.label} className="flex justify-between gap-4 py-3">
                  <dt className="text-muted-foreground">{f.label}</dt>
                  <dd className="text-right font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}
