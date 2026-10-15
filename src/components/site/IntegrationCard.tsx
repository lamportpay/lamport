import { ArrowUpRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IntegrationItem, IntegrationStatus } from "@/content/integrations";

const tone: Record<IntegrationStatus, string> = {
  Live: "bg-primary/10 text-primary border-primary/20",
  "Sandbox": "bg-accent text-accent-foreground border-border",
  "In progress": "bg-secondary text-secondary-foreground border-border",
  Planned: "bg-muted text-muted-foreground border-border",
};

export function StatusPill({ status }: { status: IntegrationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tone[status],
      )}
    >
      {status}
    </span>
  );
}

/** Two-letter mark so every card has a visual anchor without using a brand's logo. */
function monogram(name: string) {
  const words = name
    .replace(/[()]/g, "")
    .split(/[\s/]+/)
    .filter((w) => /^[a-zA-Z0-9]/.test(w));
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
  return (words[0]?.slice(0, 2) ?? name.slice(0, 2)).toUpperCase();
}

export function IntegrationCard({
  item,
  large = false,
  className,
}: {
  item: IntegrationItem;
  large?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-border bg-card p-6 flex flex-col",
        large && "md:p-8",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span
            aria-hidden
            className={cn(
              "shrink-0 inline-flex items-center justify-center rounded-xl border border-primary/15 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 font-bold tracking-tight text-primary",
              large ? "w-12 h-12 text-base" : "w-10 h-10 text-sm",
            )}
          >
            {monogram(item.name)}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {item.role}
            </p>
            <h3 className={cn("mt-1 font-semibold", large ? "text-2xl" : "text-lg")}>{item.name}</h3>
          </div>
        </div>
        <StatusPill status={item.status} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{item.detail}</p>
      {item.points && (
        <ul className="mt-4 space-y-2 text-sm">
          {item.points.map((p) => (
            <li key={p} className="flex gap-2">
              <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
              {p}
            </li>
          ))}
        </ul>
      )}
      {item.href && (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Visit {item.name.split(" ")[0]} <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      )}
    </article>
  );
}
