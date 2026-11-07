/**
 * Revenue status of one payment's LamportPay fee, from stored records only
 * (5 Nov 2026). Pure; shared by the admin server functions and their tests.
 *
 *   calculated     quoted only: the fee is a number on a quote, nothing was charged
 *   pending        a transfer exists and the fee has not been seen on-chain yet
 *   collected      the revenue wallet received the full fee (verified on-chain)
 *   short          it received part of the fee
 *   missing        the transaction was verified but carried no fee
 *   failed         the payment ended (failed, cancelled, expired, rejected) with no fee
 *   not_collected  the payment completed but no fee receipt exists (e.g. TEST payments
 *                  before 5 Nov signed a memo that moved no funds) — for review
 *
 * Network: "solana" = mainnet (revenue). "solana-devnet" = TEST MODE devnet test
 * USDC: real on-chain evidence that the fee path works, never counted as revenue.
 */
export type FeeNetwork = "solana" | "solana-devnet";

export type RevenueStatus =
  "calculated" | "pending" | "collected" | "short" | "missing" | "failed" | "not_collected";

export type RevenueStatusRow = {
  status: string;
  transfer_id: string | null;
  platform_fee_minor: number | string | null;
  platform_fee_received_minor: number | string | null;
  platform_fee_received_at?: string | null;
  platform_fee_network?: string | null;
  funding_verified_at: string | null;
};

const ENDED_WITHOUT_PAYOUT = new Set(["FAILED", "CANCELLED", "EXPIRED", "KYC_REJECTED"]);

/** When the fee receipt was verified (LIVE rows before 5 Nov: the funding time). */
export function feeReceivedAt(row: RevenueStatusRow): string | null {
  return row.platform_fee_received_at ?? row.funding_verified_at ?? null;
}

/** Where the fee was seen; null while nothing was verified. */
export function feeNetworkOf(row: RevenueStatusRow): FeeNetwork | null {
  if (row.platform_fee_network === "solana" || row.platform_fee_network === "solana-devnet") {
    return row.platform_fee_network;
  }
  // Before 5 Nov only LIVE (mainnet) funding could record a fee.
  return row.funding_verified_at ? "solana" : null;
}

export function revenueStatus(row: RevenueStatusRow): RevenueStatus {
  const expected = BigInt(row.platform_fee_minor ?? 0);
  if (feeReceivedAt(row)) {
    const received = BigInt(row.platform_fee_received_minor ?? 0);
    if (received >= expected) return "collected";
    return received > 0n ? "short" : "missing";
  }
  if (ENDED_WITHOUT_PAYOUT.has(row.status)) return "failed";
  if (row.status === "COMPLETED") return "not_collected";
  if (!row.transfer_id) return "calculated";
  return "pending";
}

/** What the revenue wallet received for this payment, counted as revenue (mainnet only). */
export function revenueMinor(row: RevenueStatusRow): bigint {
  if (!feeReceivedAt(row) || feeNetworkOf(row) !== "solana") return 0n;
  return BigInt(row.platform_fee_received_minor ?? 0);
}

/** Devnet test fee received (proof the path works; never revenue). */
export function testFeeMinor(row: RevenueStatusRow): bigint {
  if (!feeReceivedAt(row) || feeNetworkOf(row) !== "solana-devnet") return 0n;
  return BigInt(row.platform_fee_received_minor ?? 0);
}
