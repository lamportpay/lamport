import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Adds a soft fade-in-up motion to every top-level section of the marketing
 * pages as it enters the viewport. Runs once per section, respects
 * prefers-reduced-motion (CSS side), and re-scans on route change.
 */
export function ScrollReveal() {
  const pathname = useRouterState({ select: (st) => st.location.pathname });

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("main section, main [data-reveal]"),
    );
    const headings = Array.from(document.querySelectorAll<HTMLElement>("main h1, main h2"));
    if (sections.length === 0 && headings.length === 0) return;

    // Sections fade in when they enter and fade out again when they leave.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle("reveal-visible", entry.isIntersecting);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );

    // Headings "type" in each time they come into view.
    const typer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle("type-visible", entry.isIntersecting);
        }
      },
      { threshold: 0.6 },
    );

    for (const el of sections) {
      el.classList.add("reveal-on-scroll");
      observer.observe(el);
    }
    for (const h of headings) {
      h.classList.add("type-on-scroll");
      typer.observe(h);
    }

    return () => {
      observer.disconnect();
      typer.disconnect();
    };
  }, [pathname]);

  return null;
}
