/**
 * Hyperliquid TESTNET test panel (owner request 2026-11-07): connect an EVM
 * wallet, run every Hyperliquid check, see balances / orders / trades /
 * transfers, and place or cancel spot limit orders signed in this browser.
 * Testnet test tokens only; no real money. Every action is tracked.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TIFS, type Tif } from "@/lib/hyperliquid/actions";
import {
  cancelOrder,
  enableTrading,
  placeOrder,
  type RelayResult,
  type TradingSession,
} from "@/lib/hyperliquid/client";
import {
  connectEvmWallet,
  currentEvmAccount,
  evmProvider,
  onEvmAccountChange,
} from "@/lib/hyperliquid/evm-wallet";
import { spotOrderProblem, toWireDecimal } from "@/lib/hyperliquid/signing";
import type { AccountView, CheckResult, Market } from "@/lib/hyperliquid/account.server";
import type { TestEvent } from "@/lib/hyperliquid/tracking.server";
import { PaymentApiError, paymentApi } from "@/lib/payments/api-client";
import { cn } from "@/lib/utils";

const EXPLORER = "https://app.hyperliquid-testnet.xyz/explorer";
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const when = (ms: number | string) =>
  new Date(ms).toLocaleString(undefined, { dateStyle: "short", timeStyle: "medium" });
const errorText = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong. Please try again.";

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-[var(--shadow-soft)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-1 pb-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border/50">
              {r.map((c, j) => (
                <td key={j} className="px-1 py-2 align-top">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pass({ ok }: { ok: boolean | null }) {
  if (ok === null) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  return ok ? (
    <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-label="Passed" />
  ) : (
    <XCircle className="h-4 w-4 text-destructive" aria-label="Failed" />
  );
}

/** A starting price from the mid: 5 significant figures within the market's decimals. */
function priceFromMid(mid: string, szDecimals: number): string {
  const n = Number(mid);
  if (!Number.isFinite(n) || n <= 0) return "";
  const fixed = Number(n.toPrecision(5)).toFixed(Math.max(0, 8 - szDecimals));
  return toWireDecimal(fixed) ?? "";
}

function OutcomeNote({ result, error }: { result: RelayResult | null; error: string | null }) {
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!result) return null;
  return (
    <p className={cn("text-sm", result.ok ? "text-emerald-600" : "text-destructive")}>
      {result.ok ? "Done: " : "Refused: "}
      {result.outcome.join("; ")}
    </p>
  );
}

