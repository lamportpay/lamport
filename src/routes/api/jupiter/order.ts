import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { USDC_MINT, isSupportedInputMint } from "@/lib/tokens";

const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const OrderInput = z.object({
  inputMint: z.string().min(1, "inputMint is required."),
  outputMint: z.string().min(1, "outputMint is required."),
  amount: z
    .string()
    .min(1, "amount is required.")
    .regex(/^\d+$/, "amount must be a numeric string in the smallest token unit."),
  taker: z
    .string()
    .min(1, "taker is required.")
    .regex(BASE58_RE, "taker must be a valid Solana wallet address."),
});

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export const Route = createFileRoute("/api/jupiter/order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.JUPITER_API_KEY;
        if (!apiKey) return errorResponse("Missing Jupiter API key.", 500);

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return errorResponse("Invalid JSON body.", 400);
        }

        const parsed = OrderInput.safeParse(body);
        if (!parsed.success) {
          return errorResponse(parsed.error.issues[0]?.message ?? "Invalid request.", 400);
        }

        const { inputMint, outputMint, amount, taker } = parsed.data;

        if (!isSupportedInputMint(inputMint)) {
          return errorResponse("Unsupported inputMint. Only SOL is supported.", 400);
        }
        if (outputMint !== USDC_MINT) {
          return errorResponse("Unsupported outputMint. Only USDC is supported.", 400);
        }

        const url = new URL("https://api.jup.ag/swap/v2/order");
        url.searchParams.set("inputMint", inputMint);
        url.searchParams.set("outputMint", outputMint);
        url.searchParams.set("amount", amount);
        url.searchParams.set("taker", taker);

        let upstream: Response;
        try {
          upstream = await fetch(url, { headers: { "x-api-key": apiKey, Accept: "application/json" } });
        } catch {
          return errorResponse("Failed to reach Jupiter API.", 502);
        }

        let payload: {
          transaction?: string;
          requestId?: string;
          outAmount?: string;
          lastValidBlockHeight?: number;
          error?: string;
        };
        try {
          payload = (await upstream.json()) as typeof payload;
        } catch {
          return errorResponse("Invalid response from Jupiter API.", 502);
        }

        if (!upstream.ok) {
          return errorResponse(payload?.error ?? `Jupiter API error (${upstream.status}).`, 502);
        }

        return Response.json({
          transaction: payload.transaction ?? null,
          requestId: payload.requestId ?? null,
          outAmount: payload.outAmount ?? null,
          lastValidBlockHeight: payload.lastValidBlockHeight ?? null,
        });
      },
    },
  },
});