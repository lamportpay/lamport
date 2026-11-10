import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  description: z.string().max(1500),
  status: z.string().max(60),
  error: z.string().max(600),
  lastStep: z.string().max(60).optional(),
});

export const getRecoverySteps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    // Every call is a paid model request and any signed-in account may call it: limit per user.
    const { allowShared } = await import("@/lib/payments/rate-limit.server");
    if (!(await allowShared("ai-recovery", `u:${context.userId}`, 10, 3600))) {
      return {
        ok: false as const,
        code: "rate_limited",
        message: "Too many requests. Please wait a moment and try again.",
      };
    }
    const { generateRecoverySteps, RecoveryError } = await import("./recovery.server");
    try {
      return { ok: true as const, steps: await generateRecoverySteps(data) };
    } catch (e) {
      if (e instanceof RecoveryError) return { ok: false as const, code: e.code, message: e.message };
      return { ok: false as const, code: "failed", message: "The assistant is unavailable right now." };
    }
  });