export function HyperliquidTestPanel() {
  const queryClient = useQueryClient();
  const [account, setAccount] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [session, setSession] = useState<TradingSession | null>(null);
  const [enabling, setEnabling] = useState(false);
  const [enableError, setEnableError] = useState<string | null>(null);
  const hasWallet = typeof window !== "undefined" && evmProvider() !== null;

  useEffect(() => {
    void currentEvmAccount().then((a) => a && setAccount(a));
    return onEvmAccountChange((a) => {
      setAccount(a);
      setSession(null);
    });
  }, []);

  const markets = useQuery({
    queryKey: ["hl-markets"],
    queryFn: async () =>
      (await paymentApi<{ markets: Market[] }>("/api/hyperliquid/markets")).data.markets,
    staleTime: 30_000,
  });

  const view = useQuery({
    queryKey: ["hl-account", account],
    enabled: !!account,
    queryFn: async () =>
      (
        await paymentApi<AccountView>("/api/hyperliquid/account", {
          method: "POST",
          body: { account },
        })
      ).data,
    refetchInterval: 15_000,
  });

  const history = useQuery({
    queryKey: ["hl-history"],
    queryFn: async () =>
      (await paymentApi<{ events: TestEvent[] }>("/api/hyperliquid/history")).data.events,
  });

  const refreshAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["hl-account"] });
    void queryClient.invalidateQueries({ queryKey: ["hl-history"] });
  };

  const [checks, setChecks] = useState<CheckResult[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const runChecks = async () => {
    setChecking(true);
    setCheckError(null);
    try {
      const { data } = await paymentApi<{ ok: boolean; results: CheckResult[] }>(
        "/api/hyperliquid/checks",
        { method: "POST", body: { account } },
      );
      setChecks(data.results);
    } catch (e) {
      setCheckError(errorText(e));
    } finally {
      setChecking(false);
      void queryClient.invalidateQueries({ queryKey: ["hl-history"] });
    }
  };

  const connect = async () => {
    setConnectError(null);
    try {
      setAccount(await connectEvmWallet());
    } catch (e) {
      setConnectError(errorText(e));
    }
  };

  const enable = async () => {
    if (!account) return;
    setEnabling(true);
    setEnableError(null);
    try {
      setSession(await enableTrading(account));
    } catch (e) {
      setEnableError(errorText(e));
    } finally {
      setEnabling(false);
      void queryClient.invalidateQueries({ queryKey: ["hl-history"] });
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 sm:px-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">Hyperliquid testnet</h1>
          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
            TEST
          </span>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Testnet only: test tokens, no real money. Your wallet approves a trading key that lives in
          this tab only; LamportPay never holds a key and cannot move funds. Every check and order
          is recorded in your test history below.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Wallet">
          {account ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <a
                  className="font-mono underline-offset-2 hover:underline"
                  href={`${EXPLORER}/address/${account}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {short(account)}
                </a>
              </div>
              {session ? (
                <p className="flex items-center gap-2 text-emerald-600">
                  <KeyRound className="h-4 w-4" /> Test trading on (key {short(session.agent)}, this
                  tab only)
                </p>
              ) : (
                <div className="space-y-2">
                  <Button onClick={enable} disabled={enabling}>
                    {enabling ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="h-4 w-4" />
                    )}
                    Enable test trading
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    One signature in your wallet. No funds move. Needed again after a reload.
                  </p>
                  {enableError && <p className="text-sm text-destructive">{enableError}</p>}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Button onClick={connect} disabled={!hasWallet}>
                <Wallet className="h-4 w-4" /> Connect EVM wallet
              </Button>
              {!hasWallet && (
                <Empty>No EVM wallet found in this browser. Install MetaMask or Rabby.</Empty>
              )}
              {connectError && <p className="text-sm text-destructive">{connectError}</p>}
            </div>
          )}
        </Card>

        <Card
          title="Checks"
          action={
            <Button size="sm" variant="outline" onClick={runChecks} disabled={checking}>
              {checking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Run all checks
            </Button>
          }
        >
          {checkError && <p className="text-sm text-destructive">{checkError}</p>}
          {checks ? (
            <ul className="space-y-2 text-sm">
              {checks.map((c) => (
                <li key={c.name} className="flex items-start gap-2">
                  <Pass ok={c.ok} />
                  <div className="min-w-0">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.detail} · {c.ms} ms
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>
              Runs every Hyperliquid read{account ? " for your account" : ""} and the safety rules.
            </Empty>
          )}
        </Card>
      </div>

      {account && (
        <>
          <Card
            title="Balances"
            action={
              <Button size="sm" variant="ghost" onClick={refreshAll} aria-label="Refresh">
                <RefreshCw className={cn("h-4 w-4", view.isFetching && "animate-spin")} />
              </Button>
            }
          >
            {view.isError ? (
              <p className="text-sm text-destructive">{errorText(view.error)}</p>
            ) : !view.data ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : view.data.balances.length === 0 ? (
              <Empty>No spot balances on the testnet for this address.</Empty>
            ) : (
              <Table
                head={["Token", "Total", "On hold", "≈ USDC (testnet mid)"]}
                rows={view.data.balances.map((b) => [b.coin, b.total, b.hold, b.usdcValue ?? "—"])}
              />
            )}
          </Card>

          <OrderForm
            markets={markets.data ?? []}
            loading={markets.isLoading}
            session={session}
            onDone={refreshAll}
          />

          <OpenOrders view={view.data} session={session} onDone={refreshAll} />

          <Card title="Trades (fills)">
            {!view.data ? null : view.data.fills.length === 0 ? (
              <Empty>No trades yet.</Empty>
            ) : (
              <Table
                head={["Time", "Market", "Side", "Price", "Size", "Fee", "Tx"]}
                rows={view.data.fills.map((f) => [
                  when(f.time),
                  f.market,
                  f.side,
                  f.px,
                  f.sz,
                  `${f.fee} ${f.feeToken ?? ""}`,
                  <a
                    key="tx"
                    className="font-mono text-xs underline-offset-2 hover:underline"
                    href={`${EXPLORER}/tx/${f.hash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {short(f.hash)}
                  </a>,
                ])}
              />
            )}
          </Card>

          <Card title="Deposits & transfers (30 days)">
            {!view.data ? null : view.data.ledger.length === 0 ? (
              <Empty>No deposits or transfers in the last 30 days.</Empty>
            ) : (
              <Table
                head={["Time", "Type", "Details"]}
                rows={view.data.ledger.map((l) => [
                  when(l.time),
                  l.type,
                  <span key="d" className="text-xs text-muted-foreground">
                    {Object.entries(l.details)
                      .map(
                        ([k, v]) => `${k}: ${k === "destination" || k === "user" ? short(v) : v}`,
                      )
                      .join(" · ")}
                  </span>,
                ])}
              />
            )}
          </Card>
        </>
      )}

      <Card title="Test history">
        {history.isError ? (
          <p className="text-sm text-destructive">{errorText(history.error)}</p>
        ) : !history.data ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : history.data.length === 0 ? (
          <Empty>Nothing yet. Run the checks or place a test order.</Empty>
        ) : (
          <Table
            head={["Time", "Action", "Result", "Details"]}
            rows={history.data.map((e) => [
              when(e.createdAt),
              e.kind.replace("_", " "),
              <Pass key="ok" ok={e.ok} />,
              <span key="d" className="text-xs text-muted-foreground">
                {e.error ?? describe(e)}
              </span>,
            ])}
          />
        )}
      </Card>
    </div>
  );
}

