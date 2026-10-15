import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { PaymentNetwork } from "@/components/site/PaymentNetwork";
import { ConnectedSystems } from "@/components/site/ConnectedSystems";
import { HomeBankNetwork } from "@/components/site/HomeBankNetwork";
import { HomeGlance } from "@/components/site/HomeGlance";
import { HomeCapabilities } from "@/components/site/HomeCapabilities";
import { CustomerSupport } from "@/components/site/CustomerSupport";
import { IntegrationStatus } from "@/components/site/IntegrationStatus";
import { SupportedCorridors } from "@/components/site/SupportedCorridors";
import { EcosystemSection } from "@/components/site/VisionRoadmapEcosystem";
import { FeeCalculator } from "@/components/site/FeeCalculator";
import { HomeTeam } from "@/components/site/HomeTeam";
import { HeroRibbon } from "@/components/site/HeroRibbon";
import { HomeCtaBanner } from "@/components/site/HomeCtaBanner";
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
          <HeroRibbon />
          <div className="home-container relative py-12 text-center md:py-14">
            <p className="home-hero-badge">
              <span className="home-hero-badge-dot" aria-hidden="true" />
              Building the first Solana + Hyperliquid fiat engine
            </p>
            <h1 className="mx-auto mt-6 max-w-4xl text-6xl font-bold leading-[1.05] tracking-tight md:text-8xl">
              <span className="home-brand-text">Lamport</span>
              <span className="home-brand-text-light">Pay</span>
            </h1>
            <p className="mt-4 text-2xl font-semibold leading-snug tracking-tight text-home-ink md:text-4xl">
              Crypto in. <span className="home-brand-text">Local money out.</span>
            </p>
            <HomeGlance />
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-home-ink md:text-lg">
              A non-custodial route from your Solana wallet to local bank payouts, with Hyperliquid
              liquidity in progress. Your wallet. A clear quote. One journey.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="home-hero-cta h-12 bg-home-brand px-7 text-primary-foreground hover:bg-home-brand/90"
              >
                <Link to="/pay">
                  Open App <ArrowRight />
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
            <p className="mx-auto mt-5 max-w-lg text-xs leading-relaxed text-home-ink">
              Your keys stay yours. No real funds move in the sandbox build.
            </p>
          </div>
        </section>
        <HomeCapabilities />
        <HomeBankNetwork />
        <PaymentNetwork />
        <FeeCalculator />
        <ConnectedSystems />
        <EcosystemSection compact />
        <IntegrationStatus />
        <SupportedCorridors />
        <HomeTeam />
        <HomeCtaBanner />
        <CustomerSupport />
      </SiteLayout>
    </div>
  );
}
