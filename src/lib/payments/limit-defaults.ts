/**
 * LamportPay's default per-payment limits, in major units of the funding
 * stablecoin (USDC/USDT). The only place these numbers live.
 *
 * Limits follow the payout partner, because Stables does the conversion and
 * payout, not LamportPay (Stables' answers, "LamportPay x Stables: Questions",
 * Q5):
 * - Minimum 15: Stables' 15 USD-equivalent minimum (decision 2026-10-07; was 100).
 * - No LamportPay maximum (decision 2026-11-04, replacing the provisional 5,000
 *   of 3 Nov): the partner decides how much one transfer can be, and Stables
 *   applies its own per-customer and per-corridor limits at quote time.
 *
 * The server reads PAYMENT_MIN_* / PAYMENT_MAX_* over these defaults
 * (`limits.server.ts`), and admins can override per coin in Admin → Settings.
 * TEST MODE applies its own sandbox profile instead (`app-mode.ts`).
 * Client code may import this file: it holds no secrets.
 */
export const DEFAULT_MIN_MAJOR = "15";
/** Null: no LamportPay maximum. */
export const DEFAULT_MAX_MAJOR: string | null = null;
