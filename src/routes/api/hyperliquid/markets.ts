import { createFileRoute } from "@tanstack/react-router";

import { getMarkets } from "@/lib/hyperliquid/account.server";
import { hyperliquidCall } from "@/lib/hyperliquid/http.server";
import { currentHlNetwork } from "@/lib/hyperliquid/info.server";
import { handleUserRequest, json } from "@/lib/payments/http.server";
import { USER_LIMITS } from "@/lib/payments/rate-limit.server";

/**
 * GET /api/hyperliquid/markets - USDC spot markets with prices, 24h change and
 * volume, and the network in use (testnet in TEST MODE, mainnet in LIVE MODE).
 * Read only.
 */
export const Route = createFileRoute("/api/hyperliquid/markets")({
  server: {
    handlers: {
      GET: ({ request }) =>
        handleUserRequest(
          request,
          undefined,
          async () =>
            json({ network: currentHlNetwork(), markets: await hyperliquidCall(getMarkets) }),
          USER_LIMITS.hyperliquidRead,
        ),
    },
  },
});
