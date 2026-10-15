/** Admin-only list of early-access signups (oldest first; first 10 get the fee waiver). */
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { FEE_WAIVER_REASON } from "@/lib/early-access";

export type EarlyAccessRow = {
  id: string;
  name: string;
  email: string;
  /** Wallet linked when joining; what the fee waiver is matched against. */
  wallet_address: string | null;
  created_at: string;
};

export type EarlyAccessAdmin = {
  rows: EarlyAccessRow[];
  /** Places in line (1 = first) whose waived fee has actually been paid for. */
  waivedRanks: number[];
};

export const listEarlyAccessAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EarlyAccessAdmin> => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw new Error("Could not verify admin access.");
    if (!isAdmin) throw new Error("Admin role required.");
    const { data, error } = await context.supabase
      .from("early_access_signups")
      .select("id,name,email,wallet_address,created_at")
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw new Error("Could not load signups.");
    // Which of the free places have been used: a payment recorded with the
    // waiver carries the place in line that earned it.
    const { data: used, error: usedError } = await context.supabase
      .from("payments")
      .select("platform_fee_waiver_rank")
      .eq("platform_fee_waiver", FEE_WAIVER_REASON);
    if (usedError) throw new Error("Could not load fee waivers.");
    const waivedRanks = [
      ...new Set(
        (used ?? [])
          .map((r) => r.platform_fee_waiver_rank)
          .filter((n): n is number => typeof n === "number"),
      ),
    ].sort((a, b) => a - b);
    return { rows: (data ?? []) as EarlyAccessRow[], waivedRanks };
  });
