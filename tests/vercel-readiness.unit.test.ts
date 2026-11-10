import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { authenticateCronRequest, cronSecrets } from "@/lib/cron-auth.server";
import { fallbackRecoverySteps } from "@/lib/ai/recovery-fallback";
import { PAYMENT_STATES } from "@/lib/payments/state";

const req = (auth?: string) =>
  new Request("https://example.test/api/cron/reconcile-payments", {
    headers: auth ? { authorization: auth } : {},
  });

describe("cron authentication", () => {
  it("accepts CRON_SECRET, the value Vercel Cron and the Supabase job send", async () => {
    expect(await authenticateCronRequest(req("Bearer s3cret-now"), { CRON_SECRET: "s3cret-now" })).toBeNull();
  });
  it("accepts the previous secret during a rotation, and the Lovable name", async () => {
    const env = { CRON_SECRET: "new-one", CRON_SECRET_PREVIOUS: "old-one" };
    expect(await authenticateCronRequest(req("Bearer old-one"), env)).toBeNull();
    expect(await authenticateCronRequest(req("Bearer lov"), { LOVABLE_CRON_SECRET: "lov" })).toBeNull();
  });
  it("refuses a wrong, missing or malformed token", async () => {
    const env = { CRON_SECRET: "s3cret-now" };
    expect((await authenticateCronRequest(req("Bearer nope"), env))?.status).toBe(401);
    expect((await authenticateCronRequest(req(), env))?.status).toBe(401);
    expect((await authenticateCronRequest(req("s3cret-now"), env))?.status).toBe(401);
    expect((await authenticateCronRequest(req("Bearer s3cret-now, x"), env))?.status).toBe(401);
  });
  it("answers 503 when no secret is set, and ignores empty values", async () => {
    expect((await authenticateCronRequest(req("Bearer "), {}))?.status).toBe(503);
    expect(cronSecrets({ CRON_SECRET: "" })).toEqual([]);
  });
  it("the reconcile route uses this check, not the Lovable-only one", () => {
    const route = readFileSync(new URL("../src/routes/api/cron/reconcile-payments.ts", import.meta.url), "utf8");
    expect(route).toContain('from "@/lib/cron-auth.server"');
    expect(route).not.toContain("integrations/supabase/cron-auth");
  });
});

describe("vercel.json", () => {
  it("is valid JSON (an empty file makes Vercel's build fail) and adds no second cron", () => {
    const cfg = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
    // The daily backstop is configured once, in vite.config.ts (Nitro vercel.config.crons).
    expect(cfg.crons).toBeUndefined();
  });
});

describe("recovery steps without an AI provider", () => {
  it("gives numbered plain-text steps for every payment status", () => {
    for (const s of PAYMENT_STATES) {
      const text = fallbackRecoverySteps(s);
      expect(text).toMatch(/^1\. /);
      expect(text).not.toMatch(/[*#]/);
      expect(text).toContain("never ask for your private key");
    }
  });
  it("tells the user to start again for ended payments and to continue for open ones", () => {
    for (const s of ["FAILED", "CANCELLED", "EXPIRED"]) expect(fallbackRecoverySteps(s)).toContain("start a new payment");
    expect(fallbackRecoverySteps("QUOTED")).toContain("Continue");
    expect(fallbackRecoverySteps("something-new")).toContain("Continue");
  });
});
