import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { bridgeError, bridgeHeaders, getBridgeConfig } from "@/lib/bridge.config";

const TransferInput = z
  .object({
    amount: z.string().min(1, "amount is required."),
    onBehalfOf: z.string().min(1, "onBehalfOf is required."),
    sourceCurrency: z.string().default("usdc"),
    destinationCurrency: z.string().min(1, "destinationCurrency is required."),
    paymentRail: z.string().min(1, "paymentRail is required."),
    externalAccountId: z.string().optional(),
    toAddress: z.string().optional(),
    developerFee: z.string().optional(),
  })
  .strict()
  .refine((data) => data.externalAccountId || data.toAddress, {
    message: "Either externalAccountId or toAddress must be provided.",
  });

function errorResponse(message: string, status: number, extra?: Record<string, unknown>) {
  return Response.json({ error: message, ...extra }, { status });
}

export const Route = createFileRoute("/api/bridge/transfer")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const config = getBridgeConfig();
        if (!config.enabled) {
          return errorResponse(
            "Bridge API is not configured. Add BRIDGE_API_KEY to create real transfers.",
            503,
            { demoMode: true },
          );
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return errorResponse("Invalid JSON body.", 400);
        }

        const parsed = TransferInput.safeParse(body);
        if (!parsed.success) {
          return errorResponse(parsed.error.issues[0]?.message ?? "Invalid request.", 400);
        }

        const {
          amount,
          onBehalfOf,
          sourceCurrency,
          destinationCurrency,
          paymentRail,
          externalAccountId,
          toAddress,
          developerFee,
        } = parsed.data;

        const idempotencyKey = request.headers.get("Idempotency-Key") || crypto.randomUUID();

        const destination: Record<string, string> = {
          payment_rail: paymentRail,
          currency: destinationCurrency,
        };
        if (externalAccountId) {
          destination.external_account_id = externalAccountId;
        }
        if (toAddress) {
          destination.to_address = toAddress;
        }

        const payload: Record<string, unknown> = {
          amount,
          on_behalf_of: onBehalfOf,
          source: { payment_rail: "bridge_wallet", currency: sourceCurrency },
          destination,
        };
        if (developerFee) {
          payload.developer_fee = developerFee;
        }

        const upstream = await fetch(`${config.apiUrl}/v0/transfers`, {
          method: "POST",
          headers: bridgeHeaders(config, idempotencyKey),
          body: JSON.stringify(payload),
        });

        const text = await upstream.text();
        if (!upstream.ok) {
          return errorResponse(bridgeError(upstream.status, text).error, 502, {
            bridgeStatus: upstream.status,
            bridgeRaw: text,
          });
        }

        let response: Record<string, unknown>;
        try {
          response = JSON.parse(text);
        } catch {
          return errorResponse("Invalid response from Bridge API.", 502);
        }

        return Response.json({ bridgeMode: true, transfer: response });
      },
    },
  },
});
