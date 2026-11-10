import "@/lib/buffer-polyfill";
import { useCallback, useEffect, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { Loader2, Send, TriangleAlert } from "lucide-react";

import { PaymentApiError, paymentApi } from "@/lib/payments/api-client";
import { walletActionErrorMessage } from "@/lib/wallet-sign-in";
import { LiveFundsWarning } from "@/components/app/ModeBadge";
import { WalletStatusCard } from "./SolanaWallet";

export type FundingPanelProps = {
  paymentId: string;
  amount: string;
  /** Stablecoin label, "USDC" or "USDT". */
  currency?: string;
  depositAddress: string;
  /** LamportPay's fee, sent in the same transaction; omitted when there is none. */
  platformFee?: string | null;
  /**
   * A transaction the wallet already sent for this payment that is not verified
   * yet (from the server, so it survives a reload): only "Check again" is offered.
   */
  pendingSignature?: string | null;
  /** Called when the payment changed on the server (funded, or pending state changed). */
  onFunded: () => void;
};

/** Server answers that end a pending transaction without funds moving: the customer may send again. */
const RELEASED_CODES = new Set(["funding_expired", "funding_rejected"]);

type BuiltTransaction = {
  transaction: string;
  amount: string;
  depositAddress: string;
  platformFee?: string;
  total?: string;
};

/** Sum of two decimal strings with at most 6 decimals (display only). */
function addAmounts(a: string, b: string): string {
  const minor = (v: string) => {
    const [whole = "0", frac = ""] = v.split(".");
    return BigInt(whole) * 1_000_000n + BigInt((frac + "000000").slice(0, 6));
  };
  const sum = minor(a) + minor(b);
  const frac = (sum % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "");
  return `${sum / 1_000_000n}${frac ? `.${frac}` : ""}`;
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/**
 * Ask the server to verify `signature`, retrying while the transaction is not
 * finalized yet (finalization takes roughly 15 seconds after it lands).
 */
async function confirmFunding(
  paymentId: string,
  signature: string,
  payer: string | undefined,
  attempts = 20,
): Promise<void> {
  // The first call records the signature on the server at once (pending), so a
  // reload or a failed confirmation can never lead to a second payment.
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 3000));
    const { status } = await paymentApi(`/api/payments/${paymentId}/funding`, {
      method: "POST",
      body: { signature, payer },
    });
    if (status !== 202) return;
  }
  throw new PaymentApiError(
    "Sent, but not confirmed yet. Use Check again in a moment; do not send it again.",
    202,
    "funding_not_confirmed",
  );
}

/**
 * Sends the exact deposit amount of the payment's stablecoin (USDC or USDT)
 * from the connected wallet to the Stables deposit address. The transaction is
 * built by the server from the stored deposit instructions, so the amount,
 * token and destination cannot drift.
 */
