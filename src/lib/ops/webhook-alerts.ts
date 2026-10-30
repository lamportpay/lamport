/**
 * Webhook alerts: when Stables webhooks are failing, tell the operations team.
 *
 * Pure (no I/O) so the rules are unit-tested; `alerts.server.ts` gathers the
 * facts and sends what this returns. An alert carries IDs, counts and reasons
 * only, never customer details, because it leaves LamportPay (chat, email).
 *
 * Webhooks are the primary status path (live sync and the reconcile job are the
 * safety nets), so these catch the three ways they fail quietly:
 * - a stored delivery that has not applied after the job retried it;
 * - transfers for which no delivery arrived at all (endpoint URL wrong, secret
 *   rotated on one side only, endpoint disabled in the Stables dashboard);
 * - no signing secret configured, so every signed delivery is refused.
 */

export type OpsAlertSeverity = "warning" | "critical";

export type OpsAlert = {
  /** Stable identity: one open alert per key. */
  key: string;
  severity: OpsAlertSeverity;
  title: string;
  /** What the operations team should do next. */
  action: string;
  /** IDs, counts and reasons only. */
  detail: Record<string, unknown>;
};

/** Thresholds, in one place so they can be reviewed and changed together. */
export const WEBHOOK_ALERT_AFTER_MS = {
  /**
   * A delivery not applied after this long has been retried by the job (it
   * retries after 2 minutes, every 5 minutes): not a one-off.
   */
  notApplied: 15 * 60_000,
  /** Not applied for this long: critical. */
  notAppliedCritical: 2 * 60 * 60_000,
  /** Stables sends `transfer.created` within seconds; none after this long is missing. */
  missing: 30 * 60_000,
  /** Transfers created longer ago than this are not checked for a missing webhook. */
  missingLookback: 3 * 24 * 60 * 60_000,
} as const;

/** How many IDs an alert lists; the count is always complete. */
export const SAMPLE_SIZE = 5;
const REASON_LENGTH = 160;

export type UnappliedDelivery = {
  event_id: string;
  event_type: string;
  received_at: string;
  process_error: string | null;
};

export type CheckedTransfer = {
  payment_id: string;
  transfer_id: string;
  /** When the transfer was created at Stables (or the payment, if unknown). */
  created_at: string;
  /** At least one delivery about this transfer is stored. */
  hasWebhook: boolean;
};

export type WebhookFacts = {
  /** A Stables API key is configured (webhooks are expected at all). */
  stablesConfigured: boolean;
  secretConfigured: boolean;
  /** Stored deliveries with no processed_at (any age; filtered here). */
  unapplied: UnappliedDelivery[];
  /** Recent transfers and whether any delivery about them is stored. */
  transfers: CheckedTransfer[];
};

const ageOf = (iso: string, now: number) => {
  const at = Date.parse(iso);
  return Number.isFinite(at) ? now - at : 0;
};

function countBy<T>(items: T[], keyOf: (item: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of items) {
    const key = keyOf(item);
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

/** "45 min", "5 h", "3 days". */
export function formatDuration(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60_000));
  if (minutes < 120) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return hours < 48 ? `${hours} h` : `${Math.floor(hours / 24)} days`;
}

/** Every webhook alert that is open now, most severe first. Empty when all is well. */
export function webhookAlerts(facts: WebhookFacts, now: number = Date.now()): OpsAlert[] {
  const out: OpsAlert[] = [];
  if (!facts.stablesConfigured) return out;

  if (!facts.secretConfigured) {
    out.push({
      key: "webhook_secret_missing",
      severity: "critical",
      title: "Stables webhooks are refused: STABLES_WEBHOOK_SECRET is not set",
      action:
        "Set STABLES_WEBHOOK_SECRET to the endpoint's signing secret from the Stables dashboard and redeploy. Stables retries refused deliveries, and the reconcile job keeps statuses moving meanwhile.",
      detail: {},
    });
  }

  const unapplied = facts.unapplied
    .filter((e) => ageOf(e.received_at, now) >= WEBHOOK_ALERT_AFTER_MS.notApplied)
    .sort((a, b) => Date.parse(a.received_at) - Date.parse(b.received_at));
  if (unapplied.length > 0) {
    const oldest = ageOf(unapplied[0].received_at, now);
    out.push({
      key: "webhook_not_applied",
      severity: oldest >= WEBHOOK_ALERT_AFTER_MS.notAppliedCritical ? "critical" : "warning",
      title: `${unapplied.length} Stables webhook${unapplied.length === 1 ? "" : "s"} not applied (oldest ${formatDuration(oldest)})`,
      action:
        "Read the reasons below. The reconcile job keeps retrying for 3 days; compare the payment with Stables (Recheck Stables in Admin → Payments) and fix the cause.",
      detail: {
        count: unapplied.length,
        oldest_received_at: unapplied[0].received_at,
        by_type: countBy(unapplied, (e) => e.event_type),
        by_reason: countBy(unapplied, (e) =>
          (e.process_error?.trim() || "no reason recorded").slice(0, REASON_LENGTH),
        ),
        event_ids: unapplied.slice(0, SAMPLE_SIZE).map((e) => e.event_id),
      },
    });
  }

  const due = facts.transfers.filter((t) => {
    const age = ageOf(t.created_at, now);
    return age >= WEBHOOK_ALERT_AFTER_MS.missing && age <= WEBHOOK_ALERT_AFTER_MS.missingLookback;
  });
  const missing = due.filter((t) => !t.hasWebhook);
  if (missing.length > 0) {
    // Every recent transfer silent (and more than one): the endpoint itself is broken.
    const allSilent = missing.length === due.length && due.length >= 2;
    out.push({
      key: "webhook_missing",
      severity: allSilent ? "critical" : "warning",
      title: allSilent
        ? `No Stables webhooks are arriving (${missing.length} recent transfers, none received)`
        : `${missing.length} of ${due.length} recent transfers have no Stables webhook`,
      action: allSilent
        ? "Check the endpoint in the Stables dashboard: URL /api/public/stables-webhook on this deployment, enabled, and its signing secret equal to STABLES_WEBHOOK_SECRET. Its delivery log shows the response we gave. Statuses still move through the reconcile job."
        : "Check the deliveries for these transfers in the Stables dashboard. Statuses still move through the reconcile job.",
      detail: {
        missing: missing.length,
        checked: due.length,
        transfers: missing
          .slice(0, SAMPLE_SIZE)
          .map((t) => ({ payment_id: t.payment_id, transfer_id: t.transfer_id })),
      },
    });
  }

  return out.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1));
}
