import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  AdminPage,
  EmptyState,
  ErrorState,
  LoadingState,
  Panel,
  StatCard,
} from "@/components/admin/AdminShell";
import { FeeAndWalletSettings } from "@/components/site/BusinessSettingsAdmin";
import { explorerTxUrl } from "@/lib/app-mode";
import { getRevenuePayments, getRevenueReconciliation } from "@/lib/admin-ops.functions";
import { formatMinor } from "@/lib/money";
import { getTokenInfo } from "@/lib/tokens";

export const Route = createFileRoute("/_authenticated/admin/fees-revenue")({
  head: () => ({ meta: [{ title: "Fees & Revenue | LamportPay Admin" }] }),
  component: FeesRevenuePage,
});

const STATUS_TEXT = {
  calculated: "Calculated (quote only)",
  pending: "Pending",
  collected: "Collected",
  short: "Short",
  missing: "Missing",
  failed: "Failed (no fee)",
  not_collected: "Not collected",
} as const;

const STATUS_TONE = {
  calculated: "text-muted-foreground",
  pending: "text-muted-foreground",
  collected: "text-[color:var(--success)]",
  short: "text-destructive",
  missing: "text-destructive",
  failed: "text-muted-foreground",
  not_collected: "text-amber-600",
} as const;

function short(address: string | null) {
  return address ? `${address.slice(0, 4)}…${address.slice(-4)}` : "—";
}

/** "1.25 SOL"; a token without known decimals shows raw units and its mint. */
function swapLabel(inMinor: string, symbol: string | undefined, mint: string) {
  try {
    if (symbol) return `${formatMinor(BigInt(inMinor), symbol.toLowerCase())} ${symbol}`;
  } catch {
    // Unknown decimals: fall through to raw units.
  }
  return `${inMinor} units of ${short(mint)}`;
}

function NetworkTag({ network }: { network: "solana" | "solana-devnet" | null }) {
  if (network === "solana") return <span>Solana mainnet</span>;
  if (network === "solana-devnet") {
    return <span className="text-amber-600">Solana devnet (test, not revenue)</span>;
  }
  return <span className="text-muted-foreground">—</span>;
}

