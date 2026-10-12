import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

const INSTRUCTIONS = `You help LamportPay users recover an interrupted demo/sandbox payment.
LamportPay turns USDC on Solana into a bank payout through a payout partner. The /pay flow is:
Connect wallet → Select amount/country → Quote → Bank details & Review → Verify identity (partner's hosted page, only if not verified) → Sign in wallet (Pay Now) → Processing → Complete.
Rules:
- This is a demo/sandbox: no real money moves. Never claim live fiat payout.
- Never ask for private keys or seed phrases; warn if the user mentions them.
- Give 3-6 short numbered steps in plain language, tailored to the saved status, error and description.
- Mention the Continue button on the History page when the payment is unfinished.
- If the status is terminal (FAILED, CANCELLED, EXPIRED, KYC_REJECTED), suggest starting a new payment.
- End with one line on when to contact support. No markdown headings.`;

export type RecoveryErrorCode = "rate_limited" | "credits" | "denied" | "config" | "failed";

export class RecoveryError extends Error {
  constructor(public code: RecoveryErrorCode, message: string) {
    super(message);
  }
}

export async function generateRecoverySteps(input: {
  description: string;
  status: string;
  error: string;
  lastStep?: string;
}): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new RecoveryError("config", "The recovery assistant is not configured.");

  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });

  const prompt = [
    `Saved status: ${input.status || "unknown"}`,
    input.lastStep ? `Last step: ${input.lastStep}` : "",
    `Saved error: ${input.error || "none"}`,
    `User description: ${input.description || "(none)"}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = streamText({
      model: provider.responses(MODEL),
      system: INSTRUCTIONS,
      prompt,
      maxRetries: 0,
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    const text = (await result.text).trim();
    if (!text) throw new RecoveryError("failed", "The assistant returned no steps. Please try again.");
    return text;
  } catch (e) {
    if (e instanceof RecoveryError) throw e;
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 429) throw new RecoveryError("rate_limited", "Too many requests. Please wait a moment and try again.");
    if (status === 402) throw new RecoveryError("credits", "AI credits are used up for this workspace.");
    if (status === 403) throw new RecoveryError("denied", "The assistant could not answer this request.");
    console.error("recovery assistant failed", status);
    throw new RecoveryError("failed", "The assistant is unavailable right now. Please try again later.");
  }
}
