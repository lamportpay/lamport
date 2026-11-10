import { afterEach, describe, expect, it } from "vitest";

import { getPaymentLimits, limitsMessage, outsideLimits } from "@/lib/payments/limits.server";

const saved = { ...process.env };
afterEach(() => {
  process.env = { ...saved };
});

describe("payment limits", () => {
  it("defaults to a 15 minimum and no LamportPay maximum", () => {
    delete process.env["PAYMENT_MIN_USDC"];
    delete process.env["PAYMENT_MAX_USDC"];
    const limits = getPaymentLimits("usdc");
    expect(limits.min).toBe("15");
    expect(limits.max).toBeNull();
    expect(outsideLimits(14_999_999n, limits)).toBe(true);
    expect(outsideLimits(15_000_000n, limits)).toBe(false);
    expect(outsideLimits(5_000_000_000n, limits)).toBe(false);
    expect(outsideLimits(1_000_000_000_000_000n, limits)).toBe(false);
    expect(limitsMessage(limits, "USDC")).toBe("Payments must be at least 15 USDC.");
  });

  it("applies the same defaults to USDT", () => {
    delete process.env["PAYMENT_MIN_USDT"];
    delete process.env["PAYMENT_MAX_USDT"];
    const limits = getPaymentLimits("usdt");
    expect(limits.min).toBe("15");
    expect(limits.max).toBeNull();
  });

  it("an env value still overrides the default maximum", () => {
    process.env["PAYMENT_MAX_USDC"] = "1000000";
    expect(getPaymentLimits("usdc").max).toBe("1000000");
  });

  it("'none' removes LamportPay's maximum and keeps the minimum", () => {
    process.env["PAYMENT_MIN_USDT"] = "100";
    process.env["PAYMENT_MAX_USDT"] = "none";
    const limits = getPaymentLimits("usdt");
    expect(limits.maxMinor).toBeNull();
    expect(limits.max).toBeNull();
    expect(outsideLimits(99_000_000n, limits)).toBe(true);
    expect(outsideLimits(50_000_000_000_000n, limits)).toBe(false);
    expect(limitsMessage(limits, "USDT")).toBe("Payments must be at least 100 USDT.");
  });

  it("still rejects an invalid maximum", () => {
    process.env["PAYMENT_MAX_USDC"] = "lots";
    expect(() => getPaymentLimits("usdc")).toThrow(/PAYMENT_MAX_USDC/);
  });
});