export function FundingPanel({
  paymentId,
  amount,
  currency = "USDC",
  depositAddress,
  platformFee = null,
  pendingSignature = null,
  onFunded,
}: FundingPanelProps) {
  const hasFee = platformFee !== null && Number(platformFee) > 0;
  const total = hasFee ? addAmounts(amount, platformFee!) : amount;
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [busy, setBusy] = useState<"build" | "send" | "verify" | null>(null);
  const [signature, setSignature] = useState<string | null>(pendingSignature);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // One send at a time, even across fast double clicks (state updates are async).
  const sending = useRef(false);

  // The server's pending transaction (after a reload, or another tab) wins.
  useEffect(() => {
    if (pendingSignature) setSignature(pendingSignature);
  }, [pendingSignature]);

  /** Handle a verification error: a released transaction re-enables sending. */
  const onVerifyError = useCallback(
    (e: unknown) => {
      if (e instanceof PaymentApiError && e.code && RELEASED_CODES.has(e.code)) {
        setSignature(null);
        onFunded(); // refresh: the server cleared the pending transaction
      }
      setError(walletActionErrorMessage(e, "Verification failed."));
    },
    [onFunded],
  );

  const checkAgain = useCallback(async () => {
    if (!signature) return;
    setError(null);
    setBusy("verify");
    try {
      await confirmFunding(paymentId, signature, publicKey?.toBase58(), 5);
      onFunded();
    } catch (e) {
      onVerifyError(e);
    } finally {
      setBusy(null);
    }
  }, [signature, paymentId, publicKey, onFunded, onVerifyError]);

  const send = useCallback(async () => {
    if (!publicKey) return setError("Connect a wallet first.");
    if (sending.current || signature) return;
    sending.current = true;
    setError(null);
    setConfirmOpen(false);
    let sent = false;
    try {
      setBusy("build");
      const { data } = await paymentApi<BuiltTransaction>(
        `/api/payments/${paymentId}/funding-transaction`,
        { method: "POST", body: { payer: publicKey.toBase58() } },
      );
      // The server builds the transaction; it must match what the page showed.
      if (
        data.depositAddress !== depositAddress ||
        data.amount !== amount ||
        (hasFee &&
          (data.platformFee === undefined || Number(data.platformFee) !== Number(platformFee)))
      ) {
        throw new Error("Deposit instructions changed. Refresh the page before sending.");
      }

      setBusy("send");
      const tx = Transaction.from(fromBase64(data.transaction));
      const sig = await sendTransaction(tx, connection);
      sent = true;
      setSignature(sig);

      setBusy("verify");
      await confirmFunding(paymentId, sig, publicKey.toBase58());
      onFunded();
    } catch (e) {
      if (sent) onVerifyError(e);
      else if (e instanceof PaymentApiError && e.code === "funding_pending") {
        // An earlier transaction may still land: show it instead of sending again.
        setError(e.message);
        onFunded();
      } else setError(walletActionErrorMessage(e, "Sending failed."));
    } finally {
      sending.current = false;
      setBusy(null);
    }
  }, [
    publicKey,
    signature,
    paymentId,
    depositAddress,
    amount,
    hasFee,
    platformFee,
    sendTransaction,
    connection,
    onFunded,
    onVerifyError,
  ]);

  return (
    <div className="space-y-4">
      <WalletStatusCard />
      <LiveFundsWarning />

      {/* While a sent transaction is pending, only "Check again" is offered (below). */}
      {signature ? null : !confirmOpen ? (
        <button
          type="button"
          disabled={!connected || busy !== null}
          onClick={() => setConfirmOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {busy === "build"
            ? "Preparing…"
            : busy === "send"
              ? "Approve in your wallet…"
              : busy === "verify"
                ? "Verifying on Solana…"
                : `Send ${total} ${currency}`}
        </button>
      ) : (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <TriangleAlert className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <span>
              This sends{" "}
              <strong>
                {amount} {currency}
              </strong>{" "}
              on Solana mainnet to the single-use Stables deposit address
              {hasFee && (
                <>
                  {" "}
                  and the{" "}
                  <strong>
                    {platformFee} {currency}
                  </strong>{" "}
                  LamportPay fee, <strong>{total}</strong> in total, in one transaction
                </>
              )}
              . On-chain transfers cannot be reversed.
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void send()}
              className="rounded-full bg-destructive text-white px-4 py-2 text-sm font-semibold hover:opacity-90"
            >
              Send now
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {signature && (
        <div
          className="rounded-2xl border border-border/60 bg-secondary/40 p-4 space-y-3"
          role="status"
        >
          <p className="text-sm">
            <strong>Payment sent.</strong> Waiting for Solana to confirm it. Do not send it again;
            use Check again if this takes more than a minute.
          </p>
          <div className="text-xs text-muted-foreground break-all">
            Signature: <span className="font-mono">{signature}</span>
          </div>
          <button
            type="button"
            onClick={() => void checkAgain()}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-50"
          >
            {busy === "verify" && <Loader2 className="w-4 h-4 animate-spin" />}
            Check again
          </button>
        </div>
      )}
      {busy === "send" && (
        <p className="text-xs text-muted-foreground" role="status">
          Your payment transaction is ready for approval in your wallet. Nothing moves until you
          approve.
        </p>
      )}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

export default FundingPanel;
