import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { runChecks } from "@/lib/hyperliquid/account.server";
import { ADDRESS_RE } from "@/lib/hyperliquid/signing";
import { handleUserRequest, json } from "@/lib/payments/http.server";
import { USER_LIMITS } from "@/lib/payments/rate-limit.server";

const Input = z
  .object({ account: z.string().regex(ADDRESS_RE, "Invalid address.").nullable() })
  .strict();

/**
 * POST /api/hyperliquid/checks - run every Hyperliquid TESTNET read plus the
 * mode-guard rules; the run is tracked in the customer's test history.
 */
export const Route = createFileRoute("/api/hyperliquid/checks")({
  server: {
    handlers: {
      POST: ({ request }) =>
        handleUserRequest(
          request,
          Input,
          async (user, body) =>
            json(await runChecks(user.id, body.account ? body.account.toLowerCase() : null)),
          USER_LIMITS.hyperliquidRead,
        ),
    },
  },
});
