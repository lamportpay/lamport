import { createFileRoute } from "@tanstack/react-router";

import { POSTS } from "@/content/blog";
import { NEWS } from "@/content/news";
const SITEMAP_ORIGIN = "https://lamportpay.lovable.app";

const STATIC_PAGES: { path: string; priority: string; changefreq: string }[] = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/how-it-works", priority: "0.8", changefreq: "monthly" },
  { path: "/workflow", priority: "0.7", changefreq: "monthly" },
  { path: "/whitepaper", priority: "0.7", changefreq: "monthly" },
  { path: "/compliance", priority: "0.7", changefreq: "monthly" },
  { path: "/docs", priority: "0.7", changefreq: "monthly" },
  { path: "/about", priority: "0.7", changefreq: "monthly" },
  { path: "/roadmap", priority: "0.8", changefreq: "monthly" },
  { path: "/blog", priority: "0.9", changefreq: "weekly" },
  { path: "/cookies", priority: "0.3", changefreq: "yearly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
  { path: "/partners", priority: "0.7", changefreq: "monthly" },
  { path: "/technology", priority: "0.6", changefreq: "monthly" },
  { path: "/people", priority: "0.6", changefreq: "monthly" },
  { path: "/contact", priority: "0.6", changefreq: "monthly" },
  { path: "/faq", priority: "0.7", changefreq: "monthly" },
  { path: "/news", priority: "0.8", changefreq: "weekly" },
];

export function buildSitemap() {
  const entries = [
    ...STATIC_PAGES.map((p) => ({
      loc: new URL(p.path, SITEMAP_ORIGIN).href,
      lastmod: undefined as string | undefined,
      changefreq: p.changefreq,
      priority: p.priority,
    })),
    ...POSTS.map((p) => ({
      loc: new URL(`/blog/${p.slug}`, SITEMAP_ORIGIN).href,
      lastmod: p.updated ?? p.published,
      changefreq: "monthly",
      priority: "0.8",
    })),
    ...NEWS.map((n) => ({
      loc: new URL(`/news/${n.slug}`, SITEMAP_ORIGIN).href,
      lastmod: n.published,
      changefreq: "monthly",
      priority: "0.8",
    })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) =>
      `  <url>\n    <loc>${e.loc}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ""}\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
  )
  .join("\n")}
</urlset>
`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildSitemap(), {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        }),
    },
  },
});
