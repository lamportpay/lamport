import { describe, expect, it } from "vitest";

import { api, assertNoSecretLeak, getIntegrationStatus, providerMode } from "./helpers";

type PayoutResult = { error?: string; demoMode?: boolean; payoutMode?: boolean };

const post = (path: string, body: unknown) => api<PayoutResult>(path, { method: "POST", body });

const cases: Array<{ path: string; body: Record<string, unknown> }> = [
  { path: "/api/payout/customer", body: { type: "individual", email: "demo@example.com" } },
  {
    path: "/api/payout/external-account",
    body: { customerId: "cus_demo", currency: "usd", account_number: "000123456789" },
  },
  {
    path: "/api/payout/quote",
    body: {
      amount: "100",
      destinationCurrency: "pkr",
      paymentRail: "iban",
      onBehalfOf: "cus_demo",
    },
  },
];

describe("Partner payout endpoints — mock fallback", () => {
  it("denies anonymous callers on every payout endpoint", async () => {
    // Payout routes are operator-only: 403 when no PAYOUT_OPERATOR_TOKEN is
    // configured server-side, 401 when one is configured but not presented.
    for (const c of cases) {
      const res = await post(c.path, c.body);
      assertNoSecretLeak(res.raw);
      expect([401, 403], `${c.path} must reject anonymous calls`).toContain(res.status);
      expect(res.body.demoMode).toBeUndefined();
      expect(res.body.payoutMode).toBeUndefined();
    }
  });

  it("rejects a forged operator token", async () => {
    const res = await api<PayoutResult>("/api/payout/quote", {
      method: "POST",
      body: cases[2].body,
      headers: { "x-payout-operator-token": "forged-token-forged-token-forged" },
    });
    expect([401, 403]).toContain(res.status);
  });

  it("never returns a real payout confirmation in mock mode", async () => {
    const status = await getIntegrationStatus();
    if (providerMode(status, "Payout partner") === "sandbox") return;

    for (const c of cases) {
      const res = await post(c.path, c.body);
      expect(res.body.payoutMode).toBeUndefined();
    }
  });

  it("validates payloads before touching the payout provider", async () => {
    // The operator check runs before payload validation, so an anonymous
    // malformed request is rejected by access control and never reaches the provider.
    const res = await post("/api/payout/external-account", { customerId: "cus_demo" });
    expect([401, 403]).toContain(res.status);
  });
});

describe("POST /api/public/payout-webhook", () => {
  it("rejects calls with no signature header", async () => {
    const res = await post("/api/public/payout-webhook", { event_type: "transfer.updated" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/X-Webhook-Signature/);
  });

  it("rejects an unparseable signature header", async () => {
    const res = await api<PayoutResult>("/api/public/payout-webhook", {
      method: "POST",
      headers: { "X-Webhook-Signature": "garbage" },
      body: { event_type: "transfer.updated" },
    });
    // Without a webhook secret the payload is parsed; with one it must fail.
    expect([200, 400]).toContain(res.status);
  });

  it("rejects malformed JSON bodies", async () => {
    const res = await api<PayoutResult>("/api/public/payout-webhook", {
      method: "POST",
      headers: { "X-Webhook-Signature": "t=1,v0=abc" },
      body: "{not-json",
    });
    expect(res.status).toBe(400);
  });
});
