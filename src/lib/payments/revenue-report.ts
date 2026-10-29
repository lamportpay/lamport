/**
 * Revenue per day, week or month (UTC), from payments whose funding was
 * verified. Pure: the admin server function loads the rows (getRevenueReport
 * in src/lib/admin-ops.functions.ts).
 *
 * Totals are in USDC minor units. Payments are USDC only for now (owner
 * decision 30 Sep 2026); if USDT is switched on, its fees would be added to
 * the same totals (both have 6 decimals), so the report must then be split
 * per coin.
 */
export const REVENUE_PERIODS = { day: 1, week: 7, month: 30 } as const;
export type RevenuePeriod = keyof typeof REVENUE_PERIODS;

export type RevenueReportRow = {
  funding_verified_at: string | null;
  platform_fee_minor: number | string | null;
  platform_fee_received_minor: number | string | null;
};

/** Start of the UTC day ("YYYY-MM-DD"), Monday-based week ("YYYY-MM-DD") or month ("YYYY-MM"). */
export function bucketStart(iso: string, period: RevenuePeriod): string {
  const d = new Date(iso);
  const day = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  if (period === "day") return new Date(day).toISOString().slice(0, 10);
  if (period === "month") return new Date(day).toISOString().slice(0, 7);
  // Weeks start on Monday (UTC).
  const weekday = (new Date(day).getUTCDay() + 6) % 7;
  return new Date(day - weekday * 86_400_000).toISOString().slice(0, 10);
}

/** Expected and received LamportPay fees per period, newest period first. */
export function revenueByPeriod(
  rows: RevenueReportRow[],
  period: RevenuePeriod,
): { start: string; payments: number; expectedMinor: string; receivedMinor: string }[] {
  const buckets = new Map<string, { expected: bigint; received: bigint; payments: number }>();
  for (const row of rows) {
    if (!row.funding_verified_at) continue;
    const key = bucketStart(row.funding_verified_at, period);
    const b = buckets.get(key) ?? { expected: 0n, received: 0n, payments: 0 };
    b.expected += BigInt(row.platform_fee_minor ?? 0);
    b.received += BigInt(row.platform_fee_received_minor ?? 0);
    b.payments += 1;
    buckets.set(key, b);
  }
  return [...buckets]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([start, b]) => ({
      start,
      payments: b.payments,
      expectedMinor: b.expected.toString(),
      receivedMinor: b.received.toString(),
    }));
}
