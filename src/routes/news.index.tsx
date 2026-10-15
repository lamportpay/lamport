import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Newspaper } from "lucide-react";

import { SiteLayout } from "@/components/site/Layout";
import { NEWS, formatNewsDate } from "@/content/news";
import { pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/news/")({
  head: () => {
    const seo = pageSeo({
      path: "/news",
      title: "News — LamportPay launch, Colosseum and company updates",
      description: "Official LamportPay news: launch progress, Colosseum Arena submission and company announcements.",
    });
    return { ...seo, meta: [...seo.meta, { name: "twitter:card", content: "summary" }] };
  },
  component: NewsPage,
});

function NewsPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-5">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-home-brand">
          <Newspaper className="h-4 w-4" aria-hidden /> Newsroom
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">LamportPay news</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Company announcements and launch updates. Looking for guides? Read our{" "}
          <Link to="/blog" className="font-medium text-home-brand underline-offset-4 hover:underline">blog</Link>.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {NEWS.map((n) => (
            <Link
              key={n.slug}
              to="/news/$slug"
              params={{ slug: n.slug }}
              className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-2.5 py-0.5 font-semibold text-home-brand">{n.tag}</span>
                <time dateTime={n.published}>{formatNewsDate(n.published)}</time>
              </div>
              <h2 className="mt-3 text-xl font-semibold leading-snug">{n.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{n.summary}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-home-brand">
                Read more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
