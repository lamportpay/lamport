import { useEffect, useRef, useState, type ComponentType } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = { title: string; detail: string };
type IconT = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;

/**
 * Scroll-driven journey: a sticky visual panel follows the reader while each step's text
 * scrolls past; the step nearest the viewport centre becomes active. Decorative only.
 */
export function ScrollJourney({ steps, icons }: { steps: readonly Step[]; icons: IconT[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = window.innerHeight / 2;
      let best = 0;
      let dist = Infinity;
      refs.current.forEach((el, i) => {
        const t = el?.querySelector<HTMLElement>("[data-step-text]");
        if (!t) return;
        const r = t.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < dist) {
          dist = d;
          best = i;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [steps.length]);

  const ActiveIcon = icons[active] ?? CheckCircle2;
  const progress = ((active + 1) / steps.length) * 100;

  return (
    <div className="mt-10 grid gap-10 md:grid-cols-[260px_minmax(0,1fr)] md:gap-12 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="hidden md:block">
        <div className="sticky top-32">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="relative text-xs font-semibold uppercase text-primary">
              Step {String(active + 1).padStart(2, "0")} of {steps.length}
            </p>
            <div
              key={active}
              className="relative mt-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-1 duration-500 motion-reduce:animate-none"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md">
                <ActiveIcon aria-hidden="true" className="size-5" />
              </div>
              <h3 className="text-base font-semibold leading-snug">{steps[active]?.title}</h3>
            </div>
            <div className="relative mt-5 h-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-700 ease-out motion-reduce:transition-none"
                style={{ width: `${progress}%` }}
              />
            </div>
            <ol className="relative mt-4 space-y-0.5">
              {steps.map((s, i) => {
                const Icon = icons[i] ?? CheckCircle2;
                const done = i < active;
                return (
                  <li
                    key={s.title}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition-colors duration-300",
                      i === active && "bg-primary/10 font-semibold text-foreground",
                      i !== active && "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full border transition-colors",
                        done || i === active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background",
                      )}
                    >
                      {done ? (
                        <CheckCircle2 aria-hidden="true" className="size-4" />
                      ) : (
                        <Icon aria-hidden="true" className="size-3.5" />
                      )}
                    </span>
                    {s.title}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>

      <ol className="relative">
        <span
          aria-hidden="true"
          className="absolute bottom-6 left-6 top-6 w-px bg-gradient-to-b from-primary via-accent to-transparent"
        />
        {steps.map((step, i) => {
          const Icon = icons[i] ?? CheckCircle2;
          const on = i === active;
          return (
            <li
              key={step.title}
              data-index={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              className="relative grid grid-cols-[3rem_1fr] gap-5 py-10 md:min-h-[32vh] md:items-center md:py-0"
            >
              <div
                className={cn(
                  "relative z-10 flex size-12 items-center justify-center rounded-xl border transition-all duration-500",
                  on
                    ? "border-primary bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg"
                    : "border-border bg-card text-primary",
                )}
              >
                <Icon aria-hidden="true" className="size-5" />
              </div>
              <div
                data-step-text
                className={cn(
                  "transition-all duration-500 motion-reduce:transition-none",
                  on ? "translate-x-0" : "md:[&_h3]:text-foreground/80",
                )}
              >
                <p className="text-xs font-semibold text-primary">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-1 text-xl font-semibold md:text-2xl">{step.title}</h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
                  {step.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
