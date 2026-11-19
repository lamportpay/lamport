/**
 * LamportPay's default per-payment limits, in major units of the funding
 * stablecoin (USDC/USDT). The only place these numbers live.
 *
 * Limits follow the payout partner, because Stables does the conversion and
 * payout, not LamportPay (Stables' answers, "LamportPay x Stables: Questions",
 * Q5):
 * - Minimum 25 (owner decision 2026-11-19; was 15 from 2026-10-07, 100 before):
 *   Stables' payout rails take at least 20 USD on most routes (GBP, EUR, INR, PHP,
 *   AED, NGN …). The minimum applies to the total sent, so 25 leaves 24.50 for
 *   Stables after the 2% fee and still about 21 USD after Stables' 3 USD
 *   processing fee, however Stables applies its own minimum; 20 or 21 would not.
 * - No LamportPay maximum (decision 2026-11-04, replacing the provisional 5,000
 *   of 3 Nov): the partner decides how much one transfer can be, and Stables
 *   applies its own per-customer and per-corridor limits at quote time.
 *
 * The server reads PAYMENT_MIN_* / PAYMENT_MAX_* over these defaults
 * (`limits.server.ts`), and admins can override per coin in Admin → Settings.
 * TEST MODE applies its own sandbox profile instead (`app-mode.ts`).
 * Client code may import this file: it holds no secrets.
 */
export const DEFAULT_MIN_MAJOR = "25";
/** Null: no LamportPay maximum. */
export const DEFAULT_MAX_MAJOR: string | null = null;
