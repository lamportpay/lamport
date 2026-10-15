import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { RoadmapTracker } from "@/components/site/RoadmapTracker";
import { pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/roadmap")({
  head: () =>
    pageSeo({
      path: "/roadmap",
      title: "Roadmap — LamportPay",
      description:
        "LamportPay’s phase-by-phase roadmap tracker: seven phases done, security review and go-live in progress, then liquidity, partnerships and a global payout ecosystem.",
    }),
  component: RoadmapPage,
});

function RoadmapPage() {
  return (
    <div className="commercial-home">
      <SiteLayout>
        <section className="home-section border-b border-border">
          <div className="home-container py-12 text-center md:py-14">
            <p className="home-eyebrow">Where we are headed</p>
            <h1 className="home-heading mx-auto max-w-3xl text-4xl md:text-5xl">
              The LamportPay roadmap.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-home-ink md:text-lg">
              Thirteen phases, tracked one by one: seven are done, we are in phase eight (security review
              and go-live), then automation, marketing and three growth phases.
            </p>
          </div>
        </section>
        <RoadmapTracker />
        <section className="home-section border-t border-border">
          <div className="home-container flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="home-eyebrow">Build with us</p>
              <h2 className="home-heading">Partner on the next phase.</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Integrations, corridors and payout partnerships are scoped with the team directly.
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
      </SiteLayout>
    </div>
  );
}