function FeesRevenuePage() {
  const fetchRevenue = useServerFn(getRevenuePayments);
  const query = useQuery({ queryKey: ["admin-revenue-payments"], queryFn: () => fetchRevenue() });
  const rows = query.data ?? [];
  const sum = (
    filter: (r: (typeof rows)[number]) => boolean,
    pick: (r: (typeof rows)[number]) => string | null,
  ) => rows.filter(filter).reduce((total, r) => total + BigInt(pick(r) ?? "0"), 0n);
  const settled = (r: (typeof rows)[number]) =>
    r.revenueStatus === "collected" || r.revenueStatus === "short" || r.revenueStatus === "missing";
  const revenue = sum(
    (r) => r.countsAsRevenue && settled(r),
    (r) => r.receivedMinor,
  );
  const testFees = sum(
    (r) => r.network === "solana-devnet" && settled(r),
    (r) => r.receivedMinor,
  );
  const pending = sum(
    (r) => r.revenueStatus === "pending",
    (r) => r.feeMinor,
  );
  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.revenueStatus] = (acc[r.revenueStatus] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <AdminPage
      title="Fees & Revenue"
      crumbs={[{ label: "Fees & Revenue" }]}
      description="The one LamportPay fee, the revenue wallet, and the fee each payment carried. Collected amounts come only from transactions the server read on-chain; devnet test fees are shown apart and never count as revenue."
    >
      <FeeAndWalletSettings />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Revenue collected (mainnet)"
          value={`${formatMinor(revenue, "usdc")} USDC`}
          hint="Verified on Solana mainnet; latest 200 payments with a fee"
        />
        <StatCard
          label="Test fees collected (devnet)"
          value={`${formatMinor(testFees, "usdc")} USDC`}
          hint="Devnet test USDC: proves the fee path, not revenue"
        />
        <StatCard
          label="Pending fees"
          value={`${formatMinor(pending, "usdc")} USDC`}
          hint={`${counts["pending"] ?? 0} payments awaiting the customer's transaction`}
        />
        <StatCard
          label="Payments with a fee"
          value={rows.length.toLocaleString()}
          hint={
            <span>
              {counts["calculated"] ?? 0} quote only · {counts["failed"] ?? 0} failed ·{" "}
              <Link to="/admin/reports" className="text-primary hover:underline">
                reports
              </Link>
            </span>
          }
        />
      </div>

      <ReconciliationPanel />

      <Panel title="Revenue by payment">
        {query.isLoading && <LoadingState />}
        {query.isError && <ErrorState error={query.error} />}
        {query.data && rows.length === 0 && (
          <EmptyState>
            No payment has carried a LamportPay fee yet. The fee starts once it is set above with a
            revenue wallet.
          </EmptyState>
        )}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground text-left">
                <tr>
                  <th className="py-2 pr-3 font-medium">Payment</th>
                  <th className="py-2 pr-3 font-medium">Swapped in</th>
                  <th className="py-2 pr-3 font-medium">To payout partner</th>
                  <th className="py-2 pr-3 font-medium">Fee</th>
                  <th className="py-2 pr-3 font-medium">Received</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Network</th>
                  <th className="py-2 pr-3 font-medium">Customer wallet</th>
                  <th className="py-2 pr-3 font-medium">Revenue wallet</th>
                  <th className="py-2 font-medium">Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {rows.map((r) => {
                  const token = r.swap ? getTokenInfo(r.swap.inputMint) : undefined;
                  return (
                    <tr key={r.id}>
                      <td className="py-2 pr-3">
                        <Link
                          to="/admin/payments/$id"
                          params={{ id: r.id }}
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          {r.id.slice(0, 8)}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {new Date(r.verifiedAt ?? r.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-2 pr-3 tabular-nums">
                        {r.swap ? swapLabel(r.swap.inMinor, token?.symbol, r.swap.inputMint) : "—"}
                      </td>
                      <td className="py-2 pr-3 tabular-nums">
                        {formatMinor(BigInt(r.amountMinor), r.currency)} {r.currency.toUpperCase()}
                      </td>
                      <td className="py-2 pr-3 tabular-nums">
                        {formatMinor(BigInt(r.feeMinor), r.currency)}
                        {r.feeBps !== null && (
                          <span className="text-xs text-muted-foreground">
                            {" "}
                            ({r.feeBps / 100}%)
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3 tabular-nums">
                        {r.receivedMinor === null
                          ? "—"
                          : formatMinor(BigInt(r.receivedMinor), r.currency)}
                      </td>
                      <td className={`py-2 pr-3 font-medium ${STATUS_TONE[r.revenueStatus]}`}>
                        {STATUS_TEXT[r.revenueStatus]}
                      </td>
                      <td className="py-2 pr-3 text-xs">
                        <NetworkTag network={r.network} />
                      </td>
                      <td
                        className="py-2 pr-3 font-mono text-xs"
                        title={r.payerWallet ?? undefined}
                      >
                        {short(r.payerWallet)}
                      </td>
                      <td
                        className="py-2 pr-3 font-mono text-xs"
                        title={r.revenueWallet ?? undefined}
                      >
                        {short(r.revenueWallet)}
                      </td>
                      <td className="py-2">
                        {r.signature ? (
                          <a
                            href={explorerTxUrl(
                              r.signature,
                              r.network === "solana-devnet" ? "devnet" : "mainnet-beta",
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-xs text-primary hover:underline"
                          >
                            {r.signature.slice(0, 10)}…
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </AdminPage>
  );
}

const ISSUE_TEXT = {
  fee_short: "Fee received is short",
  fee_missing: "Fee not received",
  ledger_expected_mismatch: "Ledger 'expected' differs from the payment",
  ledger_received_mismatch: "Ledger 'received' differs from the payment",
} as const;

/** Signed minor amount → "−1.50" style text (formatMinor handles non-negative only). */
function signed(minor: string, currency: string) {
  const v = BigInt(minor);
  return `${v < 0n ? "−" : ""}${formatMinor(v < 0n ? -v : v, currency)}`;
}

/**
 * C10: expected vs received (exact, per payment), fee ledger vs payment
 * records, and the revenue wallet's on-chain balance (informative), on the
 * server's own network (TEST: devnet, LIVE: mainnet).
 */
function ReconciliationPanel() {
  const fetchRecon = useServerFn(getRevenueReconciliation);
  const query = useQuery({
    queryKey: ["admin-revenue-reconciliation"],
    queryFn: () => fetchRecon(),
  });
  const r = query.data;
  const devnet = r?.network === "solana-devnet";
  return (
    <Panel
      title={devnet ? "Reconciliation — devnet test fees" : "Reconciliation"}
      description={
        devnet
          ? "TEST MODE: fees paid in devnet test USDC vs what the revenue wallet holds on Solana devnet. Not revenue."
          : "Fees expected vs fees received for every funded payment, the append-only fee ledger vs the payment records, and the revenue wallet's live balance on Solana."
      }
    >
      {query.isLoading && <LoadingState label="Reconciling…" />}
      {query.isError && <ErrorState error={query.error} />}
      {r && (
        <div className="space-y-4 text-sm">
          {r.revenueWalletIsCustomerWallet && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
              The revenue wallet is also linked to a customer account. A fee paid from it to itself
              moves nothing. Use a separate wallet for customer payments.
            </p>
          )}
          <p
            className={
              r.balanced
                ? "text-[color:var(--success)] font-medium"
                : "text-destructive font-medium"
            }
          >
            {r.balanced
              ? "Balanced: every funded payment's fee arrived and the ledger agrees."
              : `${r.issues.length} issue${r.issues.length === 1 ? "" : "s"} to review.`}
            {r.partial && " (Partial: only the most recent payments were checked.)"}
          </p>
          {r.coins.length === 0 ? (
            <EmptyState>
              No payment with a fee is awaiting or has settled on this network.
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground text-left">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Coin</th>
                    <th className="py-2 pr-3 font-medium">Settled</th>
                    <th className="py-2 pr-3 font-medium">Expected</th>
                    <th className="py-2 pr-3 font-medium">Received</th>
                    <th className="py-2 pr-3 font-medium">Ledger (exp. / rec.)</th>
                    <th className="py-2 pr-3 font-medium">Wallet balance</th>
                    <th className="py-2 font-medium">Balance − received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {r.coins.map((c) => (
                    <tr key={c.currency}>
                      <td className="py-2 pr-3 font-medium">{c.currency.toUpperCase()}</td>
                      <td className="py-2 pr-3 tabular-nums">
                        {c.fundedPayments}
                        {c.pendingPayments > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {" "}
                            (+{c.pendingPayments} awaiting)
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3 tabular-nums">
                        {formatMinor(BigInt(c.expectedMinor), c.currency)}
                      </td>
                      <td className="py-2 pr-3 tabular-nums">
                        {formatMinor(BigInt(c.receivedMinor), c.currency)}
                      </td>
                      <td className="py-2 pr-3 tabular-nums">
                        {formatMinor(BigInt(c.ledgerExpectedMinor), c.currency)} /{" "}
                        {formatMinor(BigInt(c.ledgerReceivedMinor), c.currency)}
                      </td>
                      <td className="py-2 pr-3 tabular-nums">
                        {c.onChainBalanceMinor === null
                          ? "—"
                          : formatMinor(BigInt(c.onChainBalanceMinor), c.currency)}
                      </td>
                      <td className="py-2 tabular-nums">
                        {c.onChainDifferenceMinor === null
                          ? "—"
                          : signed(c.onChainDifferenceMinor, c.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {r.onChain.status === "ok"
              ? `Wallet balance read from Solana ${devnet ? "devnet" : "mainnet"} at ${new Date(r.onChain.readAt).toLocaleString()}. A difference is expected when the owner moves funds out (negative) or the wallet receives other deposits (positive); it is shown for review, not as an error.`
              : r.onChain.status === "not_configured"
                ? "No revenue wallet is set, so the on-chain balance is not checked."
                : `On-chain balance unavailable: ${r.onChain.reason}`}
          </p>
          {r.issues.length > 0 && (
            <ul className="divide-y divide-border/50 rounded-xl border border-border/60">
              {r.issues.map((i) => (
                <li
                  key={`${i.paymentId}-${i.kind}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                >
                  <span>
                    <Link
                      to="/admin/payments/$id"
                      params={{ id: i.paymentId }}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {i.paymentId.slice(0, 8)}
                    </Link>{" "}
                    {ISSUE_TEXT[i.kind]}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    expected {i.expectedMinor} · found {i.actualMinor} (minor units)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Panel>
  );
}
