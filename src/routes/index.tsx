import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { HomeBankNetwork } from "@/components/site/HomeBankNetwork";
import { HomeGlance } from "@/components/site/HomeGlance";
import { HomeCapabilities } from "@/components/site/HomeCapabilities";
import { HomeDifference } from "@/components/site/HomeDifference";
import { HomeRegionalNetwork } from "@/components/site/HomeRegionalNetwork";
import { TechnologyEcosystem } from "@/components/site/TechnologyEcosystem";
import { MultiAssetFlow } from "@/components/site/MultiAssetFlow";
import { SupportedCorridors } from "@/components/site/SupportedCorridors";
import { HomeLatestNews } from "@/components/site/HomeLatestNews";
import { FeeCalculator } from "@/components/site/FeeCalculator";
import { HeroRibbon } from "@/components/site/HeroRibbon";
import { HomeCtaBanner } from "@/components/site/HomeCtaBanner";
import payoutNetworkAsset from "@/assets/global-payout-network.png.asset.json";
import { pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () =>
    pageSeo({
      path: "/",
      title: "LamportPay — Crypto in. Local money out.",
      description:
        "Explore LamportPay’s non-custodial payment journey: Solana wallets, Jupiter swap quotes, USDC settlement and Stables bank-payout sandbox.",
    }),
  component: Index,
});

function Index() {
  return (
    <div className="commercial-home">
      <SiteLayout>
        <section className="home-hero relative isolate overflow-hidden">
          <HeroRibbon />
          <div className="home-container relative py-12 md:py-14">
            <div className="hero-network-grid items-center gap-10 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <div className="hero-network-copy text-center lg:text-left">
                <p className="home-hero-badge">
                  <span className="home-hero-badge-dot" aria-hidden="true" />
                  Building the first Solana + Hyperliquid fiat engine
                </p>
                <h1 className="mx-auto mt-6 max-w-4xl text-6xl font-bold leading-[1.05] tracking-tight md:text-8xl lg:text-7xl">
                  <span className="home-brand-text">Lamport</span>
                  <span className="home-brand-text-light">Pay</span>
                </h1>
                <p className="mt-4 text-2xl font-semibold leading-snug tracking-tight text-home-ink md:text-4xl lg:text-3xl">
                  Crypto in. <span className="home-brand-text">Local money out.</span>
                </p>
                <HomeGlance />
                <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-home-ink md:text-lg">
                  A non-custodial route from your Solana wallet to local bank payouts, with Hyperliquid
                  liquidity in progress. Your wallet. A clear quote. One journey.
                </p>
                <div className="home-hero-actions">
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
                    <Link to="/how-it-works">
                      Explore the payment route <ArrowUpRight />
                    </Link>
                  </Button>
                </div>
                <p className="mx-auto mt-5 max-w-lg text-xs leading-relaxed text-home-ink">
                  Your keys stay yours. No real funds move in the sandbox build.
                </p>
              </div>
              <div className="hero-network-visual mt-12 lg:mt-0">
                <span className="hero-network-glow" aria-hidden="true" />
                <figure className="hero-network-card hero-network-float">
                  <img
                    src={payoutNetworkAsset.url}
                    alt="Global payout partner network: LamportPay connecting North America, Europe, South America, Africa, Asia and Oceania to local payout routes"
                    width={1024}
                    height={1536}
                    loading="eager"
                    decoding="async"
                  />
                </figure>
              </div>
            </div>
          </div>
        </section>
        <HomeCapabilities />
        <HomeBankNetwork />
        <FeeCalculator />
        <MultiAssetFlow />
        <HomeDifference />
        <HomeRegionalNetwork />
        <TechnologyEcosystem />
        <SupportedCorridors />
        <HomeLatestNews />
        <HomeCtaBanner />
      </SiteLayout>
    </div>
  );
}
