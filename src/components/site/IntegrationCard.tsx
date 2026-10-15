import {
  ArrowUpRight,
  Check,
  Landmark,
  Layers,
  Repeat,
  TrendingUp,
  CircleDollarSign,
  BadgeDollarSign,
  Puzzle,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Stables: Landmark,
  Solana: Layers,
  Jupiter: Repeat,
  Hyperliquid: TrendingUp,
  "Circle (USDC)": CircleDollarSign,
  "Tether (USDT)": BadgeDollarSign,
};
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
              "shrink-0 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-md shadow-primary/25",
              large ? "w-14 h-14" : "w-12 h-12",
            )}
          >
            {(() => {
              const Icon = ICONS[item.name] ?? Puzzle;
              return <Icon className={large ? "w-7 h-7" : "w-6 h-6"} strokeWidth={1.8} />;
            })()}
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
