import { createFileRoute } from "@tanstack/react-router";

import {
  CSP_REPORT_MAX_BYTES,
  CSP_REPORT_RATE_PER_MINUTE,
  cspContentType,
  logCspViolation,
  parseCspReports,
  readBodyCapped,
} from "@/lib/csp-report.server";
import { allowShared, clientKey } from "@/lib/payments/rate-limit.server";

const empty = (status: number) => new Response(null, { status });

/**
 * POST /api/csp-report: Content-Security-Policy violation reports from browsers.
 *
 * Public and unauthenticated by nature. 415 unless a CSP report content type,
 * 413 above 8 KB (declared or actually sent), 429 above the shared per-IP limit,
 * 400 when the body is not a valid report. Valid reports are logged in reduced
 * form only (src/lib/csp-report.server.ts) and answered 204.
 */
export const Route = createFileRoute("/api/csp-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const contentType = cspContentType(request.headers.get("content-type"));
        if (!contentType) return empty(415);
        const declared = Number(request.headers.get("content-length") ?? "0");
        if (Number.isFinite(declared) && declared > CSP_REPORT_MAX_BYTES) return empty(413);
        if (!(await allowShared("csp-report", clientKey(request, null), CSP_REPORT_RATE_PER_MINUTE))) {
          return empty(429);
        }
        let body: string | null;
        try {
          body = await readBodyCapped(request, CSP_REPORT_MAX_BYTES);
        } catch {
          return empty(400); // not valid UTF-8, or the stream failed
        }
        if (body === null) return empty(413);
        const violations = parseCspReports(contentType, body);
        if (!violations) return empty(400);
        for (const v of violations) logCspViolation(v);
        return empty(204);
      },
    },
  },
});
