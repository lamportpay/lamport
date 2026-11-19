/** "My requests": a signed-in customer's own complaints and the answers published to them. */
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMySupportRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { customerRequests } = await import("@/lib/support-requests.server");
    return customerRequests(context.userId);
  });
