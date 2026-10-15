import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { IntegrationCard } from "@/components/site/IntegrationCard";
import { techStack } from "@/content/integrations";
import { pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/technology")({
  head: () =>
    pageSeo({
      path: "/technology",
      title: "Technology stack — LamportPay",
      description:
        "How LamportPay is built: TypeScript, React, Supabase Postgres, Vercel, Resend email, signed webhooks and automated security checks.",
    }),
  component: TechnologyPage,
});

function TechnologyPage() {
  return (
    <SiteLayout>
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Technology</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">How LamportPay is built</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          The tools and services behind the platform. For payout and liquidity partners, see{" "}
          <Link to="/partners" className="text-primary underline">
            Partners & integrations
          </Link>
          .
        </p>
      </section>

      {techStack.map((g) => (
        <section key={g.group} className="max-w-6xl mx-auto px-5 mb-12">
          <h2 className="text-2xl font-semibold mb-4">{g.group}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((i) => (
              <IntegrationCard key={i.name} item={i} />
            ))}
          </div>
        </section>
      ))}
    </SiteLayout>
  );
}
