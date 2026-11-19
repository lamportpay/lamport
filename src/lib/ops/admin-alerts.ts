/**
 * Admin → Alerts presentation (19 Nov 2026). The reconcile job keeps one row per
 * operations alert in `ops_alerts` (`alerts.server.ts`); the admin shows the open
 * ones on its own Alerts page, as a count in the sidebar, as a bar on the
 * dashboard and as a pop-up while an admin page is open, so the team sees them
 * without a chat channel. Pure (no I/O), used by the server functions and the UI.
 */
import { PAYMENT_ENDED_PREFIX, PAYMENT_STUCK_PREFIX } from "./payment-alerts";

export type AlertKind = "ended_after_funds" | "stuck_payment" | "webhooks";

export type AlertSummaryRow = {
  key: string;
  severity: string;
  title: string;
  opened_at: string;
};

export type AlertSummary = {
  open: number;
  critical: number;
  /** Open alert keys, so the UI can tell which ones are new since it last looked. */
  keys: string[];
  /** The most severe, then most recent, open alert. */
  top: AlertSummaryRow | null;
};

export const ALERT_KIND_LABEL: Record<AlertKind, string> = {
  ended_after_funds: "Ended after funds reached Stables",
  stuck_payment: "Payment waiting on Stables",
  webhooks: "Stables webhooks",
};

export function alertKind(key: string): AlertKind {
  if (key.startsWith(PAYMENT_ENDED_PREFIX)) return "ended_after_funds";
  if (key.startsWith(PAYMENT_STUCK_PREFIX)) return "stuck_payment";
  return "webhooks";
}

/** Critical first, then the most recently opened. */
export function sortAlerts<T extends { severity: string; opened_at: string }>(rows: T[]): T[] {
  const rank = (s: string) => (s === "critical" ? 0 : 1);
  return [...rows].sort(
    (a, b) => rank(a.severity) - rank(b.severity) || b.opened_at.localeCompare(a.opened_at),
  );
}

export function summarizeAlerts(rows: AlertSummaryRow[]): AlertSummary {
  const sorted = sortAlerts(rows);
  return {
    open: rows.length,
    critical: rows.filter((r) => r.severity === "critical").length,
    keys: sorted.map((r) => r.key),
    top: sorted[0] ?? null,
  };
}

/**
 * Keys open now that were not open at the previous look. No previous look (the
 * page just loaded) means nothing is "new": the count and the page show those.
 */
export function newAlertKeys(previous: string[] | null, current: string[]): string[] {
  if (previous === null) return [];
  const seen = new Set(previous);
  return current.filter((key) => !seen.has(key));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The payments an alert names (its own payment, or the sample of transfers it lists). */
export function alertPaymentIds(detail: unknown): string[] {
  if (!detail || typeof detail !== "object") return [];
  const d = detail as Record<string, unknown>;
  const ids: unknown[] = [d["payment_id"]];
  if (Array.isArray(d["transfers"])) {
    for (const t of d["transfers"]) {
      if (t && typeof t === "object") ids.push((t as Record<string, unknown>)["payment_id"]);
    }
  }
  return [...new Set(ids.filter((id): id is string => typeof id === "string" && UUID.test(id)))];
}
