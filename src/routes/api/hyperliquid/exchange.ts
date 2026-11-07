import { createFileRoute } from "@tanstack/react-router";

import { ExchangeRequest } from "@/lib/hyperliquid/actions";
import { relayTestnetAction } from "@/lib/hyperliquid/exchange.server";
import { handleUserRequest, json } from "@/lib/payments/http.server";
import { USER_LIMITS } from "@/lib/payments/rate-limit.server";

/**
 * POST /api/hyperliquid/exchange - TEST MODE only. Relays one Hyperliquid
 * TESTNET action signed in the customer's browser (approve a trading key,
 * spot limit order, cancel). The server checks the signer, never signs, and
 * tracks every action; anything else (transfers, withdrawals) is refused.
 */
export const Route = createFileRoute("/api/hyperliquid/exchange")({
  server: {
    handlers: {
      POST: ({ request }) =>
        handleUserRequest(
          request,
          ExchangeRequest,
          async (user, body) => json(await relayTestnetAction(user, body)),
          USER_LIMITS.hyperliquidAction,
        ),
    },
  },
});
