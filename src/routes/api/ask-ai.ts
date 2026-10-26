import { createFileRoute } from "@tanstack/react-router";
import { COMPLAINT_RE } from "@/lib/ask-ai-faq";

/**
 * Saves Ask AI chats for the admin "Complaints & chats" page. Answers are
 * built-in FAQs on the client, so no AI model (and no credits) is used.
 * Ordinary Q&A is never stored — only complaints and messages that include
 * a contact email (e.g. the contact form) reach the database.
 */
export const Route = createFileRoute("/api/ask-ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { sessionId?: unknown; messages?: unknown };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }
        const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
        if (!/^[0-9a-f-]{36}$/.test(sessionId) || !Array.isArray(body.messages))
          return Response.json({ error: "Invalid request." }, { status: 400 });

        // Public and unauthenticated: limit per IP before anything is stored.
        const { allowShared, trustedClientIp } = await import("@/lib/payments/rate-limit.server");
        if (!(await allowShared("ask-ai", trustedClientIp(request), 30, 3600)))
          return Response.json({ error: "Too many messages. Please try again later." }, { status: 429 });

        const messages = body.messages
          .slice(-60)
          .map((m: { role?: unknown; text?: unknown }) => ({
            role: m?.role === "assistant" ? "assistant" : "user",
            text: String(m?.text ?? "").slice(0, 2000),
          }))
          .filter((m) => m.text);
        const userTexts = messages.filter((m) => m.role === "user").map((m) => m.text);
        const complaints = userTexts.filter((t) => COMPLAINT_RE.test(t));
        const email = userTexts
          .map((t) => t.match(/[^@\s]+@[^@\s]+\.[^@\s]+/)?.[0])
          .filter(Boolean)
          .pop();

        if (!complaints.length && !email) return Response.json({ ok: true, stored: false });

        const row: Record<string, unknown> = {
          session_id: sessionId,
          messages,
          message_count: messages.length,
          last_question: userTexts.at(-1)?.slice(0, 300) ?? null,
          updated_at: new Date().toISOString(),
        };
        if (complaints.length) {
          row.is_complaint = true;
          row.complaint_summary = complaints.join(" / ").slice(0, 500);
        }
        if (email) row.contact_email = email.slice(0, 200);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("support_chats")
          .upsert(row as never, { onConflict: "session_id" });
        if (error) {
          console.error("ask-ai: could not save chat", error.message);
          return Response.json({ ok: false }, { status: 500 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
