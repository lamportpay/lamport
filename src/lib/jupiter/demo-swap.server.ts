/**
 * The public swap demonstration (`/api/jupiter/order`, `/api/jupiter/execute`,
 * used only by `SwapPanel`) is quote-only in LIVE: it never builds or relays a
 * real swap (decision 2026-11-03). Quotes (`/api/jupiter/quote`) stay available.
 *
 * TEST is unchanged: there the mode guard already refuses these endpoints,
 * because Jupiter has no devnet. Swaps that are part of a payment run through
 * `src/lib/payments/swaps.server.ts` and are not affected by this check.
 */
import { currentMode } from "@/lib/app-mode.server";
import type { ModeStatus } from "@/lib/app-mode";

export const DEMO_SWAP_QUOTE_ONLY_MESSAGE =
  "The swap demonstration shows quotes only. To convert and send, use Pay.";

/** The refusal message when the demonstration may not build or relay a swap, else null. */
export function demoSwapExecutionRefusal(status: ModeStatus = currentMode()): string | null {
  return status.mode === "live" ? DEMO_SWAP_QUOTE_ONLY_MESSAGE : null;
}
