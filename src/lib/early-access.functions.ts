/** Admin-only list of early-access signups (oldest first; first 10 get the fee waiver). */
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type EarlyAccessRow = { id: string; name: string; email: string; mobile: string; created_at: string };

export const listEarlyAccessAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw new Error("Could not verify admin access.");
    if (!isAdmin) throw new Error("Admin role required.");
    const { data, error } = await context.supabase
      .from("early_access_signups")
      .select("id,name,email,mobile,created_at")
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw new Error("Could not load signups.");
    return (data ?? []) as EarlyAccessRow[];
  });
