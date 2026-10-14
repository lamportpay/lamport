import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Coins, Globe2, Wallet } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { PaymentNetwork } from "@/components/site/PaymentNetwork";
import { ConnectedSystems } from "@/components/site/ConnectedSystems";
import { HomeBankNetwork } from "@/components/site/HomeBankNetwork";
import { HomeGlance } from "@/components/site/HomeGlance";
import { CustomerSupport } from "@/components/site/CustomerSupport";
import { IntegrationStatus } from "@/components/site/IntegrationStatus";
import { EcosystemSection, RoadmapSection } from "@/components/site/VisionRoadmapEcosystem";
import { PAYMENT_COSTS } from "@/content/payment-flow";
import { pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () =>
    pageSeo({
      path: "/",
      title: "LamportPay — Crypto in. Local money out.",
      description:
        "Explore LamportPay’s non-custodial payment journey: Solana wallets, Jupiter swap quotes, USDC settlement and Stables bank-payout sandbox. Meet our business ecosystem.",
    }),
  component: Index,
});

function Index() {
  return (
    <div className="commercial-home">
      <SiteLayout>
        <section className="home-hero relative isolate overflow-hidden">
          <div className="home-orbits home-orbits-left" aria-hidden="true">
            <span className="home-orbit home-orbit-outer" />
            <span className="home-orbit home-orbit-middle" />
            <span className="home-orbit home-orbit-inner" />
          </div>
          <div className="home-container relative py-16 text-center md:py-24">
            <p className="home-hero-badge">
              <span className="home-hero-badge-dot" aria-hidden="true" />
              Built on Solana · Non-custodial payments
            </p>
            <h1 className="mx-auto mt-6 max-w-4xl text-6xl font-bold leading-[1.05] tracking-tight md:text-8xl">
              <span className="home-brand-text">Lamport</span>
              <span className="home-brand-text-light">Pay</span>
            </h1>
            <p className="mt-4 text-2xl font-semibold leading-snug tracking-tight text-home-ink md:text-4xl">
              Crypto in. <span className="home-brand-text">Local money out.</span>
            </p>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-home-ink md:text-lg">
              A connected route from your Solana wallet to local-currency bank payments. Your
              wallet. A clear quote. One payment journey.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="home-hero-cta h-12 bg-home-brand px-7 text-primary-foreground hover:bg-home-brand/90"
              >
                <Link to="/pay">
                  Open payment app <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="home-hero-ghost h-12 px-7 backdrop-blur-sm"
              >
                <a href="#payment-network">
                  Explore the payment route <ArrowUpRight />
                </a>
              </Button>
            </div>
            <dl className="home-hero-stats mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { value: "19", label: "Bank payout countries" },
                { value: "2%", label: "One transparent service fee" },
                { value: "0", label: "Funds held by LamportPay" },
              ].map(({ value, label }) => (
                <div key={label} className="home-hero-stat">
                  <dt className="order-2 mt-1 text-xs font-medium text-home-ink/70">
                    {label}
                  </dt>
                  <dd className="order-1 text-2xl font-semibold tracking-tight text-home-brand">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mx-auto mt-8 max-w-lg text-xs leading-relaxed text-home-ink">
              <span className="font-semibold">DEMO / SIMULATED</span> · Controlled test phase. Real
              bank payouts and production identity verification remain disabled.
            </p>
          </div>
        </section>
        <HomeGlance />
        <div className="border-b border-border bg-card">
          <div className="home-container grid grid-cols-1 gap-4 py-6 sm:grid-cols-3">
            {[
              {
                icon: Wallet,
                title: "Your wallet stays yours",
                text: "No custody of funds or private keys",
              },
              {
                icon: Coins,
                title: "One transparent service fee",
                text: "2% of the total sent · Partner costs separate",
              },
              {
                icon: Globe2,
                title: "Local bank destinations",
                text: "Own account or beneficiary · Sandbox",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-center gap-3">
                <Icon className="size-5 shrink-0 text-home-brand" strokeWidth={1.6} />
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <PaymentNetwork />
        <section className="home-section border-y border-border bg-home-surface" id="costs">
          <div className="home-container grid gap-8 md:grid-cols-[1fr_1.4fr]">
            <div>
              <p className="home-eyebrow">The business model</p>
              <h2 className="home-heading">
                One service fee.
                <br />
                No hidden layers.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                LamportPay earns a single fee for arranging the payment journey. Provider and
                network costs are shown separately.
              </p>
              <Button asChild variant="link" className="mt-4 px-0 text-home-brand">
                <Link to="/how-it-works">
                  How payments work <ArrowRight />
                </Link>
              </Button>
            </div>
            <div>
              <div className="flex items-center gap-5 border-b border-border pb-5">
                <p className="text-5xl font-semibold text-home-brand">2%</p>
                <div>
                  <p className="font-semibold">Of the total you send</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    150 USDC sent → 3 USDC fee → 147 USDC to Stables
                  </p>
                </div>
              </div>
              <dl className="divide-y divide-border">
                {PAYMENT_COSTS.map((cost) => (
                  <div key={cost.title} className="py-4">
                    <dt className="text-sm font-semibold">{cost.title}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {cost.detail}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
        <IntegrationStatus />
        <HomeBankNetwork />
        <ConnectedSystems />
        <EcosystemSection compact />
        <RoadmapSection />
        <section className="home-section border-t border-border">
          <div className="home-container flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="home-eyebrow">Build your next payment connection</p>
              <h2 className="home-heading">Let’s talk business.</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Explore business onboarding, payment use cases and our product roadmap.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 bg-home-brand text-primary-foreground hover:bg-home-brand/90"
              >
                <Link to="/contact">
                  Contact our team <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12">
                <Link to="/whitepaper">White paper</Link>
              </Button>
            </div>
          </div>
        </section>
        <CustomerSupport />
      </SiteLayout>
    </div>
  );
}
