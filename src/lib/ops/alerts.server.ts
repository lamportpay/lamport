/**
 * Runs the operations alerts: gather facts, keep `ops_alerts` in step, tell the
 * team. Called by the reconcile job (`/api/cron/reconcile-payments`) after it
 * has retried stored webhooks and re-read open transfers from Stables, so an
 * alert means catching up did not help. Two sets of rules: webhook failures
 * (`webhook-alerts.ts`) and stuck payments (`payment-alerts.ts`); if one cannot
 * gather its facts, the other still runs and the failed one's alerts stay as
 * they were.
 *
 * Each alert key has one row. A new or reopened alert is sent; while it stays
 * open it is sent again only when it becomes critical or a reminder is due
 * (`alert-policy.ts`); when its condition clears it is resolved, with a
 * "resolved" notice if the team had been told. Sending is claimed with a
 * conditional update on `notified_at`, so overlapping runs send once. A failed
 * send is released again and retried on the next run.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";
import { requestedMode } from "@/lib/app-mode.server";
import { WAITING_FOR_STABLES } from "@/lib/payments/stuck";
import { getStablesConfig, getStablesWebhookSecret } from "@/lib/stables/config.server";

import type { OpsAlert } from "./alert";
import { alertText, notifyReason, resolvedText } from "./alert-policy";
import { sendOpsAlert } from "./notify.server";
import { paymentAlerts, PAYMENT_STUCK_PREFIX, type StuckCandidate } from "./payment-alerts";
import {
  webhookAlerts,
  WEBHOOK_ALERT_AFTER_MS,
  type CheckedTransfer,
  type WebhookFacts,
} from "./webhook-alerts";

/** The webhook rules' keys: only these are resolved when no longer reported. */
export const WEBHOOK_ALERT_KEYS = [
  "webhook_secret_missing",
  "webhook_not_applied",
  "webhook_missing",
] as const;

/** Unapplied deliveries older than this are left to the history (the job stopped retrying). */
const UNAPPLIED_LOOKBACK_MS = 14 * 24 * 60 * 60_000;
/** A payment's transfer can be created days after its quote. */
const TRANSFER_PAYMENT_LOOKBACK_MS = 7 * 24 * 60 * 60_000;
const ROW_LIMIT = 500;
/**
 * New, escalated and reminder messages per run; the rest wait for the next run
 * (most severe first). Keeps a burst (say, every open payment stuck during a
 * Stables outage) inside the job's time budget and the channel's rate limit.
 */
const MAX_SENDS_PER_RUN = 10;

export type OpsAlertsReport = {
  open: number;
  sent: number;
  resolved: number;
  failed: number;
  /** Due, but over this run's send limit: sent by a later run. */
  deferred: number;
  /** Rule sets that could not gather their facts this run. */
  errors: string[];
};

function fail(what: string, error: { message: string } | null): never {
  throw new Error(`${what}: ${error?.message ?? "no data"}`);
}

async function gatherWebhookFacts(now: number): Promise<WebhookFacts> {
  const stablesConfigured = getStablesConfig().configured;
  const secretConfigured = Boolean(getStablesWebhookSecret());
  if (!stablesConfigured) {
    return { stablesConfigured, secretConfigured, unapplied: [], transfers: [] };
  }

  const unapplied = await supabaseAdmin
    .from("stables_webhook_events")
    .select("event_id, event_type, received_at, process_error")
    .is("processed_at", null)
    .gte("received_at", new Date(now - UNAPPLIED_LOOKBACK_MS).toISOString())
    .lte("received_at", new Date(now - WEBHOOK_ALERT_AFTER_MS.notApplied).toISOString())
    .order("received_at", { ascending: true })
    .limit(ROW_LIMIT);
  if (unapplied.error) fail("Load unapplied webhooks", unapplied.error);

  const payments = await supabaseAdmin
    .from("payments")
    .select("id, transfer_id, created_at, transfer_created_at:transfer_snapshot->>created_at")
    .not("transfer_id", "is", null)
    .gte("created_at", new Date(now - TRANSFER_PAYMENT_LOOKBACK_MS).toISOString())
    .order("created_at", { ascending: false })
    .limit(ROW_LIMIT);
  if (payments.error) fail("Load recent transfers", payments.error);

  const transferIds = payments.data.map((p) => p.transfer_id as string);
  const seen = new Set<string>();
  if (transferIds.length > 0) {
    const events = await supabaseAdmin
      .from("stables_webhook_events")
      .select("event_object_id")
      .in("event_object_id", transferIds);
    if (events.error) fail("Load webhooks for transfers", events.error);
    for (const e of events.data) if (e.event_object_id) seen.add(e.event_object_id);
  }

  const transfers: CheckedTransfer[] = payments.data.map((p) => ({
    payment_id: p.id,
    transfer_id: p.transfer_id as string,
    created_at:
      (typeof p.transfer_created_at === "string" && p.transfer_created_at) || p.created_at,
    hasWebhook: seen.has(p.transfer_id as string),
  }));

  return { stablesConfigured, secretConfigured, unapplied: unapplied.data, transfers };
}

