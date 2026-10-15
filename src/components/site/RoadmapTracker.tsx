import { useMemo, useState } from "react";
import { Check, Circle, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TRACKER_PHASES,
  TRACKER_STATUS_LABEL,
  type TrackerStatus,
} from "@/content/roadmap-tracker";
import { cn } from "@/lib/utils";

type Filter = "all" | TrackerStatus;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All phases" },
  { id: "done", label: "Done" },
  { id: "current", label: "In progress" },
  { id: "planned", label: "Planned" },
];

const badge: Record<TrackerStatus, string> = {
  done: "bg-success/15 text-success border-success/30",
  current: "bg-home-brand text-primary-foreground border-home-brand",
  planned: "bg-muted text-muted-foreground border-border",
};

export function RoadmapTracker() {
  const [filter, setFilter] = useState<Filter>("all");
  const total = TRACKER_PHASES.length;
  const done = TRACKER_PHASES.filter((p) => p.status === "done").length;
  const current = TRACKER_PHASES.find((p) => p.status === "current");
  const curFrac = current ? current.items.filter((i) => i.done).length / current.items.length : 0;
  const pct = Math.round(((done + curFrac) / total) * 100);
  const shown = useMemo(
    () => TRACKER_PHASES.filter((p) => filter === "all" || p.status === filter),
    [filter],
  );

  return (
    <section className="home-section">
      <div className="home-container">
        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold text-home-ink">Overall progress</p>
              <p className="text-2xl font-bold text-home-brand">{pct}%</p>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-home-brand" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {done} of {total} phases done · Phase {current?.phase} in progress
            </p>
          </div>
          <div className="rounded-2xl border border-home-brand/30 bg-home-tint p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-home-brand">
              We are here
            </p>
            <p className="mt-1 text-lg font-bold text-home-ink">
              Phase {current?.phase}: {current?.title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{current?.summary}</p>
          </div>
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5">
            <div>
              <p className="text-sm font-semibold text-home-ink">Roadmap PDF</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The same phase tracker, ready to share.
              </p>
            </div>
            <Button asChild className="mt-3 bg-home-brand text-primary-foreground hover:bg-home-brand/90">
              <a href="/downloads/lamportpay-roadmap.pdf" download="LamportPay-Roadmap.pdf">
                <Download /> Download PDF
              </a>
            </Button>
          </div>
        </div>

        {/* Phase strip */}
        <ol
          aria-label="Phase overview"
          className="mt-8 flex gap-1.5 overflow-x-auto pb-2 [scrollbar-width:none]"
        >
          {TRACKER_PHASES.map((p) => (
            <li key={p.phase} className="min-w-[72px] flex-1">
              <a href={`#phase-${p.phase}`} className="block text-center">
                <span
                  className={cn(
                    "block h-1.5 rounded-full",
                    p.status === "done" && "bg-success",
                    p.status === "current" && "bg-home-brand",
                    p.status === "planned" && "bg-muted",
                  )}
                />
                <span className="mt-1.5 block text-[11px] font-semibold text-muted-foreground">
                  P{p.phase}
                </span>
              </a>
            </li>
          ))}
        </ol>

        {/* Filters */}
        <div role="tablist" className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                filter === f.id
                  ? "border-home-brand bg-home-brand text-primary-foreground"
                  : "border-border bg-card text-home-ink hover:bg-home-tint",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Scrollable timeline */}
        <div className="mt-6 max-h-[78vh] overflow-y-auto rounded-2xl border border-border bg-home-surface p-4 md:p-6">
          <ol className="relative space-y-4 border-l-2 border-border pl-6 md:pl-8">
            {shown.map((p) => {
              const doneCount = p.items.filter((i) => i.done).length;
              return (
                <li key={p.phase} id={`phase-${p.phase}`} className="relative scroll-mt-4">
                  <span
                    className={cn(
                      "absolute -left-[37px] top-5 flex h-7 w-7 items-center justify-center rounded-full border-2 md:-left-[45px]",
                      p.status === "done" && "border-success bg-success text-primary-foreground",
                      p.status === "current" && "border-home-brand bg-card text-home-brand",
                      p.status === "planned" && "border-border bg-card text-muted-foreground",
                    )}
                    aria-hidden
                  >
                    {p.status === "done" ? (
                      <Check className="h-4 w-4" />
                    ) : p.status === "current" ? (
                      <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                    ) : (
                      <Circle className="h-3 w-3" />
                    )}
                  </span>
                  <article
                    className={cn(
                      "rounded-xl border bg-card p-5",
                      p.status === "current" ? "border-home-brand shadow-md" : "border-border",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Phase {p.phase} · {p.stage}
                      </span>
                      <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", badge[p.status])}>
                        {TRACKER_STATUS_LABEL[p.status]}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {doneCount}/{p.items.length} complete
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-bold text-home-ink">{p.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{p.summary}</p>
                    <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                      {p.items.map((i) => (
                        <li key={i.label} className="flex items-start gap-2 text-sm text-home-ink">
                          {i.done ? (
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                          ) : (
                            <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <span className={i.done ? "" : "text-muted-foreground"}>{i.label}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                </li>
              );
            })}
          </ol>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Planned phases are goals, not confirmed partnerships or live features. No delivery dates
          are committed.
        </p>
      </div>
    </section>
  );
}
