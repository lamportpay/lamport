import { useMemo, useCallback, useState, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";
import { ShieldAlert, Copy, Check } from "lucide-react";

import "@solana/wallet-adapter-react-ui/styles.css";

/**
 * Solana wallet context. Devnet endpoint for the demo — swap the endpoint
 * (or read it from env) when wiring real mainnet integrations later.
 */
export function SolanaWalletProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => clusterApiUrl(WalletAdapterNetwork.Devnet), []);
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export function shortAddress(a: string) {
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

export const SEED_PHRASE_WARNING = "Never share your seed phrase or private key.";

/** Compact connect button for the site header. */
export function WalletConnectButton() {
  return (
    <div className="lamport-wallet">
      <WalletMultiButton />
    </div>
  );
}

/** Connected address + seed-phrase safety warning. */
export function WalletStatusCard() {
  const { publicKey, connected, wallet } = useWallet();
  const [copied, setCopied] = useState(false);
  const address = publicKey?.toBase58() ?? "";

  const copy = useCallback(() => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [address]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Solana wallet
          </div>
          <div className="font-semibold mt-0.5">
            {connected && address ? (
              <span className="font-mono text-sm">{shortAddress(address)}</span>
            ) : (
              <span className="text-muted-foreground text-sm">Not connected</span>
            )}
          </div>
          {connected && wallet && (
            <div className="text-xs text-muted-foreground mt-1">via {wallet.adapter.name}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {connected && address && (
            <button
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-secondary transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
          <WalletConnectButton />
        </div>
      </div>

      {connected && address && (
        <div className="rounded-xl bg-secondary/60 px-4 py-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Connected address
          </div>
          <div className="font-mono text-xs break-all mt-0.5">{address}</div>
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-xl border border-[color:var(--warning)]/30 bg-[color:var(--warning)]/10 px-4 py-3">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[color:var(--warning)]" />
        <p className="text-xs leading-relaxed">
          <strong>{SEED_PHRASE_WARNING}</strong> LamportPay only ever requests a read-only wallet
          connection — this demo never moves funds.
        </p>
      </div>
    </div>
  );
}

export default SolanaWalletProvider;