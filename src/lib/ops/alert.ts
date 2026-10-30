/**
 * What every operations alert looks like, whichever rule raised it
 * (`webhook-alerts.ts`, `payment-alerts.ts`). An alert leaves LamportPay (chat,
 * email), so it carries IDs, counts, statuses and reasons only, never customer
 * details (names, bank details, wallet addresses, amounts).
 */

export type OpsAlertSeverity = "warning" | "critical";

export type OpsAlert = {
  /** Stable identity: one open alert per key. */
  key: string;
  severity: OpsAlertSeverity;
  title: string;
  /** What the operations team should do next. */
  action: string;
  /** IDs, counts, statuses and reasons only. */
  detail: Record<string, unknown>;
};

/** How many IDs an alert lists; the count is always complete. */
export const SAMPLE_SIZE = 5;

/** "45 min", "5 h", "3 days". */
export function formatDuration(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60_000));
  if (minutes < 120) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return hours < 48 ? `${hours} h` : `${Math.floor(hours / 24)} days`;
}
