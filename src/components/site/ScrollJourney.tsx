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
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [steps.length]);

  const ActiveIcon = icons[active] ?? CheckCircle2;
  const progress = ((active + 1) / steps.length) * 100;

  return (
    <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-16">
      <div className="hidden md:block">
        <div className="sticky top-32">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/15 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-accent/20 blur-3xl"
            />
            <p className="relative text-xs font-semibold uppercase text-primary">
              Step {String(active + 1).padStart(2, "0")} of {steps.length}
            </p>
            <div
              key={active}
              className="relative mt-6 animate-in fade-in zoom-in-95 duration-500 motion-reduce:animate-none"
            >
              <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg">
                <ActiveIcon aria-hidden="true" className="size-9" />
              </div>
              <h3 className="mt-6 text-2xl font-semibold">{steps[active]?.title}</h3>
            </div>
            <div className="relative mt-8 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-700 ease-out motion-reduce:transition-none"
                style={{ width: `${progress}%` }}
              />
            </div>
            <ol className="relative mt-6 space-y-2">
              {steps.map((s, i) => {
                const Icon = icons[i] ?? CheckCircle2;
                const done = i < active;
                return (
                  <li
                    key={s.title}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-300",
                      i === active && "bg-primary/10 font-semibold text-foreground",
                      i !== active && "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full border transition-colors",
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
              className="relative grid grid-cols-[3rem_1fr] gap-5 py-10 md:min-h-[60vh] md:items-center md:py-0"
            >
              <div
                className={cn(
                  "relative z-10 flex size-12 items-center justify-center rounded-xl border transition-all duration-500",
                  on
                    ? "scale-110 border-primary bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg"
                    : "border-border bg-card text-primary",
                )}
              >
                <Icon aria-hidden="true" className="size-5" />
              </div>
              <div
                className={cn(
                  "transition-all duration-500 motion-reduce:transition-none",
                  on ? "opacity-100 md:translate-x-0" : "opacity-100 md:translate-x-2 md:opacity-40",
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
