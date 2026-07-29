import { Component, lazy, Suspense, type ReactNode } from "react";
import { ClientOnly } from "@tanstack/react-router";

function ProviderPassthrough({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function WalletFallbackButton() {
  return (
    <button
      type="button"
      disabled
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground opacity-70"
    >
      Connect wallet
    </button>
  );
}

function WalletFallbackCard() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
      <div className="text-sm font-semibold">Wallet connection</div>
      <p className="text-sm text-muted-foreground">
        Wallet connection initializes only in your browser. Refresh if Phantom or Solflare does not
        appear.
      </p>
    </div>
  );
}

class WalletErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Wallet UI failed to load", error);
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

async function loadWalletModule() {
  if (typeof window === "undefined") return { SolanaWalletProvider: ProviderPassthrough };
  const polyfill = await import("@/lib/buffer-polyfill");
  polyfill.installBufferPolyfill();
  return import("./SolanaWallet");
}

const Providers = lazy(async () => {
  const m = await loadWalletModule();
  return { default: m.SolanaWalletProvider };
});
const ConnectButton = lazy(async () => {
  if (typeof window === "undefined") return { default: WalletFallbackButton };
  const m = await loadWalletModule();
  return { default: m.WalletConnectButton };
});
const StatusCard = lazy(async () => {
  if (typeof window === "undefined") return { default: WalletFallbackCard };
  const m = await loadWalletModule();
  return { default: m.WalletStatusCard };
});
const Swap = lazy(async () => {
  if (typeof window === "undefined") return { default: WalletFallbackCard };
  const polyfill = await import("@/lib/buffer-polyfill");
  polyfill.installBufferPolyfill();
  const m = await import("./SwapPanel");
  return { default: m.SwapPanel };
});

function Island({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  return (
    <ClientOnly fallback={fallback}>
      <WalletErrorBoundary fallback={fallback}>
        <Suspense fallback={fallback}>
          <Providers>{children}</Providers>
        </Suspense>
      </WalletErrorBoundary>
    </ClientOnly>
  );
}

/** Header connect button (self-contained wallet context). */
export function WalletButtonIsland() {
  return (
    <Island
      fallback={
        <WalletFallbackButton />
      }
    >
      <ConnectButton />
    </Island>
  );
}

/** Full wallet panel: connect, address, safety warning. */
export function WalletPanelIsland() {
  return (
    <Island
      fallback={
        <WalletFallbackCard />
      }
    >
      <StatusCard />
    </Island>
  );
}

/** SOL → USDC Jupiter swap demo panel. */
export function SwapPanelIsland() {
  return (
    <Island
      fallback={
        <WalletFallbackCard />
      }
    >
      <Swap />
    </Island>
  );
}