function describe(e: TestEvent): string {
  const req = e.request as Record<string, unknown> | null;
  if (e.kind === "order") {
    const o = (req?.orders as Record<string, unknown>[] | undefined)?.[0];
    return o
      ? `${o.b ? "buy" : "sell"} ${String(o.s)} @ ${String(o.p)} (asset ${String(o.a)})`
      : "";
  }
  if (e.kind === "cancel") {
    const c = (req?.cancels as Record<string, unknown>[] | undefined)?.[0];
    return c ? `order #${String(c.o)}` : "";
  }
  if (e.kind === "approve_agent") return e.agent ? `key ${short(e.agent)}` : "";
  const results = e.response as { ok?: boolean }[] | null;
  return Array.isArray(results)
    ? `${results.filter((r) => r.ok).length}/${results.length} checks passed`
    : "";
}

function OrderForm({
  markets,
  loading,
  session,
  onDone,
}: {
  markets: Market[];
  loading: boolean;
  session: TradingSession | null;
  onDone: () => void;
}) {
  const [coin, setCoin] = useState("PURR/USDC");
  const [isBuy, setIsBuy] = useState(true);
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [tif, setTif] = useState<Tif>("Gtc");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RelayResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const market = useMemo(() => markets.find((m) => m.coin === coin) ?? null, [markets, coin]);

  useEffect(() => {
    if (market?.mid) setPrice(priceFromMid(market.mid, market.szDecimals));
  }, [market?.coin]); // eslint-disable-line react-hooks/exhaustive-deps

  const wirePrice = toWireDecimal(price) ?? "";
  const wireSize = toWireDecimal(size) ?? "";
  const problem = market
    ? spotOrderProblem(wirePrice, wireSize, market.szDecimals)
    : "Pick a market.";
  const notional = Number(wirePrice) * Number(wireSize);

  const submit = async () => {
    if (!session || !market || problem) return;
    setBusy(true);
    setResult(null);
    setError(null);
    try {
      setResult(
        await placeOrder(session, {
          asset: market.asset,
          isBuy,
          price: wirePrice,
          size: wireSize,
          tif,
        }),
      );
    } catch (e) {
      setError(e instanceof PaymentApiError || e instanceof Error ? e.message : errorText(e));
    } finally {
      setBusy(false);
      onDone();
    }
  };

  return (
    <Card title="Place a test order (spot limit)">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="space-y-1 text-xs text-muted-foreground lg:col-span-2">
          Market
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            value={coin}
            onChange={(e) => setCoin(e.target.value)}
            disabled={loading}
          >
            {markets.map((m) => (
              <option key={m.coin} value={m.coin}>
                {m.name} · {m.mid}
              </option>
            ))}
          </select>
        </label>
        <div className="space-y-1 text-xs text-muted-foreground">
          Side
          <div className="grid h-10 grid-cols-2 overflow-hidden rounded-md border border-input text-sm">
            {[true, false].map((b) => (
              <button
                key={String(b)}
                type="button"
                onClick={() => setIsBuy(b)}
                className={cn(
                  "font-medium",
                  isBuy === b
                    ? b
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                    : "text-muted-foreground",
                )}
              >
                {b ? "Buy" : "Sell"}
              </button>
            ))}
          </div>
        </div>
        <label className="space-y-1 text-xs text-muted-foreground">
          Price (USDC)
          <Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          Size ({market?.base ?? "token"})
          <Input inputMode="decimal" value={size} onChange={(e) => setSize(e.target.value)} />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Time in force
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
            value={tif}
            onChange={(e) => setTif(e.target.value as Tif)}
          >
            {TIFS.map((t) => (
              <option key={t} value={t}>
                {t === "Gtc"
                  ? "Gtc (rest on book)"
                  : t === "Ioc"
                    ? "Ioc (fill now or cancel)"
                    : "Alo (maker only)"}
              </option>
            ))}
          </select>
        </label>
        <span className="text-xs text-muted-foreground">
          Order value: {Number.isFinite(notional) && notional > 0 ? notional.toFixed(2) : "—"} USDC
          (Hyperliquid minimum 10)
        </span>
        <Button onClick={submit} disabled={!session || !!problem || busy} className="ml-auto">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {isBuy ? "Buy" : "Sell"} on testnet
        </Button>
      </div>
      <div className="mt-2 space-y-1">
        {!session && <Empty>Enable test trading (Wallet card) to place orders.</Empty>}
        {session && problem && size && <p className="text-xs text-muted-foreground">{problem}</p>}
        <OutcomeNote result={result} error={error} />
      </div>
    </Card>
  );
}

