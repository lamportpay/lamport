/**
 * LamportPay's default per-payment limits, in major units of the funding
 * stablecoin (USDC/USDT). The only place these numbers live.
 *
 * Both follow the payout partner, because Stables does the conversion and
 * payout, not LamportPay (Stables' answers, "LamportPay x Stables: Questions",
 * Q5):
 * - Minimum 15: Stables' 15 USD-equivalent minimum (decision 2026-10-07; was 100).
 * - Maximum 5,000: decision 2026-11-03, "5,000 for now". Stables sets no fixed
 *   per-transfer maximum and agrees one with the integrator; replace this
 *   value with the figure agreed with Stables.
 *
 * The server reads PAYMENT_MIN_* / PAYMENT_MAX_* over these defaults
 * (`limits.server.ts`), and admins can override per coin in Admin → Settings.
 * Stables applies its own per-customer and per-corridor limits on top, at
 * quote time. Client code may import this file: it holds no secrets.
 */
export const DEFAULT_MIN_MAJOR = "15";
export const DEFAULT_MAX_MAJOR = "5000";
