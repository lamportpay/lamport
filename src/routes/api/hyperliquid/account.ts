import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { getAccountView } from "@/lib/hyperliquid/account.server";
import { hyperliquidCall } from "@/lib/hyperliquid/http.server";
import { ADDRESS_RE } from "@/lib/hyperliquid/signing";
import { handleUserRequest, json } from "@/lib/payments/http.server";
import { USER_LIMITS } from "@/lib/payments/rate-limit.server";

const Input = z.object({ account: z.string().regex(ADDRESS_RE, "Invalid address.") }).strict();

/**
 * POST /api/hyperliquid/account - balances, open orders, fills and ledger of a
 * Hyperliquid TESTNET account (public data, read only).
 */
export const Route = createFileRoute("/api/hyperliquid/account")({
  server: {
    handlers: {
      POST: ({ request }) =>
        handleUserRequest(
          request,
          Input,
          async (_user, body) =>
            json(await hyperliquidCall(() => getAccountView(body.account.toLowerCase()))),
          USER_LIMITS.hyperliquidRead,
        ),
    },
  },
});
