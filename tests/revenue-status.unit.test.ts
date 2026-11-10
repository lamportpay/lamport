import { describe, expect, it } from "vitest";

import {
  feeNetworkOf,
  revenueMinor,
  revenueStatus,
  testFeeMinor,
  type RevenueStatusRow,
} from "@/lib/payments/revenue-status";

const base: RevenueStatusRow = {
  status: "AWAITING_FUNDS_COLLECTION",
  transfer_id: "tr_1",
  platform_fee_minor: 3_000_000,
  platform_fee_received_minor: null,
  platform_fee_received_at: null,
  platform_fee_network: null,
  funding_verified_at: null,
};
const at = "2026-11-05T10:00:00.000Z";

describe("revenue status (5 Nov 2026)", () => {
  it("tells calculated, pending, failed and not-collected fees apart", () => {
    expect(revenueStatus({ ...base, status: "QUOTED", transfer_id: null })).toBe("calculated");
    expect(revenueStatus(base)).toBe("pending");
    for (const status of ["FAILED", "CANCELLED", "EXPIRED", "KYC_REJECTED"]) {
      expect(revenueStatus({ ...base, status })).toBe("failed");
    }
    // A completed payment with no fee receipt (TEST memo-only, before 5 Nov).
    expect(revenueStatus({ ...base, status: "COMPLETED" })).toBe("not_collected");
  });

  it("is collected, short or missing only from a verified receipt", () => {
    const receipt = { platform_fee_received_at: at, platform_fee_network: "solana" };
    expect(revenueStatus({ ...base, ...receipt, platform_fee_received_minor: 3_000_000 })).toBe(
      "collected",
    );
    expect(revenueStatus({ ...base, ...receipt, platform_fee_received_minor: 1 })).toBe("short");
    expect(revenueStatus({ ...base, ...receipt, platform_fee_received_minor: 0 })).toBe("missing");
    // A failed payment whose fee did arrive is still shown by its receipt.
    expect(
      revenueStatus({
        ...base,
        ...receipt,
        status: "FAILED",
        platform_fee_received_minor: 3_000_000,
      }),
    ).toBe("collected");
  });

  it("counts mainnet fees as revenue and devnet fees never", () => {
    const mainnet = {
      ...base,
      platform_fee_received_at: at,
      platform_fee_network: "solana",
      platform_fee_received_minor: 3_000_000,
    };
    const devnet = { ...mainnet, platform_fee_network: "solana-devnet" };
    expect(revenueMinor(mainnet)).toBe(3_000_000n);
    expect(testFeeMinor(mainnet)).toBe(0n);
    expect(revenueMinor(devnet)).toBe(0n);
    expect(testFeeMinor(devnet)).toBe(3_000_000n);
    expect(revenueMinor(base)).toBe(0n);
  });

  it("reads LIVE rows funded before 5 Nov as mainnet", () => {
    const legacy = { ...base, funding_verified_at: at, platform_fee_received_minor: 3_000_000 };
    expect(feeNetworkOf(legacy)).toBe("solana");
    expect(revenueStatus(legacy)).toBe("collected");
    expect(revenueMinor(legacy)).toBe(3_000_000n);
    expect(feeNetworkOf(base)).toBeNull();
  });
});
