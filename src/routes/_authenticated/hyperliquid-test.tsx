import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { AppLayout } from "@/components/app/AppLayout";
import { HyperliquidTestPanel } from "@/components/app/HyperliquidTestPanel";
import { useModeStatus } from "@/lib/use-mode-status";

/**
 * Trade (Hyperliquid spot) in the app dashboard. The network follows the app
 * mode: testnet in TEST MODE, mainnet in LIVE MODE (owner decision, 11 Nov
 * 2026). The path keeps its original name so existing links still work.
 */
export const Route = createFileRoute("/_authenticated/hyperliquid-test")({
  head: () => ({
    meta: [
      { title: "Trade | LamportPay" },
      {
        name: "description",
        content: "Trade BTC, ETH, SOL and more on Hyperliquid spot from your own wallet.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: TradePage,
});

function TradePage() {
  const { status } = useModeStatus();
  return (
    <AppLayout>
      {status === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : status.ok ? (
        <HyperliquidTestPanel />
      ) : (
        <p className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-muted-foreground">
          Trading is paused while the service configuration is being completed.
        </p>
      )}
    </AppLayout>
  );
}
