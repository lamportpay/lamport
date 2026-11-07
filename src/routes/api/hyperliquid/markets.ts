import { createFileRoute } from "@tanstack/react-router";

import { getMarkets } from "@/lib/hyperliquid/account.server";
import { hyperliquidCall } from "@/lib/hyperliquid/http.server";
import { handleUserRequest, json } from "@/lib/payments/http.server";
import { USER_LIMITS } from "@/lib/payments/rate-limit.server";

/** GET /api/hyperliquid/markets - Hyperliquid TESTNET USDC spot markets with prices. Read only. */
export const Route = createFileRoute("/api/hyperliquid/markets")({
  server: {
    handlers: {
      GET: ({ request }) =>
        handleUserRequest(
          request,
          undefined,
          async () => json({ markets: await hyperliquidCall(getMarkets) }),
          USER_LIMITS.hyperliquidRead,
        ),
    },
  },
});
