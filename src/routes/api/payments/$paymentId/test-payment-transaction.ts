import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { handleUserRequest, json } from "@/lib/payments/http.server";
import { USER_LIMITS } from "@/lib/payments/rate-limit.server";
import { prepareTestPaymentTransaction } from "@/lib/payments/test-payment.server";

const Input = z.object({ payer: z.string().trim().min(32).max(44) }).strict();

/**
 * POST /api/payments/:paymentId/test-payment-transaction - TEST MODE only. The
 * unsigned devnet "Pay Now" transaction: a memo naming this payment plus the
 * LamportPay fee in devnet test USDC to the revenue wallet. The wallet signs and
 * sends it; the server never sees a key. Refused in LIVE MODE.
 */
export const Route = createFileRoute("/api/payments/$paymentId/test-payment-transaction")({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        handleUserRequest(
          request,
          Input,
          async (user, body) =>
            json(await prepareTestPaymentTransaction(user, params.paymentId, body.payer)),
          USER_LIMITS.funding,
        ),
    },
  },
});
