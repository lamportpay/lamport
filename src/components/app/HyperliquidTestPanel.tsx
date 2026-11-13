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
import type {
  AccountView,
  ActivityView,
  CheckResult,
  MarketWithStats as Market,
} from "@/lib/hyperliquid/account.server";
import type { Candle, CandleInterval } from "@/lib/hyperliquid/info.server";
import type { HlNetwork } from "@/lib/hyperliquid/network";
import type { TestEvent } from "@/lib/hyperliquid/tracking.server";
import { PaymentApiError, paymentApi } from "@/lib/payments/api-client";
import { cn } from "@/lib/utils";

const EXPLORERS: Record<HlNetwork, string> = {
  testnet: "https://app.hyperliquid-testnet.xyz/explorer",
  mainnet: "https://app.hyperliquid.xyz/explorer",
};
let EXPLORER = EXPLORERS.testnet;
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

  const marketsQuery = useQuery({
    queryKey: ["hl-markets"],
    queryFn: async () =>
      (await paymentApi<{ network: HlNetwork; markets: Market[] }>("/api/hyperliquid/markets"))
        .data,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
  const network: HlNetwork | null = marketsQuery.data?.network ?? null;
  const live = network === "mainnet";
  if (network) EXPLORER = EXPLORERS[network];
  const markets = { data: marketsQuery.data?.markets, isLoading: marketsQuery.isLoading };
  const [coin, setCoin] = useState<string | null>(null);
  useEffect(() => {
    if (!coin && marketsQuery.data?.markets[0]) setCoin(marketsQuery.data.markets[0].coin);
  }, [coin, marketsQuery.data]);
  const [days, setDays] = useState(30);
  const activity = useQuery({
    queryKey: ["hl-activity", account, days],
    enabled: !!account,
    queryFn: async () =>
      (
        await paymentApi<ActivityView>("/api/hyperliquid/activity", {
          method: "POST",
          body: { account, days },
        })
      ).data,
    refetchInterval: 30_000,
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
    void queryClient.invalidateQueries({ queryKey: ["hl-activity"] });
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
    if (!account || !network) return;
    setEnabling(true);
    setEnableError(null);
    try {
      setSession(await enableTrading(account, network));
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
          <h1 className="text-xl font-semibold">Trade</h1>
          {network && (
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                live
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
              )}
            >
              {live ? "LIVE · Hyperliquid mainnet" : "TEST · Hyperliquid testnet"}
            </span>
          )}
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {live
            ? "Spot trading on Hyperliquid from your own wallet. "
            : "Testnet: test tokens, no real money. "}
          Your wallet approves a trading key that lives in this tab only; it can place and cancel
          orders but cannot withdraw or transfer. LamportPay never holds a key or your funds. Every
          check and order is recorded in your history below.
        </p>
        {live && (
          <p className="max-w-2xl text-xs text-muted-foreground">
            Orders execute on Hyperliquid mainnet and can&apos;t be reversed. Prices move and you
            can lose money. Spot only, no leverage.
          </p>
        )}
      </header>

      <MarketsCard
        markets={markets.data ?? []}
        loading={markets.isLoading}
        error={marketsQuery.isError ? errorText(marketsQuery.error) : null}
        selected={coin}
        onSelect={setCoin}
      />

      {coin && (
        <ChartCard
          coin={coin}
          market={(markets.data ?? []).find((m) => m.coin === coin) ?? null}
        />
      )}

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
                  <KeyRound className="h-4 w-4" /> Trading on (key {short(session.agent)}, this tab
                  only)
                </p>
              ) : (
                <div className="space-y-2">
                  <Button onClick={enable} disabled={enabling || !network}>
                    {enabling ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="h-4 w-4" />
                    )}
                    Enable trading
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
              <Empty>
                No spot balances on Hyperliquid {network ?? ""} for this address. Deposit USDC to
                Hyperliquid from your own wallet first (app.hyperliquid.xyz, Deposit).
              </Empty>
            ) : (
              <Table
                head={["Token", "Total", "On hold", "≈ USDC (mid price)"]}
                rows={view.data.balances.map((b) => [b.coin, b.total, b.hold, b.usdcValue ?? "—"])}
              />
            )}
          </Card>

          <OrderForm
            markets={markets.data ?? []}
            loading={markets.isLoading}
            session={session}
            onDone={refreshAll}
            coin={coin}
            onCoin={setCoin}
            live={live}
          />

          <OpenOrders view={view.data} session={session} onDone={refreshAll} />

          <PortfolioCard activity={activity.data} />

          <Card title="Order history">
            {activity.isError ? (
              <p className="text-sm text-destructive">{errorText(activity.error)}</p>
            ) : !activity.data ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : activity.data.orders.length === 0 ? (
              <Empty>No orders yet.</Empty>
            ) : (
              <Table
                head={["Updated", "Market", "Side", "Price", "Size", "Type", "Status"]}
                rows={activity.data.orders.map((o) => [
                  when(o.statusTimestamp),
                  o.market,
                  o.side,
                  o.limitPx,
                  o.origSz,
                  `${o.orderType}${o.tif ? ` ${o.tif}` : ""}`,
                  o.status,
                ])}
              />
            )}
          </Card>

          <Card
            title="Trades (fills)"
            action={
              <select
                aria-label="Trades period"
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              >
                {[7, 30, 90, 365].map((d) => (
                  <option key={d} value={d}>
                    Last {d} days
                  </option>
                ))}
              </select>
            }
          >
            {!activity.data ? null : activity.data.fills.length === 0 ? (
              <Empty>No trades in this period.</Empty>
            ) : (
              <Table
                head={["Time", "Market", "Side", "Price", "Size", "Fee", "Tx"]}
                rows={activity.data.fills.map((f) => [
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

      <Card title="Your LamportPay trading log">
        {history.isError ? (
          <p className="text-sm text-destructive">{errorText(history.error)}</p>
        ) : !history.data ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : history.data.length === 0 ? (
          <Empty>Nothing yet. Run the checks or place an order.</Empty>
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
  coin: selected,
  onCoin,
  live,
}: {
  markets: Market[];
  loading: boolean;
  session: TradingSession | null;
  onDone: () => void;
  coin: string | null;
  onCoin: (coin: string) => void;
  live: boolean;
}) {
  const coin = selected ?? markets[0]?.coin ?? "";
  const setCoin = onCoin;
  const [confirmed, setConfirmed] = useState(false);
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
    if (live && !confirmed) {
      setConfirmed(true);
      return;
    }
    setConfirmed(false);
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
    <Card title={live ? "Place an order (spot limit)" : "Place a test order (spot limit)"}>
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
        <Button
          onClick={submit}
          disabled={!session || !!problem || busy}
          variant="default"
          className="ml-auto"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {live
            ? confirmed
              ? `Confirm: ${isBuy ? "buy" : "sell"} ${wireSize} ${market?.base ?? ""} @ ${wirePrice}`
              : `${isBuy ? "Buy" : "Sell"}`
            : `${isBuy ? "Buy" : "Sell"} on testnet`}
        </Button>
        {live && confirmed && (
          <Button variant="ghost" onClick={() => setConfirmed(false)} disabled={busy}>
            Back
          </Button>
        )}
      </div>
      <div className="mt-2 space-y-1">
        {!session && <Empty>Enable trading (Wallet card) to place orders.</Empty>}
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

// ----------------------------------------------- markets, chart, portfolio ---

const pct = (v: number | null) =>
  v === null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
const compactUsd = (v: string | null) => {
  const n = v === null ? NaN : Number(v);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 2 }).format(
    n,
  );
};

function MarketsCard({
  markets,
  loading,
  error,
  selected,
  onSelect,
}: {
  markets: Market[];
  loading: boolean;
  error: string | null;
  selected: string | null;
  onSelect: (coin: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [all, setAll] = useState(false);
  const shown = markets
    .filter((m) => !query || m.name.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, all || query ? 200 : 8);
  return (
    <Card
      title="Markets (spot, USDC)"
      action={
        <Input
          className="h-8 w-40 text-xs"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search markets"
        />
      }
    >
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : shown.length === 0 ? (
        <Empty>No market matches.</Empty>
      ) : (
        <>
          <div className="-mx-1 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="px-1 pb-2 font-medium">Market</th>
                  <th className="px-1 pb-2 font-medium">Price</th>
                  <th className="px-1 pb-2 font-medium">24h</th>
                  <th className="px-1 pb-2 font-medium">24h volume</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {shown.map((m) => (
                  <tr
                    key={m.coin}
                    onClick={() => onSelect(m.coin)}
                    className={cn(
                      "cursor-pointer border-t border-border/50 hover:bg-muted/40",
                      selected === m.coin && "bg-muted/60",
                    )}
                  >
                    <td className="px-1 py-2 font-medium">{m.name}</td>
                    <td className="px-1 py-2">{m.mid}</td>
                    <td
                      className={cn(
                        "px-1 py-2",
                        m.change24hPct !== null &&
                          (m.change24hPct >= 0 ? "text-emerald-600" : "text-rose-600"),
                      )}
                    >
                      {pct(m.change24hPct)}
                    </td>
                    <td className="px-1 py-2">{compactUsd(m.volume24h)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!query && markets.length > 8 && (
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => setAll(!all)}>
              {all ? "Show fewer" : `Show all ${markets.length} markets`}
            </Button>
          )}
        </>
      )}
    </Card>
  );
}

function LineChart({ points }: { points: { t: number; v: number }[] }) {
  if (points.length < 2) return <Empty>Not enough data for a chart yet.</Empty>;
  const w = 640;
  const h = 180;
  const vs = points.map((p) => p.v);
  const min = Math.min(...vs);
  const max = Math.max(...vs);
  const span = max - min || 1;
  const t0 = points[0]!.t;
  const t1 = points[points.length - 1]!.t;
  const x = (t: number) => ((t - t0) / (t1 - t0 || 1)) * w;
  const y = (v: number) => h - ((v - min) / span) * (h - 8) - 4;
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`);
  const up = vs[vs.length - 1]! >= vs[0]!;
  return (
    <div className="space-y-1">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full" preserveAspectRatio="none" role="img">
        <path
          d={d.join(" ")}
          fill="none"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          className={up ? "stroke-emerald-500" : "stroke-rose-500"}
        />
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>
          Low {min.toPrecision(6)} · High {max.toPrecision(6)}
        </span>
        <span>{new Date(t1).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}</span>
      </div>
    </div>
  );
}

function ChartCard({ coin, market }: { coin: string; market: Market | null }) {
  const [interval, setInterval] = useState<CandleInterval>("1h");
  const candles = useQuery({
    queryKey: ["hl-candles", coin, interval],
    queryFn: async () =>
      (
        await paymentApi<{ candles: Candle[] }>("/api/hyperliquid/candles", {
          method: "POST",
          body: { coin, interval },
        })
      ).data.candles,
    refetchInterval: 60_000,
  });
  return (
    <Card
      title={`${market?.name ?? coin} · ${market?.mid ?? ""}`}
      action={
        <div className="flex gap-1">
          {(["15m", "1h", "4h", "1d"] as const).map((i) => (
            <Button
              key={i}
              size="sm"
              variant={interval === i ? "secondary" : "ghost"}
              onClick={() => setInterval(i)}
            >
              {i}
            </Button>
          ))}
        </div>
      }
    >
      {candles.isError ? (
        <p className="text-sm text-destructive">{errorText(candles.error)}</p>
      ) : !candles.data ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <LineChart points={candles.data.map((c) => ({ t: c.t, v: Number(c.c) }))} />
      )}
    </Card>
  );
}

function PortfolioCard({ activity }: { activity: ActivityView | undefined }) {
  const [period, setPeriod] = useState("month");
  const periods = activity?.portfolio ?? [];
  const p = periods.find((x) => x.period === period) ?? periods[0];
  const last = (arr: { value: string }[] | undefined) =>
    arr && arr.length ? arr[arr.length - 1]!.value : null;
  return (
    <Card
      title="Portfolio"
      action={
        periods.length > 0 && (
          <select
            aria-label="Portfolio period"
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            value={p?.period ?? period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {periods.map((x) => (
              <option key={x.period} value={x.period}>
                {x.period}
              </option>
            ))}
          </select>
        )
      }
    >
      {!activity ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : !p ? (
        <Empty>No portfolio history yet.</Empty>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 text-sm tabular-nums">
            <div>
              <div className="text-xs text-muted-foreground">Account value</div>
              <div className="font-semibold">{last(p.accountValue) ?? "—"} USDC</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">PnL ({p.period})</div>
              <div className="font-semibold">{last(p.pnl) ?? "—"} USDC</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Volume</div>
              <div className="font-semibold">{compactUsd(p.volume)}</div>
            </div>
          </div>
          <LineChart points={p.accountValue.map((a) => ({ t: a.t, v: Number(a.value) }))} />
        </div>
      )}
    </Card>
  );
}
