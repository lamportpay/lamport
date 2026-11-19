import { createFileRoute } from "@tanstack/react-router";

/**
 * Answers the team published for support requests this browser made (19 Nov 2026). The Ask AI
 * chat keeps the random session IDs of the complaints it sent; posting them here returns only
 * the published answers, so an unknown or unanswered ID reveals nothing. Rate limited per IP.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAX_IDS = 10;

export const Route = createFileRoute("/api/support/updates")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { sessionIds?: unknown };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }
        const ids = Array.isArray(body.sessionIds)
          ? [...new Set(body.sessionIds.filter((v): v is string => typeof v === "string" && UUID.test(v)))]
          : [];
        if (ids.length === 0 || ids.length > MAX_IDS)
          return Response.json({ error: "Invalid request." }, { status: 400 });

        const { allowShared, clientKey } = await import("@/lib/payments/rate-limit.server");
        if (!(await allowShared("support-updates", clientKey(request, null), 60, 3600)))
          return Response.json({ error: "Too many requests. Please try again later." }, { status: 429 });

        try {
          const { publishedAnswersForSessions } = await import("@/lib/support-requests.server");
          return Response.json(
            { updates: await publishedAnswersForSessions(ids) },
            { headers: { "cache-control": "no-store" } },
          );
        } catch {
          return Response.json({ error: "Could not load updates." }, { status: 500 });
        }
      },
    },
  },
});
