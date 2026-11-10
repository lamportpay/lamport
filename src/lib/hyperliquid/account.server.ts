/**
 * Hyperliquid TESTNET views for the app's test panel: spot markets, one
 * account's balances / orders / fills / ledger, and a check run of every read
 * endpoint (tracked). Read only; public testnet data.
 */
import { endpointAllowed, currentMode } from "@/lib/app-mode.server";
import type { Json } from "@/integrations/supabase/types";

import { SPOT_ASSET_OFFSET } from "./actions";
import { HYPERLIQUID_EXCHANGE_URL } from "./exchange.server";
import {
  getAllMids,
  getL2Book,
  getLedgerUpdates,
  getOpenOrders,
  getSpotBalances,
  getSpotMeta,
  getUserFills,
  indicativeUsdcValue,
  usdcMinorFor,
  type SpotMeta,
} from "./info.server";
import { finishEvent, startEvent } from "./tracking.server";

export type Market = {
  /** "PURR/USDC" style display name built from the token names. */
  name: string;
  /** Hyperliquid's coin key ("PURR/USDC" or "@{index}") for books, mids, orders. */
  coin: string;
  /** Asset id for orders and cancels (10000 + pair index). */
  asset: number;
  base: string;
  quote: string;
  szDecimals: number;
  mid: string | null;
};

const coinKey = (pairName: string, index: number) =>
  pairName === "PURR/USDC" ? pairName : `@${index}`;

export function marketsOf(meta: SpotMeta, mids: Record<string, string>): Market[] {
  const tokens = new Map(meta.tokens.map((t) => [t.index, t]));
  const markets: Market[] = [];
  for (const pair of meta.universe) {
    const base = tokens.get(pair.tokens[0]);
    const quote = tokens.get(pair.tokens[1]);
    if (!base || !quote || base.szDecimals === undefined) continue;
    const coin = coinKey(pair.name, pair.index);
    markets.push({
      name: `${base.name}/${quote.name}`,
      coin,
      asset: SPOT_ASSET_OFFSET + pair.index,
      base: base.name,
      quote: quote.name,
      szDecimals: base.szDecimals,
      mid: mids[coin] ?? null,
    });
  }
  return markets;
}

