import { describe, expect, it } from "vitest";

import {
  alertKind,
  alertPaymentIds,
  newAlertKeys,
  sortAlerts,
  summarizeAlerts,
} from "../src/lib/ops/admin-alerts";
import { PAYMENT_ENDED_PREFIX, PAYMENT_STUCK_PREFIX } from "../src/lib/ops/payment-alerts";

const P1 = "11111111-2222-4333-8444-555555555555";
const P2 = "66666666-7777-4888-9999-aaaaaaaaaaaa";

const row = (key: string, severity: string, opened_at: string) => ({
  key,
  severity,
  title: `title ${key}`,
  opened_at,
});

describe("Admin alerts presentation", () => {
  it("names the kind of alert from its key", () => {
    expect(alertKind(`${PAYMENT_ENDED_PREFIX}${P1}`)).toBe("ended_after_funds");
    expect(alertKind(`${PAYMENT_STUCK_PREFIX}${P1}`)).toBe("stuck_payment");
    expect(alertKind("webhook_missing")).toBe("webhooks");
    expect(alertKind("webhook_secret_missing")).toBe("webhooks");
  });

  it("lists critical alerts first, then the most recently opened", () => {
    const sorted = sortAlerts([
      row("a", "warning", "2026-11-19T01:00:00Z"),
      row("b", "critical", "2026-11-18T01:00:00Z"),
      row("c", "warning", "2026-11-19T02:00:00Z"),
      row("d", "critical", "2026-11-19T00:00:00Z"),
    ]);
    expect(sorted.map((r) => r.key)).toEqual(["d", "b", "c", "a"]);
  });

  it("summarizes open alerts for the badge, the dashboard bar and the pop-up", () => {
    expect(summarizeAlerts([])).toEqual({ open: 0, critical: 0, keys: [], top: null });
    const summary = summarizeAlerts([
      row("a", "warning", "2026-11-19T01:00:00Z"),
      row("b", "critical", "2026-11-18T01:00:00Z"),
    ]);
    expect(summary).toMatchObject({ open: 2, critical: 1, keys: ["b", "a"] });
    expect(summary.top?.key).toBe("b");
  });

  it("reports only alerts that opened since the previous look", () => {
    expect(newAlertKeys(null, ["a", "b"])).toEqual([]);
    expect(newAlertKeys(["a"], ["a", "b"])).toEqual(["b"]);
    expect(newAlertKeys(["a", "b"], ["a"])).toEqual([]);
    expect(newAlertKeys([], [])).toEqual([]);
  });

  it("finds the payments an alert names, and nothing else", () => {
    expect(alertPaymentIds({ payment_id: P1, transfer_id: "tr_1", status: "FAILED" })).toEqual([
      P1,
    ]);
    expect(
      alertPaymentIds({
        missing: 2,
        transfers: [
          { payment_id: P1, transfer_id: "tr_1" },
          { payment_id: P2, transfer_id: "tr_2" },
          { payment_id: P1, transfer_id: "tr_3" },
        ],
      }),
    ).toEqual([P1, P2]);
    expect(alertPaymentIds({ payment_id: "not-a-uuid" })).toEqual([]);
    expect(alertPaymentIds({ count: 3, event_ids: ["evt_1"] })).toEqual([]);
    expect(alertPaymentIds(null)).toEqual([]);
    expect(alertPaymentIds("payment")).toEqual([]);
  });
});
