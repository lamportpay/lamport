/**
 * Solana compute budget for the mainnet funding transaction (Production
 * readiness Batch 1, 9 Nov 2026). A compute-unit limit plus a modest priority
 * fee helps the customer's payment land when mainnet is busy. Both come from
 * server configuration, within safe bounds; an invalid value refuses (LIVE does
 * not start, and no funding transaction is built), it is never guessed.
 *
 * The priority fee is paid by the customer's wallet in SOL as part of the
 * normal network fee. It is separate from, and does not change, the 2%
 * LamportPay fee, and the transaction keeps its single signature.
 *
 * SOLANA_COMPUTE_UNIT_LIMIT          compute units (default 120000; 50000–400000)
 * SOLANA_PRIORITY_FEE_MICROLAMPORTS  micro-lamports per compute unit (default 10000; 0–1000000)
 *
 * Worst case at the maximums: 400000 × 1000000 / 1e6 = 400000 lamports (0.0004 SOL).
 * Default: 120000 × 10000 / 1e6 = 1200 lamports.
 */
type Env = Record<string, string | undefined>;

export const COMPUTE_UNIT_LIMIT = { default: 120_000, min: 50_000, max: 400_000 } as const;
export const PRIORITY_FEE_MICROLAMPORTS = { default: 10_000, min: 0, max: 1_000_000 } as const;

export type PriorityFee = {
  computeUnitLimit: number;
  microLamportsPerUnit: number;
  /** Most this priority fee can cost the payer, in lamports (rounded up). */
  maxLamports: bigint;
};

function whole(
  env: Env,
  name: string,
  bounds: { default: number; min: number; max: number },
): number | string {
  const raw = env[name]?.trim();
  if (!raw) return bounds.default;
  if (!/^\d+$/.test(raw)) return `${name} must be a whole number.`;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < bounds.min || value > bounds.max) {
    return `${name} must be between ${bounds.min} and ${bounds.max}.`;
  }
  return value;
}

/** The configured compute budget, or a reason (never the raw value) when it is invalid. */
export function priorityFeeConfig(
  env: Env = process.env,
): { ok: true; fee: PriorityFee } | { ok: false; error: string } {
  const limit = whole(env, "SOLANA_COMPUTE_UNIT_LIMIT", COMPUTE_UNIT_LIMIT);
  if (typeof limit === "string") return { ok: false, error: limit };
  const price = whole(env, "SOLANA_PRIORITY_FEE_MICROLAMPORTS", PRIORITY_FEE_MICROLAMPORTS);
  if (typeof price === "string") return { ok: false, error: price };
  const micro = BigInt(limit) * BigInt(price);
  return {
    ok: true,
    fee: {
      computeUnitLimit: limit,
      microLamportsPerUnit: price,
      maxLamports: (micro + 999_999n) / 1_000_000n,
    },
  };
}
