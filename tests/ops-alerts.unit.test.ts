/** Production alerts (lib/ops): webhook and stuck-payment rules, send policy, channel, the job step. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client.server", async () => {
  const { createFakeSupabase } = await import("./support/fake-supabase");
  return { supabaseAdmin: createFakeSupabase() };
});

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { alertText, notifyReason, REMIND_AFTER_MS, resolvedText } from "@/lib/ops/alert-policy";
import { runOpsAlerts } from "@/lib/ops/alerts.server";
import { alertChannelMisconfigured, sendOpsAlert } from "@/lib/ops/notify.server";
import { paymentAlerts, type StuckCandidate } from "@/lib/ops/payment-alerts";
import { webhookAlerts, type WebhookFacts } from "@/lib/ops/webhook-alerts";

import type { FakeSupabase } from "./support/fake-supabase";
import { TEST_ENV } from "./support/app-mode";

const NOW = Date.parse("2026-10-30T12:00:00Z");
const minutesAgo = (m: number, from = NOW) => new Date(from - m * 60_000).toISOString();
const HOUR = 60;

const facts = (over: Partial<WebhookFacts> = {}): WebhookFacts => ({
  stablesConfigured: true,
  secretConfigured: true,
  unapplied: [],
  transfers: [],
  ...over,
});
const delivery = (
  id: string,
  ageMin: number,
  error: string | null = "No payment for this transfer yet.",
) => ({
  event_id: id,
  event_type: "transfer.updated.status_transitioned",
  received_at: minutesAgo(ageMin),
  process_error: error,
});
const transfer = (id: string, ageMin: number, hasWebhook: boolean) => ({
  payment_id: `pay_${id}`,
  transfer_id: `tr_${id}`,
  created_at: minutesAgo(ageMin),
  hasWebhook,
});

describe("webhook alert rules", () => {
  it("raises nothing when all is well, or when Stables is not configured at all", () => {
    expect(webhookAlerts(facts({ transfers: [transfer("a", HOUR, true)] }), NOW)).toEqual([]);
    expect(
      webhookAlerts(facts({ stablesConfigured: false, secretConfigured: false }), NOW),
    ).toEqual([]);
  });

  it("is critical when no webhook secret is set", () => {
    const [alert] = webhookAlerts(facts({ secretConfigured: false }), NOW);
    expect(alert).toMatchObject({ key: "webhook_secret_missing", severity: "critical" });
  });

  it("leaves fresh deliveries to the retry, then warns, then is critical after 2 h", () => {
    expect(webhookAlerts(facts({ unapplied: [delivery("e1", 10)] }), NOW)).toEqual([]);
    expect(webhookAlerts(facts({ unapplied: [delivery("e1", 20)] }), NOW)[0]).toMatchObject({
      key: "webhook_not_applied",
      severity: "warning",
    });
    const [alert] = webhookAlerts(
      facts({ unapplied: [delivery("e1", 20), delivery("e2", 3 * HOUR, null)] }),
      NOW,
    );
    expect(alert).toMatchObject({ severity: "critical" });
    expect(alert.title).toBe("2 Stables webhooks not applied (oldest 3 h)");
    expect(alert.detail).toMatchObject({
      count: 2,
      oldest_received_at: minutesAgo(3 * HOUR),
      by_reason: { "No payment for this transfer yet.": 1, "no reason recorded": 1 },
      event_ids: ["e2", "e1"],
    });
  });

  it("lists at most five IDs but always the full count", () => {
    const many = Array.from({ length: 8 }, (_, i) => delivery(`e${i}`, 30 + i));
    const [alert] = webhookAlerts(facts({ unapplied: many }), NOW);
    expect(alert.detail["count"]).toBe(8);
    expect(alert.detail["event_ids"]).toHaveLength(5);
  });

  it("flags transfers with no webhook after 30 minutes; all silent is critical", () => {
    expect(webhookAlerts(facts({ transfers: [transfer("a", 10, false)] }), NOW)).toEqual([]);
    expect(webhookAlerts(facts({ transfers: [transfer("a", HOUR, false)] }), NOW)[0]).toMatchObject(
      { key: "webhook_missing", severity: "warning" },
    );
    const some = webhookAlerts(
      facts({ transfers: [transfer("a", HOUR, false), transfer("b", HOUR, true)] }),
      NOW,
    )[0];
    expect(some).toMatchObject({
      severity: "warning",
      title: "1 of 2 recent transfers have no Stables webhook",
    });
    const all = webhookAlerts(
      facts({ transfers: [transfer("a", HOUR, false), transfer("b", 2 * HOUR, false)] }),
      NOW,
    )[0];
    expect(all).toMatchObject({ severity: "critical" });
    expect(all.detail["transfers"]).toEqual([
      { payment_id: "pay_a", transfer_id: "tr_a" },
      { payment_id: "pay_b", transfer_id: "tr_b" },
    ]);
  });

  it("ignores transfers older than three days", () => {
    expect(webhookAlerts(facts({ transfers: [transfer("a", 4 * 24 * HOUR, false)] }), NOW)).toEqual(
      [],
    );
  });

  it("orders critical alerts first", () => {
    const alerts = webhookAlerts(
      facts({ secretConfigured: false, unapplied: [delivery("e1", 20)] }),
      NOW,
    );
    expect(alerts.map((a) => a.severity)).toEqual(["critical", "warning"]);
  });
});

describe("stuck payment rules", () => {
  const waiting = (over: Partial<StuckCandidate> = {}): StuckCandidate => ({
    id: "11111111-2222-3333-4444-555555555555",
    transfer_id: "tr_1",
    status: "IN_PROGRESS",
    created_at: minutesAgo(48 * HOUR),
    status_changed_at: minutesAgo(3 * HOUR),
    openCase: false,
    ...over,
  });

  it("follows the admin rule: quiet under 2 h, warning after, critical after 24 h", () => {
    expect(paymentAlerts([waiting({ status_changed_at: minutesAgo(HOUR) })], NOW)).toEqual([]);
    const [warning] = paymentAlerts([waiting()], NOW);
    expect(warning).toMatchObject({
      key: "payment_stuck:11111111-2222-3333-4444-555555555555",
      severity: "warning",
      title: "Payment 11111111 stuck: no update from Stables for 3 h (IN_PROGRESS)",
      detail: {
        payment_id: "11111111-2222-3333-4444-555555555555",
        transfer_id: "tr_1",
        status: "IN_PROGRESS",
        last_change_at: minutesAgo(3 * HOUR),
      },
    });
    expect(
      paymentAlerts([waiting({ status_changed_at: minutesAgo(25 * HOUR) })], NOW)[0],
    ).toMatchObject({
      severity: "critical",
    });
  });

  it("falls back to the creation time when no status change is recorded", () => {
    expect(
      paymentAlerts(
        [waiting({ status_changed_at: null, created_at: minutesAgo(30 * HOUR) })],
        NOW,
      )[0],
    ).toMatchObject({ severity: "critical" });
  });

  it("leaves out payments with an open case, and payments waiting on the user", () => {
    expect(paymentAlerts([waiting({ openCase: true })], NOW)).toEqual([]);
    expect(
      paymentAlerts(
        [
          waiting({
            status: "AWAITING_FUNDS_COLLECTION",
            status_changed_at: minutesAgo(48 * HOUR),
          }),
        ],
        NOW,
      ),
    ).toEqual([]);
  });

  it("covers a long compliance hold and puts critical first", () => {
    const alerts = paymentAlerts(
      [
        waiting({ id: "aaaaaaaa-0000", status: "COMPLIANCE_HOLD" }),
        waiting({ id: "bbbbbbbb-0000", status_changed_at: minutesAgo(30 * HOUR) }),
      ],
      NOW,
    );
    expect(alerts.map((a) => [a.key, a.severity])).toEqual([
      ["payment_stuck:bbbbbbbb-0000", "critical"],
      ["payment_stuck:aaaaaaaa-0000", "warning"],
    ]);
  });
});

describe("when an alert is sent", () => {
  const sentAt = (minutes: number) => minutesAgo(minutes);

  it("sends a new alert, then stays quiet until a reminder is due", () => {
    expect(notifyReason(null, { severity: "warning" }, NOW)).toBe("opened");
    expect(
      notifyReason({ notified_at: null, notified_severity: null }, { severity: "warning" }, NOW),
    ).toBe("opened");
    expect(
      notifyReason(
        { notified_at: sentAt(5), notified_severity: "warning" },
        { severity: "warning" },
        NOW,
      ),
    ).toBeNull();
    expect(
      notifyReason(
        { notified_at: minutesAgo(REMIND_AFTER_MS.warning / 60_000), notified_severity: "warning" },
        { severity: "warning" },
        NOW,
      ),
    ).toBe("reminder");
    expect(
      notifyReason(
        { notified_at: sentAt(6 * HOUR), notified_severity: "critical" },
        { severity: "critical" },
        NOW,
      ),
    ).toBe("reminder");
  });

  it("sends again at once when an alert becomes critical", () => {
    expect(
      notifyReason(
        { notified_at: sentAt(5), notified_severity: "warning" },
        { severity: "critical" },
        NOW,
      ),
    ).toBe("escalated");
  });

  it("writes mode, severity, next step and IDs", () => {
    const [alert] = webhookAlerts(facts({ transfers: [transfer("a", HOUR, false)] }), NOW);
    const text = alertText("test", alert, "reminder", minutesAgo(3 * HOUR), NOW);
    expect(text).toContain("[LamportPay TEST] WARNING (still open): 1 of 1 recent transfers");
    expect(text).toContain("Next: Check the deliveries");
    expect(text).toContain("Open for 3 h.");
    expect(text).toContain('"transfer_id":"tr_a"');
    expect(resolvedText("live", "X", minutesAgo(30), NOW)).toBe(
      "[LamportPay LIVE] Resolved after 30 min: X",
    );
  });
});

describe("alert channel", () => {
  const URL_ = "https://hooks.example.test/services/T000/B000/secret-part";
  const message = { text: "hello", fields: { key: "k", detail: { count: 1 } } };
  let logs: string[];

  beforeEach(() => {
    logs = [];
    for (const level of ["info", "warn", "error"] as const) {
      vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
        logs.push(args.map(String).join(" "));
      });
    }
  });
  afterEach(() => vi.restoreAllMocks());

  it("only logs when no channel is set", async () => {
    const fetchImpl = vi.fn();
    expect(await sendOpsAlert(message, {}, fetchImpl)).toBe("no_channel");
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(logs.some((l) => l.includes('"event":"ops_alert"'))).toBe(true);
  });

  it("refuses a non-https channel", async () => {
    const env = { OPS_ALERT_WEBHOOK_URL: "http://hooks.example.test/x" };
    const fetchImpl = vi.fn();
    expect(alertChannelMisconfigured(env)).toBe(true);
    expect(await sendOpsAlert(message, env, fetchImpl)).toBe("no_channel");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts Slack-style text by default, the full alert with the json format", async () => {
    const fetchImpl = vi.fn(async () => new Response("ok", { status: 200 }));
    expect(await sendOpsAlert(message, { OPS_ALERT_WEBHOOK_URL: URL_ }, fetchImpl)).toBe("sent");
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({ text: "hello" });

    await sendOpsAlert(
      message,
      { OPS_ALERT_WEBHOOK_URL: URL_, OPS_ALERT_WEBHOOK_FORMAT: "json" },
      fetchImpl,
    );
    expect(JSON.parse(fetchImpl.mock.calls[1][1].body)).toEqual({
      text: "hello",
      key: "k",
      detail: { count: 1 },
    });
  });

  it("reports a failed send and never logs the channel URL", async () => {
    const env = { OPS_ALERT_WEBHOOK_URL: URL_ };
    expect(
      await sendOpsAlert(
        message,
        env,
        vi.fn(async () => new Response("", { status: 500 })),
      ),
    ).toBe("failed");
    const boom = vi.fn(async () => {
      throw new TypeError(`fetch failed for ${URL_}`);
    });
    expect(await sendOpsAlert(message, env, boom)).toBe("failed");
    expect(logs.some((l) => l.includes("secret-part"))).toBe(false);
  });
});

describe("alerts step of the reconcile job", () => {
  const db = supabaseAdmin as unknown as FakeSupabase;
  const ENV_KEYS = [
    "LAMPORTPAY_MODE",
    "STABLES_API_KEY",
    "STABLES_API_URL",
    "STABLES_WEBHOOK_SECRET",
    "OPS_ALERT_WEBHOOK_URL",
  ];
  const saved: Record<string, string | undefined> = {};
  const fetchMock = vi.fn();
  const sentTexts = () => fetchMock.mock.calls.map((c) => JSON.parse(c[1].body).text as string);

  beforeEach(() => {
    db.reset();
    for (const k of ENV_KEYS) saved[k] = process.env[k];
    Object.assign(process.env, TEST_ENV, {
      STABLES_WEBHOOK_SECRET: "whsec_fixture",
      OPS_ALERT_WEBHOOK_URL: "https://hooks.example.test/alerts",
    });
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    for (const level of ["info", "warn", "error"] as const) {
      vi.spyOn(console, level).mockImplementation(() => {});
    }
  });
  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const addTransfer = (id: string, createdAt: string) =>
    db
      .table("payments")
      .push({ id, transfer_id: `tr_${id}`, status: "AWAITING_FUNDS", created_at: createdAt });

  it("sends once, stays quiet while open, and announces the resolution", async () => {
    addTransfer("p1", minutesAgo(HOUR));
    addTransfer("p2", minutesAgo(2 * HOUR));

    expect(await runOpsAlerts(NOW)).toEqual({
      open: 1,
      sent: 1,
      resolved: 0,
      failed: 0,
      deferred: 0,
      errors: [],
    });
    expect(sentTexts()[0]).toMatch(
      /^\[LamportPay TEST\] CRITICAL: No Stables webhooks are arriving/,
    );
    expect(db.table("ops_alerts")[0]).toMatchObject({
      key: "webhook_missing",
      notified_severity: "critical",
      notify_count: 1,
      resolved_at: null,
    });

    const later = NOW + 5 * 60_000;
    expect(await runOpsAlerts(later)).toMatchObject({ open: 1, sent: 0, resolved: 0, failed: 0 });

    db.table("stables_webhook_events").push(
      {
        event_id: "e1",
        event_type: "transfer.created",
        event_object_id: "tr_p1",
        received_at: minutesAgo(1, later),
        processed_at: later,
      },
      {
        event_id: "e2",
        event_type: "transfer.created",
        event_object_id: "tr_p2",
        received_at: minutesAgo(1, later),
        processed_at: later,
      },
    );
    expect(await runOpsAlerts(later + 60_000)).toMatchObject({
      open: 0,
      sent: 0,
      resolved: 1,
      failed: 0,
    });
    expect(sentTexts()[1]).toMatch(
      /^\[LamportPay TEST\] Resolved after 6 min: No Stables webhooks/,
    );
    expect(db.table("ops_alerts")[0]["resolved_at"]).not.toBeNull();
  });

  it("retries a send that failed on the next run", async () => {
    addTransfer("p1", minutesAgo(HOUR));
    fetchMock.mockImplementationOnce(async () => new Response("", { status: 503 }));

    expect(await runOpsAlerts(NOW)).toMatchObject({ sent: 0, failed: 1 });
    expect(db.table("ops_alerts")[0]).toMatchObject({ notified_at: null, notify_count: 0 });
    expect(await runOpsAlerts(NOW + 5 * 60_000)).toMatchObject({ sent: 1, failed: 0 });
  });

  it("reopens a resolved alert as new", async () => {
    db.table("ops_alerts").push({
      key: "webhook_secret_missing",
      severity: "critical",
      title: "old",
      detail: {},
      opened_at: minutesAgo(3 * 24 * HOUR),
      last_seen_at: minutesAgo(2 * 24 * HOUR),
      resolved_at: minutesAgo(2 * 24 * HOUR),
      notified_at: minutesAgo(3 * 24 * HOUR),
      notified_severity: "critical",
      notify_count: 4,
    });
    delete process.env["STABLES_WEBHOOK_SECRET"];

    expect(await runOpsAlerts(NOW)).toMatchObject({ open: 1, sent: 1 });
    expect(db.table("ops_alerts")[0]).toMatchObject({
      opened_at: new Date(NOW).toISOString(),
      resolved_at: null,
      notify_count: 1,
    });
    expect(sentTexts()[0]).toContain("CRITICAL: Stables webhooks are refused");
  });

  const addStuck = (id: string, changedMinutesAgo: number, status = "IN_PROGRESS") => {
    db.table("payments").push({
      id,
      transfer_id: `tr_${id}`,
      status,
      created_at: minutesAgo(48 * HOUR),
    });
    db.table("payment_events").push({
      id: db.nextId(),
      payment_id: id,
      to_status: status,
      created_at: minutesAgo(changedMinutesAgo),
    });
    // Webhooks arrived for it: only the stuck rule speaks.
    db.table("stables_webhook_events").push({
      event_id: `ev_${id}`,
      event_type: "transfer.created",
      event_object_id: `tr_${id}`,
      received_at: minutesAgo(48 * HOUR),
      processed_at: minutesAgo(48 * HOUR),
    });
  };

  it("alerts once per stuck payment and resolves it when Stables moves it on", async () => {
    addStuck("p1", 3 * HOUR);
    expect(await runOpsAlerts(NOW)).toMatchObject({ open: 1, sent: 1 });
    expect(sentTexts()[0]).toMatch(
      /^\[LamportPay TEST\] WARNING: Payment p1 stuck: no update from Stables for 3 h/,
    );
    expect(db.table("ops_alerts")[0]).toMatchObject({
      key: "payment_stuck:p1",
      severity: "warning",
    });

    expect(await runOpsAlerts(NOW + 5 * 60_000)).toMatchObject({ open: 1, sent: 0 });

    db.table("payments")[0]["status"] = "COMPLETED";
    expect(await runOpsAlerts(NOW + 10 * 60_000)).toMatchObject({ open: 0, resolved: 1 });
    expect(sentTexts()[1]).toMatch(/Resolved after 10 min: Payment p1 stuck/);
  });

  it("sends again when the payment becomes critical", async () => {
    addStuck("p1", 23 * HOUR);
    await runOpsAlerts(NOW);
    expect(await runOpsAlerts(NOW + 2 * 60 * 60_000)).toMatchObject({ sent: 1 });
    expect(sentTexts()[1]).toMatch(/CRITICAL \(now critical\): Payment p1 stuck/);
  });

  it("stops alerting once an operations case is opened", async () => {
    addStuck("p1", 3 * HOUR);
    await runOpsAlerts(NOW);
    db.table("payment_cases").push({ id: "c1", payment_id: "p1", status: "waiting_for_stables" });
    expect(await runOpsAlerts(NOW + 5 * 60_000)).toMatchObject({ open: 0, resolved: 1 });
  });

  it("sends at most ten per run and the rest on the next run", async () => {
    for (let i = 0; i < 12; i++) addStuck(`p${String(i).padStart(2, "0")}`, 3 * HOUR);
    expect(await runOpsAlerts(NOW)).toMatchObject({ open: 12, sent: 10, deferred: 2 });
    expect(await runOpsAlerts(NOW + 5 * 60_000)).toMatchObject({ open: 12, sent: 2, deferred: 0 });
  });

  it("keeps a rule set's alerts open while it cannot check", async () => {
    addTransfer("p1", minutesAgo(HOUR));
    addTransfer("p2", minutesAgo(HOUR));
    await runOpsAlerts(NOW);
    expect(db.table("ops_alerts")[0]).toMatchObject({ key: "webhook_missing", resolved_at: null });

    const from = db.from.bind(db);
    vi.spyOn(db, "from").mockImplementation((table: string) => {
      if (table === "stables_webhook_events") throw new Error("database unavailable");
      return from(table);
    });
    expect(await runOpsAlerts(NOW + 5 * 60_000)).toMatchObject({
      open: 0,
      resolved: 0,
      errors: ["webhooks"],
    });
    expect(db.table("ops_alerts")[0]["resolved_at"]).toBeNull();
  });

  it("sends nothing when there is nothing wrong", async () => {
    expect(await runOpsAlerts(NOW)).toMatchObject({ open: 0, sent: 0, resolved: 0, failed: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
