/** Route plumbing for /api/hyperliquid/*: Hyperliquid errors become API errors. */
import { PaymentError } from "@/lib/payments/service.server";

import { HyperliquidError } from "./info.server";

export async function hyperliquidCall<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (e) {
    if (e instanceof HyperliquidError) {
      throw new PaymentError(e.message, e.status, "hyperliquid_error");
    }
    throw e;
  }
}
