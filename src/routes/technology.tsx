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
        "How LamportPay is built: TypeScript, React, a SQL (Postgres) database, Node.js, cloud hosting with a planned move to AWS, signed webhooks and automated security checks.",
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
            {g.items.map((i, idx) => (
              <IntegrationCard
                key={i.name}
                item={i}
                className={
                  g.items.length % 3 === 2 && idx === g.items.length - 1
                    ? "lg:col-span-2"
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      ))}

      <section className="max-w-6xl mx-auto px-5 pb-16">
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <h2 className="text-xl font-semibold">Security &amp; data handling</h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-3xl">
            Customer funds are never held by LamportPay — every payment moves from the customer's own
            wallet to a single-use deposit address issued for that transfer. Accounts, payment
            records and the admin audit log live in Postgres with row-level security, and the audit
            log cannot be edited or deleted.
          </p>
          <p className="mt-3 text-sm text-muted-foreground max-w-3xl">
            For the full list of what is live, simulated, in progress or planned, see{" "}
            <Link to="/partners" className="text-primary underline">
              Partners &amp; integrations
            </Link>
            , the{" "}
            <Link to="/compliance" className="text-primary underline">
              compliance page
            </Link>
            , and the{" "}
            <Link to="/cookies" className="text-primary underline">
              cookie policy
            </Link>
            . Found a security issue? Write to us at{" "}
            <a href="mailto:hello@lamportpay.com" className="text-primary underline">
              hello@lamportpay.com
            </a>
            .
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
