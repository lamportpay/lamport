import { describe, expect, it } from "vitest";

import { bucketStart, revenueByPeriod } from "@/lib/payments/revenue-report";

describe("revenue report periods (UTC)", () => {
  it("groups by UTC day, not local time", () => {
    expect(bucketStart("2026-10-29T23:59:59Z", "day")).toBe("2026-10-29");
    expect(bucketStart("2026-10-29T23:30:00-02:00", "day")).toBe("2026-10-30");
  });

  it("starts weeks on Monday; Sunday belongs to the week before", () => {
    expect(bucketStart("2026-10-26T00:00:00Z", "week")).toBe("2026-10-26"); // Monday
    expect(bucketStart("2026-10-29T12:00:00Z", "week")).toBe("2026-10-26"); // Thursday
    expect(bucketStart("2026-11-01T23:59:59Z", "week")).toBe("2026-10-26"); // Sunday
    expect(bucketStart("2026-10-25T10:00:00Z", "week")).toBe("2026-10-19"); // Sunday before
    expect(bucketStart("2027-01-01T08:00:00Z", "week")).toBe("2026-12-28"); // across a year
  });

  it("groups by calendar month", () => {
    expect(bucketStart("2026-10-31T23:59:59Z", "month")).toBe("2026-10");
    expect(bucketStart("2026-11-01T00:00:00Z", "month")).toBe("2026-11");
  });
});

describe("revenueByPeriod", () => {
  const rows = [
    // 150 sent → 3.00 fee (2% of the total), received in full.
    {
      funding_verified_at: "2026-10-26T09:00:00Z",
      platform_fee_minor: 3_000_000,
      platform_fee_received_minor: 3_000_000,
    },
    // Fee short: expected 2.00, received 1.50 (flagged as a mismatch elsewhere).
    {
      funding_verified_at: "2026-10-29T15:00:00Z",
      platform_fee_minor: "2000000",
      platform_fee_received_minor: "1500000",
    },
    // Fee not received at all.
    {
      funding_verified_at: "2026-11-02T00:00:01Z",
      platform_fee_minor: 1_000_000,
      platform_fee_received_minor: null,
    },
    // Not verified: never counted.
    {
      funding_verified_at: null,
      platform_fee_minor: 9_000_000,
      platform_fee_received_minor: 9_000_000,
    },
  ];

  it("sums expected and received fees per week, newest week first", () => {
    expect(revenueByPeriod(rows, "week")).toEqual([
      { start: "2026-11-02", payments: 1, expectedMinor: "1000000", receivedMinor: "0" },
      { start: "2026-10-26", payments: 2, expectedMinor: "5000000", receivedMinor: "4500000" },
    ]);
  });

  it("sums per day and per month with exact integers", () => {
    expect(revenueByPeriod(rows, "day").map((r) => r.start)).toEqual([
      "2026-11-02",
      "2026-10-29",
      "2026-10-26",
    ]);
    expect(revenueByPeriod(rows, "month")).toEqual([
      { start: "2026-11", payments: 1, expectedMinor: "1000000", receivedMinor: "0" },
      { start: "2026-10", payments: 2, expectedMinor: "5000000", receivedMinor: "4500000" },
    ]);
  });

  it("returns nothing when no funding was verified", () => {
    expect(revenueByPeriod([], "day")).toEqual([]);
  });
});
