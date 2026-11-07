import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { AppLayout } from "@/components/app/AppLayout";
import { HyperliquidTestPanel } from "@/components/app/HyperliquidTestPanel";
import { useModeStatus } from "@/lib/use-mode-status";

export const Route = createFileRoute("/_authenticated/hyperliquid-test")({
  head: () => ({
    meta: [
      { title: "Hyperliquid testnet | LamportPay" },
      { name: "description", content: "Test LamportPay's Hyperliquid testnet integration." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: HyperliquidTestPage,
});

function HyperliquidTestPage() {
  const { status } = useModeStatus();
  return (
    <AppLayout>
      {status === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : status.mode === "test" ? (
        <HyperliquidTestPanel />
      ) : (
        <p className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-muted-foreground">
          Hyperliquid testing is available in TEST MODE only.
        </p>
      )}
    </AppLayout>
  );
}
