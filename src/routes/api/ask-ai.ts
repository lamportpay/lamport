import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai/gateway/run-id.server";

const MODEL = "openai/gpt-6-astra";
const MAX_MESSAGES = 30;
const MAX_CHARS = 1000;

const INSTRUCTIONS = `You are Lammy, LamportPay's Ask AI assistant on the public website. Answer briefly (2-6 sentences or a short list), friendly, in the user's language.
Facts you may use:
- LamportPay: "Crypto in. Local money out." Users send USDC (or SOL, swapped to USDC via a Jupiter quote) on Solana from their own wallet and receive a local bank payout through our licensed payout partner Stables.
- Non-custodial: LamportPay never holds funds, keys or balances. Sign-in is a plain-text message signature, never a transaction. Never ask for or accept seed phrases, private keys, passwords or full bank details; warn if the user shares them.
- Fee: one LamportPay fee of 2% of the total sent, taken out of it (send 150 USDC -> 3 USDC fee, 147 USDC to the payout partner). Payout partner fees, Jupiter swap costs and Solana network fees are separate and shown in the quote.
- Payment steps: connect wallet, choose amount and country, see quote, enter and check bank details, verify identity (KYC on the partner's hosted page; LamportPay stores only a status), review, sign in wallet, processing, complete.
- Status: the app currently runs in sandbox on Solana devnet. No real funds move and bank payouts are simulated. Live bank payouts launch only after production approval. Never claim live fiat payouts or real KYC.
- Sandbox destinations: United States, United Kingdom, India, Philippines. Nigeria and Pakistan are planned.
- Roadmap: Solana, Jupiter and Stables integrated (sandbox); Hyperliquid in progress; more cryptocurrencies, more payout providers, new countries, Circle and Tether, production launch and a B2B payout API are planned. No public API is offered today. No partnership is confirmed beyond what is listed.
- Contact: hello@lamportpay.com or the Contact page.
If you don't know something or it is account-specific, say so and point to the team. Do not invent numbers, partners or dates.`;

function bad(status: number, error: string) {
  return Response.json({ error }, { status });
}

export const Route = createFileRoute("/api/ask-ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return bad(500, "The assistant is not configured yet.");
        let messages: UIMessage[];
        try {
          const body = (await request.json()) as { messages?: UIMessage[] };
          messages = Array.isArray(body.messages) ? body.messages.slice(-MAX_MESSAGES) : [];
        } catch {
          return bad(400, "Invalid request.");
        }
        if (messages.length === 0) return bad(400, "Ask a question first.");
        // Keep only text parts and cap length, so the public endpoint can't be abused.
        messages = messages.map((m) => ({
          ...m,
          role: m.role === "assistant" ? "assistant" : "user",
          parts: m.parts
            .filter((p) => p.type === "text")
            .map((p) => ({ type: "text" as const, text: String((p as { text: string }).text).slice(0, MAX_CHARS) })),
        }));

        const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runIdFetch.fetch,
        });
        const result = streamText({
          model: provider.responses(MODEL),
          instructions: INSTRUCTIONS,
          messages: await convertToModelMessages(messages),
          abortSignal: request.signal,
          providerOptions: {
            openai: {
              store: false,
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              include: ["reasoning.encrypted_content"],
            },
          },
        });
        return withLovableAiGatewayRunIdHeader(
          result.toUIMessageStreamResponse({
            originalMessages: messages,
            onError: (error) => {
              const status = (error as { statusCode?: number })?.statusCode;
              if (status === 429) return "Too many questions right now. Please wait a moment and try again.";
              if (status === 402 || status === 403) return "The assistant is temporarily unavailable. Please contact our team.";
              return "Sorry, something went wrong. Please try again.";
            },
          }),
          runIdFetch,
        );
      },
    },
  },
});
