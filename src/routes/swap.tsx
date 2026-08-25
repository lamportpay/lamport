import { createFileRoute } from "@tanstack/react-router";

import { SiteLayout } from "@/components/site/Layout";
import { SwapPanelIsland } from "@/components/site/wallet/WalletIsland";
import { SwapRoutePreviewCard } from "@/components/site/SwapRoutePreview";
import { IntegrationStatusPanel } from "@/components/site/IntegrationStatusPanel";
import { SolanaRpcVerifier } from "@/components/site/SolanaRpcVerifier";

export const Route = createFileRoute("/swap")({
  head: () => ({
    meta: [
      { title: "SOL to USDC swap demo — LamportPay" },
      {
        name: "description",
        content:
          "Connect Phantom or Solflare and run a SOL to USDC swap routed through Jupiter. Test with a very small amount.",
      },
      { property: "og:title", content: "SOL to USDC swap demo — LamportPay" },
      {
        property: "og:description",
        content: "Jupiter-routed SOL to USDC swap demo with wallet signing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SwapPage,
});

function SwapPage() {
  return (
    <SiteLayout>
      <section className="max-w-3xl mx-auto px-5 py-16 md:py-24">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">
          Jupiter swap
        </div>
        <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight">
          Swap SOL to USDC.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Connect Phantom or Solflare, create a Jupiter order, sign it in your wallet, and execute
          the swap. Fiat payout stays disabled.
        </p>

        <div className="mt-10">
          <SwapPanelIsland />
        </div>

        <div className="mt-10 space-y-6">
          <SwapRoutePreviewCard />
          <SolanaRpcVerifier />
          <IntegrationStatusPanel />
        </div>
      </section>
    </SiteLayout>
  );
}
