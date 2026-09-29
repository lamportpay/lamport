import { createFileRoute } from "@tanstack/react-router";

import { getPayoutConfig } from "@/lib/payout.config";

/**
 * Read-only integration status. Returns booleans only — never key values,
 * prefixes, or lengths.
 */
export const Route = createFileRoute("/api/integration-status")({
  server: {
    handlers: {
      GET: async () => {
        const payout = getPayoutConfig();
        const jupiterConfigured = Boolean(process.env["JUPITER_API_KEY"]);
        const payoutConfigured = payout.enabled;

        const jupiterMode = jupiterConfigured ? "sandbox" : "mock";
        const payoutMode = payoutConfigured ? "sandbox" : "mock";

        return Response.json(
          {
            providers: [
              {
                name: "Jupiter",
                role: "SOL → USDC swap routing",
                configured: jupiterConfigured,
                mode: jupiterMode,
                note: jupiterConfigured
                  ? "Route previews and orders use live Jupiter data."
                  : "Route previews fall back to local mock routing.",
              },
              {
                name: "Stables",
                role: "USDC → local currency payout",
                configured: payoutConfigured,
                mode: payoutMode,
                note: payoutConfigured
                  ? "Stables sandbox endpoints are reachable."
                  : "Payout steps are simulated. No fiat payout is possible.",
              },
            ],
            endpoints: [
              { path: "POST /api/jupiter/quote", provider: "Jupiter", mode: jupiterMode },
              { path: "POST /api/jupiter/order", provider: "Jupiter", mode: jupiterMode },
              { path: "POST /api/jupiter/execute", provider: "Jupiter", mode: jupiterMode },
              { path: "POST /api/payout/quote", provider: "Stables", mode: payoutMode },
              { path: "POST /api/payout/customer", provider: "Stables", mode: payoutMode },
              { path: "POST /api/payout/external-account", provider: "Stables", mode: payoutMode },
              { path: "POST /api/payout/transfer", provider: "Stables", mode: payoutMode },
              { path: "POST /api/public/payout-webhook", provider: "Stables", mode: payoutMode },
            ],
            guards: {
              fiatPayoutEnabled: false,
              kycEnabled: false,
              swapLimits: "0.001 – 0.01 SOL",
              outputDestination: "connected wallet only",
            },
          },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