/** Payments waiting on Stables after the deposit, with their last status change and cases. */
async function gatherStuckCandidates(): Promise<StuckCandidate[]> {
  const payments = await supabaseAdmin
    .from("payments")
    .select("id, transfer_id, status, created_at")
    .in("status", [...WAITING_FOR_STABLES])
    .order("created_at", { ascending: false })
    .limit(ROW_LIMIT);
  if (payments.error) fail("Load waiting payments", payments.error);
  if (payments.data.length === 0) return [];
  const ids = payments.data.map((p) => p.id);

  const [events, cases] = await Promise.all([
    supabaseAdmin
      .from("payment_events")
      .select("payment_id, created_at")
      .in("payment_id", ids)
      .not("to_status", "is", null)
      .order("created_at", { ascending: false })
      .limit(5000),
    supabaseAdmin
      .from("payment_cases")
      .select("payment_id")
      .in("payment_id", ids)
      .neq("status", "closed"),
  ]);
  if (events.error) fail("Load status changes", events.error);
  if (cases.error) fail("Load operations cases", cases.error);

  const lastChange = new Map<string, string>();
  for (const e of events.data)
    if (!lastChange.has(e.payment_id)) lastChange.set(e.payment_id, e.created_at);
  const withCase = new Set(cases.data.map((c) => c.payment_id));

  return payments.data.map((p) => ({
    ...p,
    status_changed_at: lastChange.get(p.id) ?? null,
    openCase: withCase.has(p.id),
  }));
}

type RuleSet = {
  name: string;
  /** Whether an alert key belongs to this rule set (so it may resolve it). */
  owns: (key: string) => boolean;
  alerts: (now: number) => Promise<OpsAlert[]>;
};

const RULE_SETS: RuleSet[] = [
  {
    name: "webhooks",
    owns: (key) => (WEBHOOK_ALERT_KEYS as readonly string[]).includes(key),
    alerts: async (now) => webhookAlerts(await gatherWebhookFacts(now), now),
  },
  {
    name: "stuck_payments",
    owns: (key) => key.startsWith(PAYMENT_STUCK_PREFIX),
    alerts: async (now) => paymentAlerts(await gatherStuckCandidates(), now),
  },
];

const ROW_COLUMNS =
  "key, title, opened_at, resolved_at, notified_at, notified_severity, notify_count";

type Row = {
  key: string;
  title: string;
  opened_at: string;
  resolved_at: string | null;
  notified_at: string | null;
  notified_severity: string | null;
  notify_count: number;
};

/** Claim the right to send: only one run moves notified_at from what it read. */
async function claimSend(row: Row, alert: Pick<OpsAlert, "severity">, at: string) {
  let query = supabaseAdmin
    .from("ops_alerts")
    .update({
      notified_at: at,
      notified_severity: alert.severity,
      notify_count: row.notify_count + 1,
    })
    .eq("key", row.key);
  query = row.notified_at
    ? query.eq("notified_at", row.notified_at)
    : query.is("notified_at", null);
  const { data, error } = await query.select("key");
  if (error) fail("Claim alert", error);
  return data.length > 0;
}

