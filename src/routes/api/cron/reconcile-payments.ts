import { createFileRoute } from "@tanstack/react-router";

import { authenticateCronRequest } from "@/lib/cron-auth.server";
import { runOpsAlerts } from "@/lib/ops/alerts.server";
import { reconcilePayments } from "@/lib/payments/service.server";

/** Stop starting new checks after this long, well inside function time limits. */
const TIME_BUDGET_MS = 45_000;

async function run(request: Request): Promise<Response> {
  const denied = await authenticateCronRequest(request);
  if (denied) return denied;
  try {
    const report = await reconcilePayments({ deadline: Date.now() + TIME_BUDGET_MS });
    console.info(JSON.stringify({ event: "payments_reconciled", ...report }));
    // After the retries above, so an alert means retrying did not help. Its own
    // failure never fails the reconciliation it follows.
    const alerts = await runOpsAlerts().catch((error) => {
      console.error("[ops-alert] run failed", error);
      return { error: "Alerts check failed." };
    });
    console.info(JSON.stringify({ event: "ops_alerts_checked", ...alerts }));
    return Response.json({ ...report, alerts }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[reconcile] run failed", error);
    return Response.json({ error: "Reconciliation failed." }, { status: 500 });
  }
}

/**
 * GET|POST /api/cron/reconcile-payments — `Authorization: Bearer $CRON_SECRET`.
 *
 * Catches up on missed or unprocessed Stables webhooks: retries stored
 * deliveries that were never applied, then reads every active transfer with
 * GET /api/v1/transfers/:id (the route behind Stables' MCP `get_transfer`) and
 * moves payments forward, recording the settled payout of completed ones.
 * Then runs the operations alerts (src/lib/ops/alerts.server.ts).
 * GET is what Vercel Cron calls; POST is for manual runs.
 */
export const Route = createFileRoute("/api/cron/reconcile-payments")({
  server: {
    handlers: {
      GET: ({ request }) => run(request),
      POST: ({ request }) => run(request),
    },
  },
});
