import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { PaymentNetwork } from "@/components/site/PaymentNetwork";
import { ConnectedSystems } from "@/components/site/ConnectedSystems";
import { HomeBankNetwork } from "@/components/site/HomeBankNetwork";
import { HomeGlance } from "@/components/site/HomeGlance";
import { CustomerSupport } from "@/components/site/CustomerSupport";
import { IntegrationStatus } from "@/components/site/IntegrationStatus";
import { SupportedCorridors } from "@/components/site/SupportedCorridors";
import { EcosystemSection, RoadmapSection } from "@/components/site/VisionRoadmapEcosystem";
import { FeeCalculator } from "@/components/site/FeeCalculator";
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
            <p className="mx-auto mt-8 max-w-lg text-xs leading-relaxed text-home-ink">
              <span className="font-semibold">DEMO / SIMULATED</span> · Controlled test phase. Real
              bank payouts and production identity verification remain disabled.
            </p>
          </div>
        </section>
        <HomeGlance />
        <PaymentNetwork />
        <HomeBankNetwork />
        <ConnectedSystems />
        <SupportedCorridors />
        <EcosystemSection compact />
        <IntegrationStatus />
        <RoadmapSection />
        <FeeCalculator />
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
