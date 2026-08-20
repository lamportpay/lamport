import { createFileRoute } from "@tanstack/react-router";

import { getBridgeConfig } from "@/lib/bridge.config";

/**
 * Read-only integration status. Returns booleans only — never key values,
 * prefixes, or lengths.
 */
export const Route = createFileRoute("/api/integration-status")({
  server: {
    handlers: {
      GET: async () => {
        const bridge = getBridgeConfig();
        const jupiterConfigured = Boolean(process.env["JUPITER_API_KEY"]);
        const bridgeConfigured = bridge.enabled;

        const jupiterMode = jupiterConfigured ? "sandbox" : "mock";
        const bridgeMode = bridgeConfigured ? "sandbox" : "mock";

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
                name: "Payout partner",
                role: "USDC → local currency payout",
                configured: bridgeConfigured,
                mode: bridgeMode,
                note: bridgeConfigured
                  ? "payout partner sandbox endpoints are reachable."
                  : "Payout steps are simulated. No fiat payout is possible.",
              },
            ],
            endpoints: [
              { path: "POST /api/jupiter/quote", provider: "Jupiter", mode: jupiterMode },
              { path: "POST /api/jupiter/order", provider: "Jupiter", mode: jupiterMode },
              { path: "POST /api/jupiter/execute", provider: "Jupiter", mode: jupiterMode },
              { path: "POST /api/bridge/quote", provider: "Regulated payout partner", mode: bridgeMode },
              { path: "POST /api/bridge/customer", provider: "Regulated payout partner", mode: bridgeMode },
              { path: "POST /api/bridge/external-account", provider: "Regulated payout partner", mode: bridgeMode },
              { path: "POST /api/bridge/transfer", provider: "Regulated payout partner", mode: bridgeMode },
              { path: "POST /api/public/bridge-webhook", provider: "Regulated payout partner", mode: bridgeMode },
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
