/**
 * Stuck-payment alerts: a payment whose funds reached Stables and that has had
 * no status change for too long. Pure (no I/O); `alerts.server.ts` gathers the
 * facts and sends what this returns.
 *
 * The rule is the admin's own ("No update from Stables" in `attention.ts`,
 * thresholds in `stuck.ts` / `ATTENTION_AFTER_MS`): warning after 2 h, critical
 * after 24 h. One alert per payment, so each is opened, escalated, reminded and
 * resolved on its own. A payment with an open operations case is left out: a
 * person is already following it, and the admin still shows it.
 */
import { attentionSignals } from "@/lib/payments/attention";

import { formatDuration, type OpsAlert } from "./alert";

export const PAYMENT_STUCK_PREFIX = "payment_stuck:";

export type StuckCandidate = {
  id: string;
  transfer_id: string | null;
  status: string;
  created_at: string;
  /** When the payment last changed status (from its events); creation if never. */
  status_changed_at: string | null;
  openCase: boolean;
};

export function paymentAlerts(payments: StuckCandidate[], now: number = Date.now()): OpsAlert[] {
  const out: OpsAlert[] = [];
  for (const payment of payments) {
    if (payment.openCase) continue;
    const signal = attentionSignals(payment, now).find(
      (s) => s.code === "stables_slow" || s.code === "stables_very_slow",
    );
    if (!signal || signal.severity === "info") continue;
    const since = payment.status_changed_at ?? payment.created_at;
    out.push({
      key: `${PAYMENT_STUCK_PREFIX}${payment.id}`,
      severity: signal.severity,
      title: `Payment ${payment.id.slice(0, 8)} stuck: no update from Stables for ${formatDuration(now - Date.parse(since))} (${payment.status})`,
      action: `${signal.action} Or open an operations case on the payment, which stops these alerts.`,
      detail: {
        payment_id: payment.id,
        transfer_id: payment.transfer_id,
        status: payment.status,
        last_change_at: since,
      },
    });
  }
  return out.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1));
}
