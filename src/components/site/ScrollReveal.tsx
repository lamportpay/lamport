import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Motion for the marketing pages:
 * - every top-level section fades in as it enters the viewport and fades out
 *   again when it leaves;
 * - every h1/h2 "types" in from the left each time it comes into view.
 *
 * Headings are driven from their own bounding box rather than an
 * IntersectionObserver: the clip-path that hides a heading before it types also
 * zeroes its intersection ratio, so an observer would never notice the heading
 * coming back into view. Both effects respect prefers-reduced-motion, which is
 * handled on the CSS side.
 */
export function ScrollReveal() {
  const pathname = useRouterState({ select: (st) => st.location.pathname });

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("main section, main [data-reveal]"),
    );
    const headings = Array.from(document.querySelectorAll<HTMLElement>("main h1, main h2"));
    if (sections.length === 0 && headings.length === 0) return;

    // No observer support: show everything rather than leave text clipped away.
    if (typeof IntersectionObserver === "undefined") {
      for (const el of sections) el.classList.add("reveal-visible");
      for (const h of headings) h.classList.add("type-visible");
      return;
    }

    // Sections fade in when they enter and fade out again when they leave.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle("reveal-visible", entry.isIntersecting);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );

    for (const el of sections) {
      el.classList.add("reveal-on-scroll");
      observer.observe(el);
    }

    // Headings type in while they are comfortably inside the viewport.
    for (const h of headings) h.classList.add("type-on-scroll");

    const updateHeadings = () => {
      const view = window.innerHeight;
      for (const h of headings) {
        const box = h.getBoundingClientRect();
        h.classList.toggle("type-visible", box.top < view * 0.9 && box.bottom > view * 0.1);
      }
    };

    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        updateHeadings();
      });
    };

    updateHeadings();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  return null;
}
