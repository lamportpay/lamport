import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { getActivity } from "@/lib/hyperliquid/account.server";
import { hyperliquidCall } from "@/lib/hyperliquid/http.server";
import { ADDRESS_RE } from "@/lib/hyperliquid/signing";
import { handleUserRequest, json } from "@/lib/payments/http.server";
import { USER_LIMITS } from "@/lib/payments/rate-limit.server";

const Input = z
  .object({
    account: z.string().regex(ADDRESS_RE, "Invalid address."),
    days: z.number().int().min(1).max(365).default(30),
  })
  .strict();

/**
 * POST /api/hyperliquid/activity - order history (historicalOrders), trades of
 * the last `days` days (userFillsByTime) and portfolio history (portfolio) of
 * a Hyperliquid account on the network in use. Public chain data, read only.
 */
export const Route = createFileRoute("/api/hyperliquid/activity")({
  server: {
    handlers: {
      POST: ({ request }) =>
        handleUserRequest(
          request,
          Input,
          async (_user, body) =>
            json(await hyperliquidCall(() => getActivity(body.account.toLowerCase(), body.days))),
          USER_LIMITS.hyperliquidRead,
        ),
    },
  },
});
