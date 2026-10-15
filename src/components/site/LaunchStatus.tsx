import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Newspaper } from "lucide-react";

import { NEWS } from "@/content/news";
import { cn } from "@/lib/utils";

/**
 * Top news bar: one slim full-width line that rotates through company news with a
 * split transition. Each item opens its article on /news. A headline that does not
 * fit its space slowly scrolls instead of being cut off. Pauses on hover/focus; no
 * motion under prefers-reduced-motion.
 */
export function LaunchStatus() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [shift, setShift] = useState(0);
  const lineRef = useRef<HTMLSpanElement>(null);
  const runRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (paused || NEWS.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % NEWS.length), 6000);
    return () => window.clearInterval(t);
  }, [paused]);

  // Measure after the new headline is in the DOM, and again whenever the text or
  // the bar changes size (late web fonts, viewport changes).
  useEffect(() => {
    const measure = () => {
      const line = lineRef.current;
      const run = runRef.current;
      if (!line || !run) {
        setShift(0);
        return;
      }
      const over = run.offsetWidth - line.clientWidth;
      setShift(over > 6 ? Math.round(over + 12) : 0);
    };
    measure();
    const t = window.setTimeout(measure, 120);
    window.addEventListener("resize", measure);
    const ro =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(measure);
    if (ro) {
      if (lineRef.current) ro.observe(lineRef.current);
      if (runRef.current) ro.observe(runRef.current);
    }
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, [i]);

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
        <span
          ref={lineRef}
          className={cn("news-split-line", shift > 0 && "is-marquee")}
          style={{ ["--news-shift" as string]: `-${shift}px` } as React.CSSProperties}
        >
          <span ref={runRef} className="news-split-run">
            {item.headline}
          </span>
        </span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
      </Link>
      <Link to="/news" className="launch-status-all hidden sm:inline">
        All news
      </Link>
    </div>
  );
}
