/**
 * Customer view of support requests (19 Nov 2026). Customers never read `support_chats`
 * directly (RLS: admins only). They get, through the server, only their own requests and
 * only what the admin chose to publish: never the internal note, the message sent to the
 * payout partner or the partner's own reply.
 */
import { CUSTOMER_COLUMNS, toCustomerRequest, type CustomerRequest } from "@/lib/support/customer-requests";

/** A signed-in customer's own complaints, newest first. */
export async function customerRequests(userId: string): Promise<CustomerRequest[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("support_chats")
    .select(CUSTOMER_COLUMNS)
    .eq("user_id", userId)
    .eq("is_complaint", true)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error("Could not load your requests.");
  return (data ?? []).map(toCustomerRequest);
}

/**
 * Published answers for chat sessions this browser started (the random session IDs it kept).
 * Only answered requests are returned, so an unknown or unanswered ID reveals nothing.
 */
export async function publishedAnswersForSessions(sessionIds: string[]): Promise<
  { sessionId: string; reference: string; answer: string; answeredAt: string }[]
> {
  if (sessionIds.length === 0) return [];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("support_chats")
    .select(
      "session_id, id, created_at, complaint_summary, last_question, payment_id, stables_status, customer_answer, customer_answer_published_at",
    )
    .in("session_id", sessionIds)
    .not("customer_answer_published_at", "is", null)
    .limit(sessionIds.length);
  if (error) throw new Error("Could not load updates.");
  return (data ?? []).flatMap((row) => {
    const request = toCustomerRequest(row);
    return request.answer && request.answeredAt
      ? [{ sessionId: row.session_id, reference: request.reference, answer: request.answer, answeredAt: request.answeredAt }]
      : [];
  });
}