function OpenOrders({
  view,
  session,
  onDone,
}: {
  view: AccountView | undefined;
  session: TradingSession | null;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState<number | null>(null);
  const [result, setResult] = useState<RelayResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cancel = async (asset: number, oid: number) => {
    if (!session) return;
    setBusy(oid);
    setResult(null);
    setError(null);
    try {
      setResult(await cancelOrder(session, asset, oid));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(null);
      onDone();
    }
  };

  return (
    <Card title="Open orders">
      {!view ? null : view.openOrders.length === 0 ? (
        <Empty>No open orders.</Empty>
      ) : (
        <Table
          head={["Placed", "Market", "Side", "Price", "Size", ""]}
          rows={view.openOrders.map((o) => [
            when(o.timestamp),
            o.market,
            o.side,
            o.limitPx,
            o.sz,
            <Button
              key="c"
              size="sm"
              variant="outline"
              disabled={!session || o.asset === null || busy === o.oid}
              onClick={() => o.asset !== null && cancel(o.asset, o.oid)}
            >
              {busy === o.oid && <Loader2 className="h-4 w-4 animate-spin" />}
              Cancel
            </Button>,
          ])}
        />
      )}
      <div className="mt-2">
        <OutcomeNote result={result} error={error} />
      </div>
    </Card>
  );
}
