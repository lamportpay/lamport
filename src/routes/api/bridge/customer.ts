import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { bridgeError, bridgeHeaders, getBridgeConfig } from "@/lib/bridge.config";

const CustomerInput = z
  .object({
    type: z.enum(["individual", "business"]).default("individual"),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().email().optional(),
  })
  .strict();

function errorResponse(message: string, status: number, extra?: Record<string, unknown>) {
  return Response.json({ error: message, ...extra }, { status });
}

export const Route = createFileRoute("/api/bridge/customer")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const config = getBridgeConfig();
        if (!config.enabled) {
          return errorResponse(
            "Payout partner API is not configured. Add BRIDGE_API_KEY to create real customers.",
            200,
            { demoMode: true },
          );
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return errorResponse("Invalid JSON body.", 400);
        }

        const parsed = CustomerInput.safeParse(body);
        if (!parsed.success) {
          return errorResponse(parsed.error.issues[0]?.message ?? "Invalid request.", 400);
        }

        const idempotencyKey = request.headers.get("Idempotency-Key") || crypto.randomUUID();

        const upstream = await fetch(`${config.apiUrl}/v0/customers`, {
          method: "POST",
          headers: bridgeHeaders(config, idempotencyKey),
          body: JSON.stringify(parsed.data),
        });

        const text = await upstream.text();
        if (!upstream.ok) {
          return errorResponse(bridgeError(upstream.status, text).error, 502, {
            bridgeStatus: upstream.status,
            bridgeRaw: text,
          });
        }

        let payload: Record<string, unknown>;
        try {
          payload = JSON.parse(text);
        } catch {
          return errorResponse("Invalid response from Payout partner API.", 502);
        }

        return Response.json({ bridgeMode: true, customer: payload });
      },
    },
  },
});
