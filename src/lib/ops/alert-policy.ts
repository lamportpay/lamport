/**
 * When an open operations alert is (re)sent to the team. Pure, unit-tested.
 *
 * The reconcile job runs every 5 minutes; without this, one broken webhook
 * endpoint would post the same message 288 times a day. An alert is sent when
 * it opens, when it becomes critical, and then as a reminder while it stays
 * open; a "resolved" notice follows only if the team was told it opened.
 */
import { formatDuration, type OpsAlert, type OpsAlertSeverity } from "./webhook-alerts";

export const REMIND_AFTER_MS: Record<OpsAlertSeverity, number> = {
  critical: 6 * 60 * 60_000,
  warning: 24 * 60 * 60_000,
};

/** What is stored about an alert that is still open. */
export type StoredAlert = {
  notified_at: string | null;
  notified_severity: OpsAlertSeverity | string | null;
};

export type NotifyReason = "opened" | "escalated" | "reminder";

export function notifyReason(
  stored: StoredAlert | null,
  alert: Pick<OpsAlert, "severity">,
  now: number = Date.now(),
): NotifyReason | null {
  if (!stored || !stored.notified_at) return "opened";
  if (alert.severity === "critical" && stored.notified_severity !== "critical") return "escalated";
  const last = Date.parse(stored.notified_at);
  if (!Number.isFinite(last) || now - last >= REMIND_AFTER_MS[alert.severity]) return "reminder";
  return null;
}

const LABEL: Record<NotifyReason, string> = {
  opened: "",
  escalated: " (now critical)",
  reminder: " (still open)",
};

function since(openedAt: string, now: number): string {
  const at = Date.parse(openedAt);
  return Number.isFinite(at) ? formatDuration(now - at) : "unknown time";
}

/** Plain text for a chat channel: mode, severity, title, next step, IDs. */
export function alertText(
  mode: string,
  alert: OpsAlert,
  reason: NotifyReason,
  openedAt: string,
  now: number = Date.now(),
): string {
  const lines = [
    `[LamportPay ${mode.toUpperCase()}] ${alert.severity.toUpperCase()}${LABEL[reason]}: ${alert.title}`,
    `Next: ${alert.action}`,
  ];
  if (reason !== "opened") lines.push(`Open for ${since(openedAt, now)}.`);
  if (Object.keys(alert.detail).length > 0) lines.push(`Details: ${JSON.stringify(alert.detail)}`);
  return lines.join("\n");
}

export function resolvedText(
  mode: string,
  title: string,
  openedAt: string,
  now: number = Date.now(),
): string {
  return `[LamportPay ${mode.toUpperCase()}] Resolved after ${since(openedAt, now)}: ${title}`;
}
