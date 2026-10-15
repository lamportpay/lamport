import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Newspaper } from "lucide-react";

import { NEWS } from "@/content/news";

/**
 * Top news bar: rotates through company news with a split transition.
 * Each item opens its article on /news. Pauses on hover/focus; no motion
 * under prefers-reduced-motion.
 */
export function LaunchStatus() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || NEWS.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % NEWS.length), 6000);
    return () => window.clearInterval(t);
  }, [paused]);

  const item = NEWS[i];
  return (
    <div
      className="launch-status"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className="launch-status-dot" aria-hidden />
      <span className="launch-status-pill">
        <Newspaper className="h-3.5 w-3.5" aria-hidden />
        News
      </span>
      <Link
        key={item.slug}
        to="/news/$slug"
        params={{ slug: item.slug }}
        className="launch-status-text news-split"
        aria-live="polite"
      >
        <span className="news-split-tag">{item.tag}</span>
        <span>{item.headline}</span>
        <ArrowRight className="inline h-3.5 w-3.5" aria-hidden />
      </Link>
      <Link to="/news" className="launch-status-all hidden sm:inline">
        All news
      </Link>
    </div>
  );
}
