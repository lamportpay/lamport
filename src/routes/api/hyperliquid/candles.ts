import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { hyperliquidCall } from "@/lib/hyperliquid/http.server";
import { CANDLE_INTERVALS, getCandles } from "@/lib/hyperliquid/info.server";
import { handleUserRequest, json } from "@/lib/payments/http.server";
import { USER_LIMITS } from "@/lib/payments/rate-limit.server";

const Input = z
  .object({
    coin: z
      .string()
      .max(41)
      .regex(/^(?:@\d{1,6}|[A-Za-z0-9]{1,20}(?:\/[A-Za-z0-9]{1,20})?)$/, "Unknown market."),
    interval: z.enum(CANDLE_INTERVALS),
  })
  .strict();

/** POST /api/hyperliquid/candles - recent candles of a market (candleSnapshot). Read only. */
export const Route = createFileRoute("/api/hyperliquid/candles")({
  server: {
    handlers: {
      POST: ({ request }) =>
        handleUserRequest(
          request,
          Input,
          async (_user, body) =>
            json({ candles: await hyperliquidCall(() => getCandles(body.coin, body.interval)) }),
          USER_LIMITS.hyperliquidRead,
        ),
    },
  },
});
