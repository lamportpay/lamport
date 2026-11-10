/**
 * The payment-recovery assistant (src/lib/ai/recovery.server.ts) never sends customer text to
 * Lovable's AI gateway in LIVE (30 Oct 2026): its instructions describe the sandbox and the
 * gateway is not a processor named in the privacy policy. LIVE always answers with the fixed
 * steps for the payment's status.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const { streamText } = vi.hoisted(() => ({ streamText: vi.fn(() => ({ text: Promise.resolve("AI steps") })) }));
vi.mock("ai", () => ({ streamText }));
vi.mock("@ai-sdk/openai", () => ({ createOpenAI: () => ({ responses: () => "model" }) }));

import { generateRecoverySteps } from "@/lib/ai/recovery.server";
import { fallbackRecoverySteps } from "@/lib/ai/recovery-fallback";

const input = { description: "my payment is stuck, email me at a@b.co", status: "QUOTED", error: "" };

afterEach(() => {
  vi.unstubAllEnvs();
  streamText.mockClear();
});

describe("payment recovery assistant", () => {
  it("TEST with a gateway key: asks the AI gateway", async () => {
    vi.stubEnv("LAMPORTPAY_MODE", "test");
    vi.stubEnv("LOVABLE_API_KEY", "test-key");
    expect(await generateRecoverySteps(input)).toBe("AI steps");
    expect(streamText).toHaveBeenCalledTimes(1);
  });

  it("LIVE with a gateway key: fixed steps, customer text never sent", async () => {
    vi.stubEnv("LAMPORTPAY_MODE", "live");
    vi.stubEnv("LOVABLE_API_KEY", "test-key");
    expect(await generateRecoverySteps(input)).toBe(fallbackRecoverySteps("QUOTED"));
    expect(streamText).not.toHaveBeenCalled();
  });

  it("no gateway key (Vercel): fixed steps", async () => {
    vi.stubEnv("LAMPORTPAY_MODE", "test");
    vi.stubEnv("LOVABLE_API_KEY", "");
    expect(await generateRecoverySteps(input)).toBe(fallbackRecoverySteps("QUOTED"));
    expect(streamText).not.toHaveBeenCalled();
  });

  it("the fixed steps never describe a demo or promise a payout", () => {
    for (const status of ["PAYMENT_CREATED", "QUOTED", "AWAITING_FUNDS_COLLECTION", "IN_PROGRESS", "FAILED"]) {
      expect(fallbackRecoverySteps(status)).not.toMatch(/demo|sandbox|guarantee/i);
    }
  });
});
