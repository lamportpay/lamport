import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/** A Solana address is base58, 32-44 characters. Compared exactly (case sensitive). */
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/** Public early-access signup. Validated, rate limited per IP, stored with the admin client. */
const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  /**
   * The Solana wallet connected when joining. It decides the early-access fee
   * waiver (see lib/early-access.ts), so it is stored only as a candidate
   * address: the person who later pays from it still has to prove they hold it,
   * by signing the payment itself.
   */
  wallet: z
    .union([z.string().trim().regex(SOLANA_ADDRESS), z.literal(""), z.null()])
    .optional(),
});

export const Route = createFileRoute("/api/early-access")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed;
        try {
          parsed = schema.safeParse(await request.json());
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }
        if (!parsed.success)
          return Response.json({ error: "Please check your name and email address." }, { status: 400 });

        const { allowShared, clientKey } = await import("@/lib/payments/rate-limit.server");
        if (!(await allowShared("early-access", clientKey(request, null), 5, 3600)))
          return Response.json({ error: "Too many attempts. Please try again later." }, { status: 429 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("early_access_signups").insert({
          name: parsed.data.name,
          email: parsed.data.email.toLowerCase(),
          wallet_address: parsed.data.wallet || null,
        });
        if (error) {
          if (error.code === "23505") return Response.json({ ok: true, already: true });
          console.error("early-access: insert failed", error.message);
          return Response.json({ error: "Could not save. Please try again." }, { status: 500 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
