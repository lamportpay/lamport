import "@/lib/buffer-polyfill";
import { useCallback, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { ArrowDown, ExternalLink, Loader2, ShieldAlert, TriangleAlert } from "lucide-react";

import { SOL_MINT, USDC_MINT } from "@/lib/tokens";
import { WalletStatusCard } from "./SolanaWallet";

const LAMPORTS_PER_SOL = 1_000_000_000;
const MIN_SOL = 0.001;
const MAX_SOL = 0.01;

type OrderResult = {
  transaction: string | null;
  requestId: string | null;
  outAmount: string | null;
  lastValidBlockHeight: number | string | null;
};

type ExecuteResult = {
  status: string | null;
  signature: string | null;
  totalInputAmount: string | null;
  totalOutputAmount: string | null;
  inputAmountResult: string | null;
  outputAmountResult: string | null;
  error: string | null;
};

function toLamports(sol: string): string | null {
  const n = Number(sol);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * LAMPORTS_PER_SOL).toString();
}

function validateAmount(sol: string): string | null {
  const n = Number(sol);
  if (!Number.isFinite(n) || n <= 0) return "Enter a SOL amount greater than zero.";
  if (n < MIN_SOL) return "Minimum test amount is 0.001 SOL.";
  if (n > MAX_SOL) return "Maximum demo swap amount is 0.01 SOL.";
  return null;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export function SwapPanel() {
  const { publicKey, connected, signTransaction } = useWallet();
  const address = publicKey?.toBase58() ?? "";

  const [amount, setAmount] = useState("0.001");
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [signed, setSigned] = useState<string | null>(null);
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"order" | "sign" | "execute" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const amountError = validateAmount(amount);

  const reset = () => {
    setOrder(null);
    setSigned(null);
    setResult(null);
    setError(null);
  };

  const createOrder = useCallback(async () => {
    reset();
    const invalid = validateAmount(amount);
    if (invalid) return setError(invalid);
    const lamports = toLamports(amount);
    if (!lamports) return setError("Enter a SOL amount greater than zero.");
    if (!address) return setError("Connect a wallet first.");

    setBusy("order");
    try {
      const res = await fetch("/api/jupiter/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputMint: SOL_MINT,
          outputMint: USDC_MINT,
          amount: lamports,
          taker: address,
        }),
      });
      const data = (await res.json()) as OrderResult & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to create Jupiter order.");
      if (!data.transaction || !data.requestId) throw new Error("Jupiter returned no transaction.");
      setOrder(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create Jupiter order.");
    } finally {
      setBusy(null);
    }
  }, [amount, address]);

  const signOrder = useCallback(async () => {
    if (!order?.transaction) return;
    if (!signTransaction) return setError("This wallet cannot sign transactions.");
    const invalid = validateAmount(amount);
    if (invalid) return setError(invalid);
    setError(null);
    setBusy("sign");
    try {
      const tx = VersionedTransaction.deserialize(fromBase64(order.transaction));
      const signedTx = await signTransaction(tx);
      setSigned(toBase64(signedTx.serialize()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Signing was rejected.");
    } finally {
      setBusy(null);
    }
  }, [order, signTransaction, amount]);

  const executeSwap = useCallback(async () => {
    if (!signed || !order?.requestId) return;
    setError(null);
    setBusy("execute");
    try {
      const res = await fetch("/api/jupiter/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signedTransaction: signed,
          requestId: order.requestId,
          ...(order.lastValidBlockHeight != null
            ? { lastValidBlockHeight: String(order.lastValidBlockHeight) }
            : {}),
        }),
      });
      const data = (await res.json()) as ExecuteResult & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Swap execution failed.");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Swap execution failed.");
    } finally {
      setBusy(null);
    }
  }, [signed, order]);

  return (
    <div className="space-y-6">
      <WalletStatusCard />

      <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-5">
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            You pay
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-full text-3xl font-semibold bg-transparent outline-none tracking-tight"
              placeholder="0.00"
            />
            <span className="rounded-xl border border-border bg-secondary px-4 py-2 font-semibold">
              SOL
            </span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground font-mono">
            {toLamports(amount) ?? "0"} lamports
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">
              Limits: min {MIN_SOL} SOL · max {MAX_SOL} SOL
            </span>
            {amountError && (
              <span className="font-medium text-[color:var(--warning,theme(colors.amber.600))] text-right">
                {amountError}
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-full border border-border bg-background flex items-center justify-center">
            <ArrowDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            You receive
          </label>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-3xl font-semibold tracking-tight">
              {order?.outAmount ? (Number(order.outAmount) / 1_000_000).toFixed(6) : "—"}
            </div>
            <span className="rounded-xl border border-border bg-secondary px-4 py-2 font-semibold">
              USDC
            </span>
          </div>
        </div>

        <div className="grid gap-2">
          <Step
            n={1}
            label={busy === "order" ? "Creating order…" : "Create Jupiter order"}
            done={!!order}
            disabled={!connected || busy !== null || !!amountError}
            onClick={createOrder}
            busy={busy === "order"}
          />
          <Step
            n={2}
            label={busy === "sign" ? "Waiting for wallet…" : "Sign transaction"}
            done={!!signed}
            disabled={!order || busy !== null || !!amountError}
            onClick={() => setConfirmOpen(true)}
            busy={busy === "sign"}
          />
          <Step
            n={3}
            label={busy === "execute" ? "Executing…" : "Execute swap"}
            done={!!result}
            disabled={!signed || busy !== null}
            onClick={executeSwap}
            busy={busy === "execute"}
          />
        </div>

        {order?.requestId && (
          <div className="rounded-xl bg-secondary/60 px-4 py-3 text-xs font-mono break-all">
            requestId: {order.requestId}
          </div>
        )}
      </div>

      {(result || error) && (
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
          <div className="text-sm font-semibold">Result</div>
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
              {error}
            </div>
          )}
          {result && (
            <div className="space-y-2 text-sm">
              <Row k="Status" v={result.status ?? "—"} />
              <Row k="Input amount" v={result.totalInputAmount ?? result.inputAmountResult ?? "—"} />
              <Row k="Output amount" v={result.totalOutputAmount ?? result.outputAmountResult ?? "—"} />
              {result.signature && (
                <>
                  <div className="text-xs font-mono break-all rounded-xl bg-secondary/60 px-4 py-3">
                    {result.signature}
                  </div>
                  <a
                    href={`https://solscan.io/tx/${result.signature}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    View on Solscan <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </>
              )}
            </div>
          )}
          {result && !error && (
            <div className="rounded-xl border border-border/60 bg-secondary/50 px-4 py-3 space-y-1 opacity-80">
              <div className="text-sm font-semibold text-muted-foreground">
                Fiat payout disabled
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                USDC swap completed. Bridge payout is disabled for now. Partner KYC and
                local-currency payout will be added only after licensed partner approval.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2.5">
        <Warn tone="warning">
          Real Jupiter swaps may use real funds. Test only with a very small amount.
        </Warn>
        <Warn tone="muted">Bridge fiat payout is disabled for now.</Warn>
        <Warn tone="warning">
          LamportPay will never ask for your seed phrase or private key.
        </Warn>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm real swap"
            className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center gap-2">
              <TriangleAlert className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold">Confirm real swap</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This is a real Jupiter swap using real wallet funds. Continue only with a small
              test amount.
            </p>
            <div className="rounded-xl bg-secondary/60 px-4 py-3 text-sm font-medium">
              {amount} SOL → USDC
            </div>
            <p className="text-xs text-muted-foreground">
              LamportPay will never ask for your seed phrase or private key. Bridge payout, fiat
              payout and KYC remain disabled.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  void signOrder();
                }}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:opacity-90"
              >
                I understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Step({
  n,
  label,
  done,
  disabled,
  busy,
  onClick,
}: {
  n: number;
  label: string;
  done: boolean;
  disabled: boolean;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        "w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:opacity-50 " +
        (done
          ? "border border-[color:var(--success)]/40 bg-[color:var(--success)]/10 text-[color:var(--success)]"
          : "text-white bg-[image:var(--gradient-hero)] shadow-[var(--shadow-soft)] hover:opacity-95")
      }
    >
      <span className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center text-[11px]">
        {n}
      </span>
      <span className="flex-1 text-left">{label}</span>
      {busy && <Loader2 className="w-4 h-4 animate-spin" />}
    </button>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium font-mono text-xs break-all text-right">{v}</span>
    </div>
  );
}

function Warn({ tone, children }: { tone: "warning" | "muted"; children: React.ReactNode }) {
  const warning = tone === "warning";
  return (
    <div
      className={
        "flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs leading-relaxed " +
        (warning
          ? "border border-[color:var(--warning)]/30 bg-[color:var(--warning)]/10"
          : "border border-border/60 bg-secondary/50 text-muted-foreground")
      }
    >
      {warning ? (
        <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5 text-[color:var(--warning)]" />
      ) : (
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
      )}
      <span>{children}</span>
    </div>
  );
}

export default SwapPanel;