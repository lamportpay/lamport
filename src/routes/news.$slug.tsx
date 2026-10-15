import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";

import { SiteLayout } from "@/components/site/Layout";
import { NEWS, getNews, formatNewsDate } from "@/content/news";
import { canonical, pageSeo, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/news/$slug")({
  loader: ({ params }) => {
    const item = getNews(params.slug);
    if (!item) throw notFound();
    return { item };
  },
  head: ({ params, loaderData }) => {
    const item = loaderData?.item;
    if (!item) return { meta: [{ title: "News not found — LamportPay" }, { name: "robots", content: "noindex" }] };
    const path = `/news/${params.slug}`;
    const seo = pageSeo({ path, title: `${item.title} | LamportPay News`, description: item.summary, type: "article" });
    return {
      ...seo,
      meta: [
        ...seo.meta,
        { name: "twitter:card", content: "summary" },
        { name: "keywords", content: item.keywords.join(", ") },
        { property: "article:published_time", content: item.published },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: item.title,
            description: item.summary,
            datePublished: item.published,
            mainEntityOfPage: canonical(path),
            author: { "@type": "Organization", name: "LamportPay", url: SITE_URL },
            publisher: { "@type": "Organization", name: "LamportPay", url: SITE_URL },
          }),
        },
      ],
    };
  },
  component: NewsArticle,
});

function NewsArticle() {
  const { item } = Route.useLoaderData();
  const others = NEWS.filter((n) => n.slug !== item.slug);
  return (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-5">
        <Link to="/news" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden /> All news
        </Link>
        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2.5 py-0.5 font-semibold text-home-brand">{item.tag}</span>
          <time dateTime={item.published}>{formatNewsDate(item.published)}</time>
        </div>
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{item.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{item.summary}</p>
        <div className="mt-8 space-y-8">
          {item.body.map((b, i) => (
            <section key={i}>
              {b.heading && <h2 className="text-xl font-semibold">{b.heading}</h2>}
              {b.paragraphs?.map((p, j) => (
                <p key={j} className="mt-3 leading-relaxed text-foreground/90">{p}</p>
              ))}
              {b.bullets && (
                <ul className="mt-3 space-y-2">
                  {b.bullets.map((t) => (
                    <li key={t} className="flex gap-2 text-foreground/90">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-home-brand" aria-hidden /> {t}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
        <aside className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold">Useful links</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {item.links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="inline-flex items-center gap-1 text-sm font-medium text-home-brand hover:underline"
                >
                  {l.label} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </aside>
        {others.length > 0 && (
          <div className="mt-10">
            <h2 className="text-base font-semibold">More news</h2>
            <ul className="mt-3 space-y-2">
              {others.map((n) => (
                <li key={n.slug}>
                  <Link to="/news/$slug" params={{ slug: n.slug }} className="text-sm font-medium hover:text-home-brand">
                    {n.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </SiteLayout>
  );
}
