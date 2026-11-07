import { createFileRoute } from "@tanstack/react-router";

import { listEvents } from "@/lib/hyperliquid/tracking.server";
import { handleUserRequest, json } from "@/lib/payments/http.server";
import { USER_LIMITS } from "@/lib/payments/rate-limit.server";

/** GET /api/hyperliquid/history - the signed-in customer's Hyperliquid TESTNET test history. */
export const Route = createFileRoute("/api/hyperliquid/history")({
  server: {
    handlers: {
      GET: ({ request }) =>
        handleUserRequest(
          request,
          undefined,
          async (user) => json({ events: await listEvents(user.id, 50) }),
          USER_LIMITS.hyperliquidRead,
        ),
    },
  },
});