/** Give a claim back after a failed send so the next run tries again. */
async function releaseSend(row: Row, at: string) {
  const { error } = await supabaseAdmin
    .from("ops_alerts")
    .update({
      notified_at: row.notified_at,
      notified_severity: row.notified_severity,
      notify_count: row.notify_count,
    })
    .eq("key", row.key)
    .eq("notified_at", at);
  if (error) console.error(`[ops-alert] could not release ${row.key}:`, error.message);
}

export async function runOpsAlerts(now: number = Date.now()): Promise<OpsAlertsReport> {
  const report: OpsAlertsReport = {
    open: 0,
    sent: 0,
    resolved: 0,
    failed: 0,
    deferred: 0,
    errors: [],
  };
  const mode = requestedMode().mode;
  const at = new Date(now).toISOString();

  const alerts: OpsAlert[] = [];
  const checked: RuleSet[] = [];
  for (const rules of RULE_SETS) {
    try {
      alerts.push(...(await rules.alerts(now)));
      checked.push(rules);
    } catch (error) {
      report.errors.push(rules.name);
      console.error(`[ops-alert] ${rules.name} check failed`, error);
    }
  }
  alerts.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1));

  // Open rows (to resolve) and the rows of what is reported now (to reopen).
  const [openRows, reportedRows] = await Promise.all([
    supabaseAdmin.from("ops_alerts").select(ROW_COLUMNS).is("resolved_at", null),
    alerts.length > 0
      ? supabaseAdmin
          .from("ops_alerts")
          .select(ROW_COLUMNS)
          .in(
            "key",
            alerts.map((a) => a.key),
          )
      : Promise.resolve({ data: [] as Row[], error: null }),
  ]);
  if (openRows.error) fail("Load ops alerts", openRows.error);
  if (reportedRows.error) fail("Load ops alerts", reportedRows.error);
  const byKey = new Map<string, Row>(
    [...openRows.data, ...reportedRows.data].map((r) => [r.key, r]),
  );

  let sends = 0;
  for (const alert of alerts) {
    report.open++;
    const previous = byKey.get(alert.key);
    const reopened = !previous || previous.resolved_at !== null;
    const fields = {
      severity: alert.severity,
      title: alert.title,
      detail: alert.detail as Json,
      last_seen_at: at,
      ...(reopened && {
        opened_at: at,
        resolved_at: null,
        notified_at: null,
        notified_severity: null,
        notify_count: 0,
      }),
    };
    const { data: row, error } = await supabaseAdmin
      .from("ops_alerts")
      .upsert({ key: alert.key, ...fields }, { onConflict: "key" })
      .select(ROW_COLUMNS)
      .single();
    if (error || !row) fail("Store ops alert", error);

    const reason = notifyReason(row, alert, now);
    if (!reason) continue;
    if (sends >= MAX_SENDS_PER_RUN) {
      report.deferred++;
      continue;
    }
    if (!(await claimSend(row, alert, at))) continue;
    sends++;
    const delivery = await sendOpsAlert({
      text: alertText(mode, alert, reason, row.opened_at, now),
      fields: {
        mode,
        key: alert.key,
        reason,
        severity: alert.severity,
        title: alert.title,
        detail: alert.detail,
      },
    });
    if (delivery === "failed") {
      report.failed++;
      await releaseSend(row, at);
    } else {
      report.sent++;
    }
  }

  const reported = new Set(alerts.map((a) => a.key));
  for (const row of byKey.values()) {
    if (row.resolved_at !== null || reported.has(row.key)) continue;
    // Only a rule set that ran this time may say its condition has cleared.
    if (!checked.some((rules) => rules.owns(row.key))) continue;
    const { data, error } = await supabaseAdmin
      .from("ops_alerts")
      .update({ resolved_at: at })
      .eq("key", row.key)
      .is("resolved_at", null)
      .select("key");
    if (error) fail("Resolve ops alert", error);
    if (data.length === 0) continue; // another run resolved it
    report.resolved++;
    // Only worth a message if the team was told it opened.
    if (!row.notified_at) continue;
    await sendOpsAlert({
      text: resolvedText(mode, row.title, row.opened_at, now),
      fields: { mode, key: row.key, reason: "resolved", title: row.title },
    });
  }
  return report;
}
