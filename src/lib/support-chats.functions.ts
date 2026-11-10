/** Admin-only access to Ask AI chats and complaints. RLS also limits these rows to admins. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireAdminSession as requireAdmin } from "@/lib/admin-guard";

export type SupportChatRow = {
  id: string;
  session_id: string;
  messages: { role: string; text: string }[];
  message_count: number;
  last_question: string | null;
  is_complaint: boolean;
  complaint_summary: string | null;
  complaint_category: string | null;
  contact_email: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

type AdminContext = {
  supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" }) => unknown };
  userId: string;
  claims?: unknown;
};


export const listSupportChatsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ complaintsOnly: z.boolean() }).strict().parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    let q = context.supabase
      .from("support_chats")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(200);
    if (data.complaintsOnly) q = q.eq("is_complaint", true);
    const { data: rows, error } = await q;
    if (error) throw new Error("Could not load chats.");
    return (rows ?? []) as unknown as SupportChatRow[];
  });

export const updateSupportChatAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["open", "in_progress", "resolved"]),
        adminNote: z.string().max(2000).optional(),
      })
      .strict()
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase
      .from("support_chats")
      .update({
        status: data.status,
        ...(data.adminNote !== undefined && { admin_note: data.adminNote }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error("Could not update the complaint.");
    return { ok: true };
  });
