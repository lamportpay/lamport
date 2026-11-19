/**
 * Admin-only access to Ask AI chats and complaints. RLS also limits these rows to admins.
 * Escalation to Stables (19 Nov 2026): Stables has no ticket API, so the admin records each
 * step here (message sent, Stables' reply, the answer published to the customer); every step
 * is written to the admin audit log.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireAdminSession as requireAdmin } from "@/lib/admin-guard";
import {
  MAX_CUSTOMER_ANSWER,
  MAX_STABLES_MESSAGE,
  MAX_STABLES_REPLY,
  requestReference,
  type PaymentContext,
} from "@/lib/support/escalation";

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
  user_id: string | null;
  payment_id: string | null;
  stables_status: string | null;
  stables_message: string | null;
  stables_reference: string | null;
  stables_sent_at: string | null;
  stables_reply: string | null;
  stables_replied_at: string | null;
  customer_answer: string | null;
  customer_answer_published_at: string | null;
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

function actorOf(context: { userId: string; claims?: unknown }) {
  return {
    id: context.userId,
    email: (context.claims as { email?: string } | null)?.email ?? null,
  };
}

/** The payment a complaint is about, for the message to Stables (IDs and status only). */
export const getSupportPaymentContextAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ paymentId: z.string().uuid() }).strict().parse(input),
  )
  .handler(async ({ data, context }): Promise<PaymentContext | null> => {
    await requireAdmin(context);
    const { data: row, error } = await context.supabase
      .from("payments")
      .select("id, transfer_id, status, created_at, destination_currency")
      .eq("id", data.paymentId)
      .maybeSingle();
    if (error) throw new Error("Could not load the payment.");
    return (row as PaymentContext | null) ?? null;
  });

const escalationInput = z.discriminatedUnion("action", [
  z.object({ action: z.literal("link_payment"), id: z.string().uuid(), paymentId: z.string().uuid().nullable() }).strict(),
  z
    .object({
      action: z.literal("mark_sent"),
      id: z.string().uuid(),
      message: z.string().trim().min(1).max(MAX_STABLES_MESSAGE),
      reference: z.string().trim().max(200).optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal("record_reply"),
      id: z.string().uuid(),
      reply: z.string().trim().min(1).max(MAX_STABLES_REPLY),
    })
    .strict(),
  z
    .object({
      action: z.literal("publish_answer"),
      id: z.string().uuid(),
      answer: z.string().trim().min(1).max(MAX_CUSTOMER_ANSWER),
    })
    .strict(),
  z.object({ action: z.literal("unpublish_answer"), id: z.string().uuid() }).strict(),
]);

/** One escalation step on a complaint; each is audit logged with the complaint's reference. */
export const escalateSupportChatAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => escalationInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const now = new Date().toISOString();
    const { data: current, error: readError } = await context.supabase
      .from("support_chats")
      .select("id, status, stables_status, customer_answer_published_at")
      .eq("id", data.id)
      .maybeSingle();
    if (readError || !current) throw new Error("Could not find this complaint.");

    let update: Record<string, unknown>;
    let audit: { action: string; field: string; newValue: string | null };
    switch (data.action) {
      case "link_payment": {
        if (data.paymentId) {
          const { data: payment, error } = await context.supabase
            .from("payments")
            .select("id")
            .eq("id", data.paymentId)
            .maybeSingle();
          if (error || !payment) throw new Error("No payment with that ID.");
        }
        update = { payment_id: data.paymentId };
        audit = { action: "payment_linked", field: "payment_id", newValue: data.paymentId };
        break;
      }
      case "mark_sent":
        update = {
          stables_status: "waiting_for_stables",
          stables_message: data.message,
          stables_reference: data.reference || null,
          stables_sent_at: now,
          ...(current.status === "open" && { status: "in_progress" }),
        };
        audit = {
          action: "sent_to_stables",
          field: "stables_status",
          newValue: data.reference ? `waiting_for_stables (${data.reference})` : "waiting_for_stables",
        };
        break;
      case "record_reply":
        if (!current.stables_status) throw new Error("Mark the request as sent to Stables first.");
        update = { stables_status: "stables_answered", stables_reply: data.reply, stables_replied_at: now };
        audit = { action: "stables_reply_recorded", field: "stables_status", newValue: "stables_answered" };
        break;
      case "publish_answer":
        update = {
          customer_answer: data.answer,
          customer_answer_published_at: now,
          status: "resolved",
        };
        audit = { action: "answer_published", field: "customer_answer", newValue: "published" };
        break;
      case "unpublish_answer":
        update = { customer_answer_published_at: null, status: "in_progress" };
        audit = { action: "answer_withdrawn", field: "customer_answer", newValue: "withdrawn" };
        break;
    }

    const { error } = await context.supabase
      .from("support_chats")
      .update({ ...update, updated_at: now } as never)
      .eq("id", data.id);
    if (error) throw new Error("Could not update the complaint.");

    const { logAdminActions } = await import("@/lib/admin.audit.server");
    await logAdminActions(context.supabase, actorOf(context), [
      {
        entityType: "support_request",
        entityId: data.id,
        entityReference: requestReference(data.id),
        action: audit.action,
        field: audit.field,
        newValue: audit.newValue,
      },
    ]);
    return { ok: true };
  });
