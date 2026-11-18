import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, BellRing, CheckCircle2, RefreshCw } from "lucide-react";

import {
  AdminPage,
  EmptyState,
  ErrorState,
  LoadingState,
  Panel,
} from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { getOpsAlerts, type AdminAlert } from "@/lib/admin-alerts.functions";
import { ALERT_KIND_LABEL } from "@/lib/ops/admin-alerts";
import { formatDuration } from "@/lib/ops/alert";

export const Route = createFileRoute("/_authenticated/admin/alerts")({
  head: () => ({ meta: [{ title: "Alerts | LamportPay Admin" }] }),
  component: AlertsPage,
});

function ago(iso: string): string {
  return `${formatDuration(Date.now() - Date.parse(iso))} ago`;
}

function SeverityChip({ severity }: { severity: AdminAlert["severity"] }) {
  return severity === "critical" ? (
    <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
      Critical
    </span>
  ) : (
    <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
      Warning
    </span>
  );
}

function PaymentLinks({ ids }: { ids: string[] }) {
  if (ids.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {ids.map((id) => (
        <Button asChild key={id} variant="outline" size="sm">
          <Link to="/admin/payments/$id" params={{ id }}>
            Payment {id.slice(0, 8)}
            <ArrowUpRight />
          </Link>
        </Button>
      ))}
    </div>
  );
}

function OpenAlert({ alert }: { alert: AdminAlert }) {
  return (
    <li className="space-y-2 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <SeverityChip severity={alert.severity} />
        <span className="text-xs text-muted-foreground">{ALERT_KIND_LABEL[alert.kind]}</span>
      </div>
      <div className="break-words text-sm font-medium">{alert.title}</div>
      {alert.action && (
        <p className="break-words text-sm text-muted-foreground">{alert.action}</p>
      )}
      <div className="text-xs text-muted-foreground">
        <span title={new Date(alert.openedAt).toLocaleString()}>
          Opened {ago(alert.openedAt)}
        </span>
        {" · "}
        <span title={new Date(alert.lastSeenAt).toLocaleString()}>
          last checked {ago(alert.lastSeenAt)}
        </span>
      </div>
      <PaymentLinks ids={alert.paymentIds} />
    </li>
  );
}

function ResolvedAlert({ alert }: { alert: AdminAlert }) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 space-y-1">
        <div className="break-words text-sm">{alert.title}</div>
        <div className="text-xs text-muted-foreground">{ALERT_KIND_LABEL[alert.kind]}</div>
      </div>
      {alert.resolvedAt && (
        <span
          className="shrink-0 text-xs text-muted-foreground"
          title={new Date(alert.resolvedAt).toLocaleString()}
        >
          Cleared {ago(alert.resolvedAt)}
        </span>
      )}
    </li>
  );
}

function AlertsPage() {
  const fetchAlerts = useServerFn(getOpsAlerts);
  const query = useQuery({
    queryKey: ["admin-ops-alerts"],
    queryFn: () => fetchAlerts(),
    refetchInterval: 30_000,
  });
  const data = query.data;

  return (
    <AdminPage
      title="Alerts"
      crumbs={[{ label: "Alerts" }]}
      description="Payments stuck at Stables, payments that ended after the funds reached Stables, and webhook problems. The payment status job checks every 5 minutes; an alert clears by itself when its cause is gone, and opening an operations case on a payment stops that payment's alert."
      actions={
        <>
          {query.dataUpdatedAt > 0 && (
            <span className="text-xs text-muted-foreground">
              Updated {new Date(query.dataUpdatedAt).toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw className={query.isFetching ? "motion-safe:animate-spin" : ""} />
            Refresh
          </Button>
        </>
      }
    >
      {query.isLoading && <LoadingState label="Loading alerts…" />}
      {query.isError && <ErrorState error={query.error} />}
      {data && (
        <div className="grid items-start gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <Panel
              title="Open"
              actions={
                <span
                  className={`rounded-md px-2 py-1 text-xs font-medium ${data.open.length ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}
                >
                  {data.open.length ? `${data.open.length} open` : "All clear"}
                </span>
              }
            >
              {data.open.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  No open alerts.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {data.open.map((alert) => (
                    <OpenAlert key={alert.key} alert={alert} />
                  ))}
                </ul>
              )}
            </Panel>
          </div>
          <Panel
            title={`Cleared in the last ${data.resolvedDays} days`}
            actions={<BellRing className="h-4 w-4 text-muted-foreground" />}
          >
            {data.resolved.length === 0 ? (
              <EmptyState>Nothing cleared recently.</EmptyState>
            ) : (
              <ul className="divide-y divide-border">
                {data.resolved.map((alert) => (
                  <ResolvedAlert key={alert.key} alert={alert} />
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </AdminPage>
  );
}
