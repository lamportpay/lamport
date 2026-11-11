import { describe, expect, it } from "vitest";
import { retryAfterMs } from "@/lib/stables/client.server";

describe("Stables Retry-After", () => {
  it("is 0 without a header or with an unreadable one", () => {
    expect(retryAfterMs(null)).toBe(0);
    expect(retryAfterMs("")).toBe(0);
    expect(retryAfterMs("soon")).toBe(0);
    expect(retryAfterMs("-3")).toBe(0);
  });

  it("reads seconds", () => {
    expect(retryAfterMs("2")).toBe(2000);
    expect(retryAfterMs("0.5")).toBe(500);
  });

  it("reads an HTTP date", () => {
    const now = Date.parse("2026-11-12T10:00:00Z");
    expect(retryAfterMs("Thu, 12 Nov 2026 10:00:03 GMT", now)).toBe(3000);
    expect(retryAfterMs("Thu, 12 Nov 2026 09:59:00 GMT", now)).toBe(0);
  });

  it("caps long waits at 5 seconds", () => {
    expect(retryAfterMs("120")).toBe(5000);
  });
});
