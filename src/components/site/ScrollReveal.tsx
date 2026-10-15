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
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );

    for (const el of sections) {
      if (el.classList.contains("reveal-visible")) continue;
      el.classList.add("reveal-on-scroll");
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
