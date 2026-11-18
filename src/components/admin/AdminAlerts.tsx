/**
 * Operations alerts inside the admin (19 Nov 2026): the open-alert count shared
 * by the sidebar badge, the dashboard bar and a pop-up when a new alert opens
 * while any admin page is open. Data: `getOpsAlertSummary` (the `ops_alerts`
 * rows the reconcile job keeps every 5 minutes). The full list is Admin → Alerts.
 */
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, BellRing } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getOpsAlertSummary } from "@/lib/admin-alerts.functions";
import { newAlertKeys, type AlertSummary } from "@/lib/ops/admin-alerts";

const SUMMARY_REFRESH_MS = 60_000;

export function useAlertSummary() {
  const fetchSummary = useServerFn(getOpsAlertSummary);
  return useQuery({
    queryKey: ["admin-ops-alert-summary"],
    queryFn: () => fetchSummary(),
    refetchInterval: SUMMARY_REFRESH_MS,
    refetchIntervalInBackground: true,
  });
}

/** Pops up a message when an alert opens while the admin is open (not for those already open). */
export function useNewAlertToasts(summary: AlertSummary | undefined) {
  const navigate = useNavigate();
  const previous = useRef<string[] | null>(null);
  useEffect(() => {
    if (!summary) return;
    const fresh = newAlertKeys(previous.current, summary.keys);
    previous.current = summary.keys;
    if (fresh.length === 0) return;
    const top = summary.top && fresh.includes(summary.top.key) ? summary.top : null;
    const title =
      fresh.length === 1 ? "New operations alert" : `${fresh.length} new operations alerts`;
    const show = top?.severity === "critical" ? toast.error : toast.warning;
    show(title, {
      description: top?.title ?? "Open Alerts to see what needs attention.",
      duration: 15_000,
      action: { label: "View", onClick: () => void navigate({ to: "/admin/alerts" }) },
    });
  }, [summary, navigate]);
}

/** The sidebar count: red when any open alert is critical. */
export function AlertCountBadge({ summary }: { summary: AlertSummary | undefined }) {
  if (!summary || summary.open === 0) return null;
  return (
    <span
      aria-label={`${summary.open} open ${summary.open === 1 ? "alert" : "alerts"}`}
      className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${summary.critical ? "bg-destructive text-destructive-foreground" : "bg-amber-500/15 text-amber-700 dark:text-amber-300"}`}
    >
      {summary.open}
    </span>
  );
}

/** The dashboard bar, shown only while something is open. */
export function OpenAlertsBar() {
  const { data } = useAlertSummary();
  if (!data || data.open === 0) return null;
  const critical = data.critical > 0;
  return (
    <div
      role="alert"
      className={`flex flex-wrap items-center gap-3 rounded-lg border p-4 ${critical ? "border-destructive/40 bg-destructive/10" : "border-amber-500/40 bg-amber-500/10"}`}
    >
      <BellRing className={`h-5 w-5 shrink-0 ${critical ? "text-destructive" : "text-amber-700 dark:text-amber-300"}`} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">
          {data.open} open {data.open === 1 ? "alert" : "alerts"}
          {critical ? ` (${data.critical} critical)` : ""}
        </div>
        {data.top && (
          <div className="mt-0.5 break-words text-xs text-muted-foreground">{data.top.title}</div>
        )}
      </div>
      <Button asChild size="sm" variant={critical ? "destructive" : "outline"}>
        <Link to="/admin/alerts">
          View alerts
          <ArrowUpRight />
        </Link>
      </Button>
    </div>
  );
}
