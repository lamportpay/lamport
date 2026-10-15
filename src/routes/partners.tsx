import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { IntegrationCard } from "@/components/site/IntegrationCard";
import { integrationPartners, licensedPartner } from "@/content/integrations";
import { pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/partners")({
  head: () =>
    pageSeo({
      path: "/partners",
      title: "Partners & integrations — LamportPay",
      description:
        "LamportPay's licensed payout partner Stables, plus the networks and liquidity providers we integrate: Solana, Jupiter, Hyperliquid, USDC and USDT.",
    }),
  component: PartnersPage,
});

function PartnersPage() {
  return (
    <SiteLayout>
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Partners</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Partners & integrations</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          LamportPay is built on licensed and proven infrastructure. Every item shows its honest
          status: live, sandbox / simulated, in progress or planned.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-5">
        <h2 className="text-2xl font-semibold mb-4">Licensed partner</h2>
        <IntegrationCard item={licensedPartner} large />
      </section>

      <section className="max-w-6xl mx-auto px-5 mt-14">
        <h2 className="text-2xl font-semibold mb-4">Integrations</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {integrationPartners.map((p, i) => (
            <IntegrationCard
              key={p.name}
              item={p}
              className={
                integrationPartners.length % 3 === 2 && i === integrationPartners.length - 1
                  ? "lg:col-span-2"
                  : undefined
              }
            />
          ))}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Listing a company here describes a technical integration, not an endorsement or a
          confirmed commercial partnership unless stated. See the{" "}
          <Link to="/technology" className="text-primary underline">
            technology page
          </Link>{" "}
          for the tools we build with.
        </p>
      </section>
    </SiteLayout>
  );
}
