import { lazy, Suspense, type ReactNode } from "react";
import { ClientOnly } from "@tanstack/react-router";

const Providers = lazy(async () => {
  const m = await import("./SolanaWallet");
  return { default: m.SolanaWalletProvider };
});
const ConnectButton = lazy(async () => {
  const m = await import("./SolanaWallet");
  return { default: m.WalletConnectButton };
});
const StatusCard = lazy(async () => {
  const m = await import("./SolanaWallet");
  return { default: m.WalletStatusCard };
});

function Island({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  return (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}>
        <Providers>{children}</Providers>
      </Suspense>
    </ClientOnly>
  );
}

/** Header connect button (self-contained wallet context). */
export function WalletButtonIsland() {
  return (
    <Island
      fallback={
        <div className="h-9 w-[132px] rounded-full bg-secondary/60 animate-pulse" aria-hidden />
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
        <div className="h-40 rounded-2xl border border-border/60 bg-card animate-pulse" aria-hidden />
      }
    >
      <StatusCard />
    </Island>
  );
}