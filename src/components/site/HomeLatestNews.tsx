import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Coins, Landmark, Layers, Network, ShieldCheck, Newspaper, type LucideIcon } from "lucide-react";
import { POSTS } from "@/content/blog";
import { formatDate, type BlogPost } from "@/content/blog/types";
import { Button } from "@/components/ui/button";

const ART: Record<BlogPost["category"], LucideIcon> = {
  "Crypto-to-fiat": Landmark,
  Stablecoins: Coins,
  Solana: Layers,
  "Web3 payment rails": Network,
  Compliance: ShieldCheck,
};

/** Homepage "Latest news" strip: the newest blog posts with vector icon artwork. */
export function HomeLatestNews() {
  const posts = POSTS.slice(0, 4);
  return (
    <section className="home-section border-t border-border" id="latest-news">
      <div className="home-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="home-eyebrow">Blog</p>
          <h2 className="home-heading">Latest news and insights</h2>
          <Button asChild className="mt-6 rounded-full px-6">
            <Link to="/blog">
              <Newspaper className="size-4" /> Latest news <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="home-news-row mt-10">
          {posts.map((p) => {
            const Icon = ART[p.category] ?? Newspaper;
            return (
              <Link key={p.slug} to="/blog/$slug" params={{ slug: p.slug }}
                className="home-news-card group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="home-news-art relative flex aspect-[16/10] items-center justify-center overflow-hidden">
                  <span className="absolute -right-6 -top-6 size-28 rounded-full border border-primary/20" />
                  <span className="absolute -bottom-10 -left-8 size-36 rounded-full border border-primary/15" />
                  <span className="flex size-16 items-center justify-center rounded-2xl bg-background/80 text-primary shadow-md transition group-hover:scale-110">
                    <Icon className="size-8" strokeWidth={1.6} />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{p.category}</p>
                  <h3 className="mt-2 line-clamp-2 font-semibold leading-snug">{p.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.description}</p>
                  <p className="mt-auto flex items-center gap-2 pt-4 text-xs text-muted-foreground">
                    {formatDate(p.published)} <Clock className="size-3.5" /> {p.readingMinutes} min
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