/** USDC-quoted spot markets that have a price right now, by name. */
export async function getMarkets(): Promise<Market[]> {
  const [meta, mids] = await Promise.all([getSpotMeta(), getAllMids()]);
  return marketsOf(meta, mids)
    .filter((m) => m.quote === "USDC" && m.mid !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export type AccountView = {
  account: string;
  balances: {
    coin: string;
    total: string;
    hold: string;
    /** Indicative USDC value at the current testnet mid (USDC itself at 1). */
    usdcValue: string | null;
  }[];
  openOrders: {
    market: string;
    coin: string;
    asset: number | null;
    side: "buy" | "sell";
    limitPx: string;
    sz: string;
    oid: number;
    timestamp: number;
  }[];
  fills: {
    market: string;
    side: "buy" | "sell";
    px: string;
    sz: string;
    fee: string;
    feeToken: string | null;
    oid: number;
    time: number;
    hash: string;
  }[];
  ledger: { time: number; hash: string; type: string; details: Record<string, string> }[];
  readAt: string;
};

const LEDGER_DAYS = 30;

const minorToUsdc = (minor: bigint) => {
  const whole = minor / 1_000_000n;
  const frac = (minor % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole.toString();
};

export async function getAccountView(account: string, now = Date.now()): Promise<AccountView> {
  const [meta, mids, balances, orders, fills, ledger] = await Promise.all([
    getSpotMeta(),
    getAllMids(),
    getSpotBalances(account),
    getOpenOrders(account),
    getUserFills(account, 50),
    getLedgerUpdates(account, now - LEDGER_DAYS * 86_400_000, 50),
  ]);
  const markets = marketsOf(meta, mids);
  const byCoin = new Map(markets.map((m) => [m.coin, m]));
  const usdcMarketOf = (token: string) =>
    markets.find((m) => m.base === token && m.quote === "USDC");
  const label = (coin: string) => byCoin.get(coin)?.name ?? coin;

  return {
    account,
    balances: balances.map((b) => {
      let usdcValue: string | null = null;
      if (b.coin === "USDC") usdcValue = b.total;
      else {
        const m = usdcMarketOf(b.coin);
        if (m?.mid) usdcValue = minorToUsdc(usdcMinorFor(b.total, m.mid));
      }
      return { coin: b.coin, total: b.total, hold: b.hold, usdcValue };
    }),
    openOrders: orders.map((o) => ({
      market: label(o.coin),
      coin: o.coin,
      asset: byCoin.get(o.coin)?.asset ?? null,
      side: o.side,
      limitPx: o.limitPx,
      sz: o.sz,
      oid: o.oid,
      timestamp: o.timestamp,
    })),
    fills: fills.map((f) => ({ ...f, market: label(f.coin) })),
    ledger,
    readAt: new Date(now).toISOString(),
  };
}

export type CheckResult = { name: string; ok: boolean; ms: number; detail: string };

async function timed(name: string, run: () => Promise<string>): Promise<CheckResult> {
  const started = Date.now();
  try {
    const detail = await run();
    return { name, ok: true, ms: Date.now() - started, detail };
  } catch (e) {
    return {
      name,
      ok: false,
      ms: Date.now() - started,
      detail: e instanceof Error ? e.message.slice(0, 200) : "Failed.",
    };
  }
}

/**
 * Run every Hyperliquid read the app uses (and the account reads when an
 * account is given), plus the mode-guard rules, and track the run.
 */
export async function runChecks(
  userId: string,
  account: string | null,
): Promise<{ ok: boolean; eventId: string; results: CheckResult[] }> {
  const mode = currentMode().mode;
  const eventId = await startEvent({
    userId,
    kind: "checks",
    account,
    request: { account, mode },
  });
  const results: CheckResult[] = [
    await timed("Spot markets (spotMeta)", async () => {
      const m = await getSpotMeta();
      return `${m.tokens.length} tokens, ${m.universe.length} pairs`;
    }),
    await timed("Prices (allMids)", async () => {
      const mids = await getAllMids();
      return `${Object.keys(mids).length} prices`;
    }),
    await timed("Order book PURR/USDC (l2Book)", async () => {
      const book = await getL2Book("PURR/USDC");
      return `${book.bids.length} bids / ${book.asks.length} asks, best ${book.bids[0]?.px ?? "-"} / ${book.asks[0]?.px ?? "-"}`;
    }),
    await timed("Indicative value 10 PURR", async () => {
      const q = await indicativeUsdcValue("PURR", "10");
      if (q.status !== "quoted") throw new Error(q.reason);
      return `${minorToUsdc(q.usdcMinor)} USDC at mid ${q.mid}`;
    }),
  ];
  if (account) {
    results.push(
      await timed("Spot balances (spotClearinghouseState)", async () => {
        const b = await getSpotBalances(account);
        return `${b.length} balances`;
      }),
      await timed("Open orders (openOrders)", async () => {
        const o = await getOpenOrders(account);
        return `${o.length} open orders`;
      }),
      await timed("Trades (userFills)", async () => {
        const f = await getUserFills(account, 2000);
        return `${f.length} fills`;
      }),
      await timed(`Deposits & transfers, ${LEDGER_DAYS} days (ledger)`, async () => {
        const l = await getLedgerUpdates(account, Date.now() - LEDGER_DAYS * 86_400_000, 2000);
        return `${l.length} updates`;
      }),
    );
  }
  results.push(
    await timed("Safety: Hyperliquid mainnet is blocked", async () => {
      if (endpointAllowed(mode, "hyperliquid_info", "https://api.hyperliquid.xyz/info").ok)
        throw new Error("Mainnet info would be allowed.");
      if (endpointAllowed(mode, "hyperliquid_exchange", "https://api.hyperliquid.xyz/exchange").ok)
        throw new Error("Mainnet exchange would be allowed.");
      return "mainnet info and exchange refused";
    }),
    await timed("Test trading available (TEST MODE)", async () => {
      if (!endpointAllowed(mode, "hyperliquid_exchange", HYPERLIQUID_EXCHANGE_URL).ok)
        throw new Error(`Not available in ${mode.toUpperCase()} MODE.`);
      return "testnet exchange relay enabled";
    }),
  );
  const ok = results.every((r) => r.ok);
  await finishEvent(eventId, {
    ok,
    response: results as unknown as Json,
    error: ok
      ? null
      : results
          .filter((r) => !r.ok)
          .map((r) => r.name)
          .join(", "),
  });
  return { ok, eventId, results };
}
