/**
 * Server functions for Admin → Alerts: the operations alerts the reconcile job
 * keeps in `ops_alerts` (payments stuck at Stables, payments that ended after
 * funds reached Stables, webhook problems). Every function checks the admin
 * role server-side and reads through the admin's own session, so RLS (admins
 * only) still applies. Alerts hold IDs, counts, statuses and reasons only.
 */
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireAdminSession as requireAdmin } from "@/lib/admin-guard";
import {
  alertKind,
  alertPaymentIds,
  sortAlerts,
  summarizeAlerts,
  type AlertKind,
} from "@/lib/ops/admin-alerts";

/** Open alerts read at most; there is one row per payment or webhook problem. */
const OPEN_LIMIT = 200;
/** How far back the page lists resolved alerts. */
export const RESOLVED_DAYS = 7;
const RESOLVED_LIMIT = 50;

const COLUMNS =
  "key, severity, title, action, detail, opened_at, last_seen_at, resolved_at, notified_at";

export type AdminAlert = {
  key: string;
  kind: AlertKind;
  severity: "warning" | "critical";
  title: string;
  action: string | null;
  paymentIds: string[];
  openedAt: string;
  lastSeenAt: string;
  resolvedAt: string | null;
};

type AlertRow = {
  key: string;
  severity: string;
  title: string;
  action: string | null;
  detail: unknown;
  opened_at: string;
  last_seen_at: string;
  resolved_at: string | null;
};

function toAdminAlert(row: AlertRow): AdminAlert {
  return {
    key: row.key,
    kind: alertKind(row.key),
    severity: row.severity === "critical" ? "critical" : "warning",
    title: row.title,
    action: row.action,
    paymentIds: alertPaymentIds(row.detail),
    openedAt: row.opened_at,
    lastSeenAt: row.last_seen_at,
    resolvedAt: row.resolved_at,
  };
}

/** Open-alert count for the sidebar, the dashboard bar and the pop-up. */
export const getOpsAlertSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { data, error } = await context.supabase
      .from("ops_alerts")
      .select("key, severity, title, opened_at")
      .is("resolved_at", null)
      .limit(OPEN_LIMIT);
    if (error) throw new Error("Could not load alerts.");
    return summarizeAlerts(data ?? []);
  });

/** The Alerts page: every open alert, and those resolved in the last RESOLVED_DAYS days. */
export const getOpsAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const since = new Date(Date.now() - RESOLVED_DAYS * 24 * 60 * 60_000).toISOString();
    const [open, resolved] = await Promise.all([
      context.supabase.from("ops_alerts").select(COLUMNS).is("resolved_at", null).limit(OPEN_LIMIT),
      context.supabase
        .from("ops_alerts")
        .select(COLUMNS)
        .gte("resolved_at", since)
        .order("resolved_at", { ascending: false })
        .limit(RESOLVED_LIMIT),
    ]);
    if (open.error || resolved.error) throw new Error("Could not load alerts.");
    return {
      open: sortAlerts(open.data ?? []).map(toAdminAlert),
      resolved: (resolved.data ?? []).map(toAdminAlert),
      resolvedDays: RESOLVED_DAYS,
    };
  });
