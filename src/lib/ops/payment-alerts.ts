/**
 * Payment alerts. Stuck: a payment whose funds reached Stables and that has had
 * no status change for too long. Ended after funds: below. Pure (no I/O); `alerts.server.ts` gathers the
 * facts and sends what this returns.
 *
 * The rule is the admin's own ("No update from Stables" in `attention.ts`,
 * thresholds in `stuck.ts` / `ATTENTION_AFTER_MS`): warning after 2 h, critical
 * after 24 h. One alert per payment, so each is opened, escalated, reminded and
 * resolved on its own. A payment with an open operations case is left out: a
 * person is already following it, and the admin still shows it.
 */
import { attentionSignals } from "@/lib/payments/attention";

import { formatDuration, type OpsAlert, type RuleResult } from "./alert";

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

export function stuckPaymentAlerts(
  payments: StuckCandidate[],
  now: number = Date.now(),
): OpsAlert[] {
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

/**
 * Ended-after-funds alerts: the transfer failed, was cancelled or expired after
 * the user's funds reached Stables, so a refund has to be arranged with Stables
 * by hand (answers #1, #19). The admin's "ended after funds" rule, critical.
 *
 * The condition never clears by itself, so: any operations case on the payment
 * (open or closed) stops the alert, because the case is where the refund is
 * followed; and a payment that ended more than `ENDED_ALERT_WINDOW_MS` ago is
 * retired from the channel (after two weeks of reminders) and left to the
 * admin's Needs attention list, with a note saying so rather than "resolved".
 */
export const PAYMENT_ENDED_PREFIX = "payment_ended_after_funds:";
export const ENDED_ALERT_WINDOW_MS = 14 * 24 * 60 * 60_000;

export type EndedCandidate = {
  id: string;
  transfer_id: string | null;
  status: string;
  created_at: string;
  /** When it reached its final status (last status change; last update if unknown). */
  ended_at: string;
  funding_signature: string | null;
  funding_verified_at: string | null;
  /** It reached a funds state at some point (from its status changes). */
  everCollectedFunds: boolean;
  /** Any operations case, open or closed. */
  hasCase: boolean;
};

export function endedAfterFundsAlerts(
  payments: EndedCandidate[],
  now: number = Date.now(),
): RuleResult {
  const result: RuleResult = { alerts: [], retired: {} };
  for (const payment of payments) {
    if (payment.hasCase) continue;
    const signal = attentionSignals(payment, now).find((s) => s.code === "ended_after_funds");
    if (!signal) continue;
    const key = `${PAYMENT_ENDED_PREFIX}${payment.id}`;
    const endedAt = Date.parse(payment.ended_at);
    if (Number.isFinite(endedAt) && now - endedAt > ENDED_ALERT_WINDOW_MS) {
      result.retired[key] =
        "It ended more than 14 days ago and still has no operations case; it stays under Needs attention in Admin → Payments.";
      continue;
    }
    result.alerts.push({
      key,
      severity: "critical",
      title: `Payment ${payment.id.slice(0, 8)} ${payment.status.toLowerCase()} after funds reached Stables`,
      action: `${signal.action} Opening a case on the payment stops this alert.`,
      detail: {
        payment_id: payment.id,
        transfer_id: payment.transfer_id,
        status: payment.status,
        ended_at: payment.ended_at,
      },
    });
  }
  return result;
}
