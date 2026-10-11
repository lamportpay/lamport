/**
 * The dApp header's wallet control: the connect button / connected-wallet menu,
 * plus bridges that share the connection with the page (lib/wallet-state) and
 * run "Sign in with wallet" when a page asks for it.
 * Loaded only in the browser, inside the wallet providers.
 */
import "@/lib/buffer-polyfill";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useWallet } from "@solana/wallet-adapter-react";

import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/lib/use-account";
import {
  requestWalletConnect,
  requestWalletSignIn,
  setAppWallet,
  setWalletSignIn,
  useAppWallet,
} from "@/lib/wallet-state";
import { WALLET_CONNECT_TIMEOUT_MS, walletSignInErrorMessage } from "@/lib/wallet-sign-in";
import { buildWalletSignInMessage } from "@/lib/identity/wallet-message";
import { WalletConnectButton } from "./SolanaWallet";

/**
 * Sign in with the connected wallet: the wallet signs one plain-text message,
 * LamportPay's server verifies it and answers with a one-time token that is
 * exchanged for the session. Any other session (for example an email account)
 * is replaced, so the wallet is the customer's only sign-in.
 */
async function signInWithWallet(
  address: string,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
) {
  const message = buildWalletSignInMessage({
    host: window.location.host,
    origin: window.location.origin,
    address,
    issuedAt: new Date().toISOString(),
  });
  const signed = await signMessage(new TextEncoder().encode(message));
  const signature = btoa(String.fromCharCode(...signed));
  const res = await fetch("/api/wallet/sign-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, signature }),
  });
  const body = (await res.json().catch(() => ({}))) as { tokenHash?: string; error?: string };
  if (!res.ok || !body.tokenHash) throw new Error(body.error || "Wallet sign-in did not complete.");
  const current = await supabase.auth.getSession();
  if (current.data.session) await supabase.auth.signOut({ scope: "local" });
  const { error } = await supabase.auth.verifyOtp({ token_hash: body.tokenHash, type: "magiclink" });
  if (error) throw new Error("Wallet sign-in did not complete. Please try again.");
}

function WalletStateBridge() {
  const { publicKey, wallet, connected, connecting } = useWallet();
  const address = connected && publicKey ? publicKey.toBase58() : null;
  const name = wallet?.adapter.name ?? null;
  useEffect(() => {
    setAppWallet({ publicKey: address, walletName: name, connecting, ready: true });
  }, [address, name, connecting]);
  useEffect(() => () => setAppWallet({ publicKey: null, connecting: false, ready: false }), []);
  return null;
}

/**
 * Sign in with Solana: connect if needed, then ask the wallet to sign one
 * plain-text message. Supabase verifies it and starts the session. Only a
 * signature over a message is requested: never a transaction, key or seed.
 */
function WalletSignInBridge() {
  const { publicKey, connected, signMessage } = useWallet();
  const { signInRequest, signInOpensPicker } = useAppWallet();
  const handled = useRef(0);
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);

  // A new request: remember it, and open the wallet picker if not connected
  // (unless the user is already picking a wallet).
  useEffect(() => {
    if (signInRequest === 0 || signInRequest === handled.current) return;
    handled.current = signInRequest;
    setPending(true);
    if (!connected && signInOpensPicker) requestWalletConnect();
  }, [signInRequest, signInOpensPicker, connected]);

  // Give up if the wallet never connects (picker closed, wallet not installed).
  useEffect(() => {
    if (!pending || connected) return;
    const timer = setTimeout(() => {
      setPending(false);
      setWalletSignIn({ phase: "error", error: walletSignInErrorMessage("timeout") });
    }, WALLET_CONNECT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [pending, connected]);

  // Connected: sign the message once.
  useEffect(() => {
    if (!pending || !connected || !publicKey || inFlight.current) return;
    setPending(false);
    if (!signMessage) {
      setWalletSignIn({ phase: "error", error: walletSignInErrorMessage("does not support") });
      return;
    }
    inFlight.current = true;
    setWalletSignIn({ phase: "signing", error: null });
    signInWithWallet(publicKey.toBase58(), signMessage)
      .then(() => setWalletSignIn({ phase: "idle", error: null }))
      .catch((error: unknown) => {
        setWalletSignIn({ phase: "error", error: walletSignInErrorMessage(error) });
      })
      .finally(() => {
        inFlight.current = false;
      });
  }, [pending, connected, publicKey, signMessage]);

  return null;
}

/**
 * Wallet-first: when a signed-out user picks a wallet in the app, connecting
 * and verifying are one step. After the wallet connects, it asks for one
 * message signature (never a transaction); cancelling leaves the wallet
 * connected and the user signed out.
 */
export function AppWalletControl() {
  const { openRequest } = useAppWallet();
  const account = useAccount();
  // Signed out, or signed in without a wallet (e.g. an email/staff session):
  // connecting the wallet also signs in with it.
  const needsWalletSession =
    account.status === "signed_out" ||
    (account.status === "signed_in" && account.wallets.length === 0);
  const onPick = useCallback(() => {
    if (needsWalletSession) requestWalletSignIn({ openPicker: false });
  }, [needsWalletSession]);
  return (
    <>
      <WalletStateBridge />
      <WalletSignInBridge />
      <WalletConnectButton
        openRequest={openRequest}
        onPick={onPick}
        pickerFooter={
          needsWalletSession ? (
            <div className="border-t border-border/60 px-3 py-2 text-[11px] text-muted-foreground">
              Next, sign one message to confirm the wallet is yours. No funds move.
            </div>
          ) : null
        }
      />
    </>
  );
}

export default AppWalletControl;
