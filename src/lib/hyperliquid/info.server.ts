/**
 * Hyperliquid TESTNET, read only (decision 2026-11-04: Testnet for all reads, no
 * Mainnet dependency): spot metadata, mid prices, order books and spot account
 * balances from the public testnet info endpoint
 * (POST https://api.hyperliquid-testnet.xyz/info, no key, no signature).
 * Testnet prices are test-market prices, not real prices.
 *
 * Earlier design note, kept for history:
 *
 * Scope (29 Oct 2026): the "major digital assets → Hyperliquid → USDC" route
 * is in progress and not enabled. This module only reads spot metadata and mid
 * prices to give an indicative USDC value for an amount of a spot token. It
 * never calls the exchange endpoint (orders, transfers and withdrawals are
 * signed actions there) and nothing in the app routes to it yet. The mode
 * guard allows the info path only (app-mode.server.ts, "hyperliquid_info").
 * (Until 4 Nov this read Mainnet market data; it now reads the testnet only.)
 */
import { assertEndpointAllowed } from "@/lib/app-mode.server";

export const HYPERLIQUID_INFO_URL = "https://api.hyperliquid-testnet.xyz/info";
/** A Hyperliquid account address: 0x followed by 40 hex digits. */
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
/** Coin keys Hyperliquid accepts for books: "PURR/USDC", "@123" or a perp name. */
const COIN = /^(?:@\d{1,6}|[A-Za-z0-9]{1,20}(?:\/[A-Za-z0-9]{1,20})?)$/;
const TIMEOUT_MS = 10_000;
/** USDC has 6 decimals (src/lib/money.ts). */
const USDC_EXPONENT = 6;
const DECIMAL = /^\d+(?:\.\d+)?$/;

export class HyperliquidError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "HyperliquidError";
  }
}

/** szDecimals: size decimals for orders (absent when Hyperliquid omits it). */
export type SpotToken = { name: string; index: number; szDecimals?: number };
export type SpotPair = { name: string; index: number; tokens: [number, number] };
export type SpotMeta = { tokens: SpotToken[]; universe: SpotPair[] };

export type IndicativeQuote =
  | {
      status: "quoted";
      /** The spot pair priced, as Hyperliquid names it ("@{index}" or "PURR/USDC"). */
      coin: string;
      token: string;
      amount: string;
      /** Mid price in USDC per token, exactly as Hyperliquid reported it. */
      mid: string;
      /** amount × mid in USDC minor units, rounded down. Indicative only: no order exists. */
      usdcMinor: bigint;
      source: "hyperliquid_testnet_spot_mid";
    }
  | { status: "unavailable"; reason: string };

async function postInfo(body: Record<string, unknown>): Promise<unknown> {
  assertEndpointAllowed("hyperliquid_info", HYPERLIQUID_INFO_URL);
  let response: Response;
  try {
    response = await fetch(HYPERLIQUID_INFO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new HyperliquidError("Hyperliquid did not answer.", 503);
  }
  if (!response.ok) {
    throw new HyperliquidError(`Hyperliquid answered ${response.status}.`, 503);
  }
  try {
    return await response.json();
  } catch {
    throw new HyperliquidError("Hyperliquid sent an unreadable answer.", 502);
  }
}

const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0;

/** Spot tokens and pairs. Unknown fields are ignored; malformed entries are refused. */
export async function getSpotMeta(): Promise<SpotMeta> {
  const raw = (await postInfo({ type: "spotMeta" })) as { tokens?: unknown; universe?: unknown };
  if (!raw || !Array.isArray(raw.tokens) || !Array.isArray(raw.universe)) {
    throw new HyperliquidError("Unexpected spotMeta answer.", 502);
  }
  const tokens = raw.tokens.map((t: { name?: unknown; index?: unknown; szDecimals?: unknown }) => {
    if (typeof t?.name !== "string" || !isInt(t.index)) {
      throw new HyperliquidError("Unexpected spotMeta token.", 502);
    }
    return isInt(t.szDecimals) && t.szDecimals <= 8
      ? { name: t.name, index: t.index, szDecimals: t.szDecimals }
      : { name: t.name, index: t.index };
  });
  const universe = raw.universe.map((p: { name?: unknown; index?: unknown; tokens?: unknown }) => {
    const pair = p?.tokens;
    if (
      typeof p?.name !== "string" ||
      !isInt(p.index) ||
      !Array.isArray(pair) ||
      pair.length !== 2 ||
      !isInt(pair[0]) ||
      !isInt(pair[1])
    ) {
      throw new HyperliquidError("Unexpected spotMeta pair.", 502);
    }
    return { name: p.name, index: p.index, tokens: [pair[0], pair[1]] as [number, number] };
  });
  return { tokens, universe };
}

/** Mid prices by coin ("@{index}" for spot pairs), as decimal strings. */
export async function getAllMids(): Promise<Record<string, string>> {
  const raw = await postInfo({ type: "allMids" });
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new HyperliquidError("Unexpected allMids answer.", 502);
  }
  const mids: Record<string, string> = {};
  for (const [coin, value] of Object.entries(raw)) {
    if (typeof value === "string" && DECIMAL.test(value)) mids[coin] = value;
  }
  return mids;
}

function parseDecimal(value: string): { digits: bigint; scale: number } {
  const [whole, fraction = ""] = value.split(".");
  return { digits: BigInt(whole! + fraction), scale: fraction.length };
}

/** amount × price in USDC minor units, rounded down, without floating point. */
export function usdcMinorFor(amount: string, price: string): bigint {
  if (!DECIMAL.test(amount) || !DECIMAL.test(price)) throw new Error("Invalid decimal.");
  const a = parseDecimal(amount);
  const p = parseDecimal(price);
  const scale = a.scale + p.scale;
  const product = a.digits * p.digits;
  return scale >= USDC_EXPONENT
    ? product / 10n ** BigInt(scale - USDC_EXPONENT)
    : product * 10n ** BigInt(USDC_EXPONENT - scale);
}

/**
 * The spot pair of `tokenName` against USDC and its coin key for allMids:
 * "PURR/USDC" keeps its name; every other pair is "@{index}" (Hyperliquid docs).
 */
export function findUsdcPair(meta: SpotMeta, tokenName: string): { coin: string } | null {
  const usdc = meta.tokens.find((t) => t.name === "USDC");
  const token = meta.tokens.find((t) => t.name === tokenName);
  if (!usdc || !token || token.index === usdc.index) return null;
  const pair = meta.universe.find((p) => p.tokens[0] === token.index && p.tokens[1] === usdc.index);
  if (!pair) return null;
  return { coin: pair.name === "PURR/USDC" ? pair.name : `@${pair.index}` };
}

/**
 * Indicative USDC value of `amount` of a Hyperliquid spot token at the current
 * mid price. Read only; not a quote anyone can execute.
 */
export async function indicativeUsdcValue(
  tokenName: string,
  amount: string,
): Promise<IndicativeQuote> {
  if (!DECIMAL.test(amount) || /^0+(\.0+)?$/.test(amount)) {
    return { status: "unavailable", reason: "Enter a positive amount." };
  }
  const [meta, mids] = await Promise.all([getSpotMeta(), getAllMids()]);
  const pair = findUsdcPair(meta, tokenName);
  if (!pair) return { status: "unavailable", reason: `No ${tokenName}/USDC spot market.` };
  const mid = mids[pair.coin];
  if (!mid) return { status: "unavailable", reason: `No price for ${tokenName}/USDC right now.` };
  return {
    status: "quoted",
    coin: pair.coin,
    token: tokenName,
    amount,
    mid,
    usdcMinor: usdcMinorFor(amount, mid),
    source: "hyperliquid_testnet_spot_mid",
  };
}

export type BookLevel = { px: string; sz: string; n: number };
export type L2Book = { coin: string; time: number; bids: BookLevel[]; asks: BookLevel[] };

function parseLevels(side: unknown): BookLevel[] {
  if (!Array.isArray(side)) throw new HyperliquidError("Unexpected l2Book answer.", 502);
  return side.map((l: { px?: unknown; sz?: unknown; n?: unknown }) => {
    if (
      typeof l?.px !== "string" ||
      !DECIMAL.test(l.px) ||
      typeof l.sz !== "string" ||
      !DECIMAL.test(l.sz) ||
      !isInt(l.n)
    ) {
      throw new HyperliquidError("Unexpected l2Book level.", 502);
    }
    return { px: l.px, sz: l.sz, n: l.n };
  });
}

/** Order book (bids, asks) for a coin key such as "PURR/USDC" or "@123". Read only. */
export async function getL2Book(coin: string): Promise<L2Book> {
  if (!COIN.test(coin)) throw new HyperliquidError("Unknown market.", 400);
  const raw = (await postInfo({ type: "l2Book", coin })) as {
    coin?: unknown;
    time?: unknown;
    levels?: unknown;
  };
  if (!raw || typeof raw.coin !== "string" || !isInt(raw.time) || !Array.isArray(raw.levels)) {
    throw new HyperliquidError("Unexpected l2Book answer.", 502);
  }
  if (raw.levels.length !== 2) throw new HyperliquidError("Unexpected l2Book answer.", 502);
  return {
    coin: raw.coin,
    time: raw.time,
    bids: parseLevels(raw.levels[0]),
    asks: parseLevels(raw.levels[1]),
  };
}

export type SpotBalance = { coin: string; token: number; total: string; hold: string };

/**
 * Spot balances of a testnet account (public data; no key, nothing signed).
 * The address is validated here, so a malformed one never reaches Hyperliquid.
 */
export async function getSpotBalances(user: string): Promise<SpotBalance[]> {
  if (!ADDRESS.test(user)) throw new HyperliquidError("Invalid account address.", 400);
  const raw = (await postInfo({ type: "spotClearinghouseState", user })) as {
    balances?: unknown;
  };
  if (!raw || !Array.isArray(raw.balances)) {
    throw new HyperliquidError("Unexpected spotClearinghouseState answer.", 502);
  }
  return raw.balances.map(
    (b: { coin?: unknown; token?: unknown; total?: unknown; hold?: unknown }) => {
      if (
        typeof b?.coin !== "string" ||
        !isInt(b.token) ||
        typeof b.total !== "string" ||
        !DECIMAL.test(b.total) ||
        typeof b.hold !== "string" ||
        !DECIMAL.test(b.hold)
      ) {
        throw new HyperliquidError("Unexpected spot balance.", 502);
      }
      return { coin: b.coin, token: b.token, total: b.total, hold: b.hold };
    },
  );
}

// ------------------------------------------------ account activity (7 Nov) ---

const str = (v: unknown): v is string => typeof v === "string";
const dec = (v: unknown): v is string => str(v) && DECIMAL.test(v);

export type OpenOrder = {
  coin: string;
  side: "buy" | "sell";
  limitPx: string;
  sz: string;
  oid: number;
  timestamp: number;
};

/** Resting orders of a testnet account (public data). */
export async function getOpenOrders(user: string): Promise<OpenOrder[]> {
  if (!ADDRESS.test(user)) throw new HyperliquidError("Invalid account address.", 400);
  const raw = await postInfo({ type: "openOrders", user });
  if (!Array.isArray(raw)) throw new HyperliquidError("Unexpected openOrders answer.", 502);
  return raw.map((o: Record<string, unknown>) => {
    if (
      !str(o?.coin) ||
      (o.side !== "A" && o.side !== "B") ||
      !dec(o.limitPx) ||
      !dec(o.sz) ||
      !isInt(o.oid) ||
      !isInt(o.timestamp)
    ) {
      throw new HyperliquidError("Unexpected open order.", 502);
    }
    return {
      coin: o.coin,
      side: o.side === "B" ? "buy" : "sell",
      limitPx: o.limitPx,
      sz: o.sz,
      oid: o.oid,
      timestamp: o.timestamp,
    };
  });
}

export type Fill = {
  coin: string;
  side: "buy" | "sell";
  px: string;
  sz: string;
  fee: string;
  feeToken: string | null;
  oid: number;
  time: number;
  hash: string;
};

/** Most recent fills (trades) of a testnet account, newest first, at most `limit`. */
export async function getUserFills(user: string, limit = 50): Promise<Fill[]> {
  if (!ADDRESS.test(user)) throw new HyperliquidError("Invalid account address.", 400);
  const raw = await postInfo({ type: "userFills", user });
  if (!Array.isArray(raw)) throw new HyperliquidError("Unexpected userFills answer.", 502);
  return raw
    .map((f: Record<string, unknown>) => {
      if (
        !str(f?.coin) ||
        (f.side !== "A" && f.side !== "B") ||
        !dec(f.px) ||
        !dec(f.sz) ||
        !isInt(f.oid) ||
        !isInt(f.time) ||
        !str(f.hash)
      ) {
        throw new HyperliquidError("Unexpected fill.", 502);
      }
      const fee = str(f.fee) && /^-?\d+(?:\.\d+)?$/.test(f.fee) ? f.fee : "0";
      return {
        coin: f.coin,
        side: (f.side === "B" ? "buy" : "sell") as Fill["side"],
        px: f.px,
        sz: f.sz,
        fee,
        feeToken: str(f.feeToken) ? f.feeToken : null,
        oid: f.oid,
        time: f.time,
        hash: f.hash,
      };
    })
    .sort((a, b) => b.time - a.time)
    .slice(0, limit);
}

export type LedgerUpdate = {
  time: number;
  hash: string;
  type: string;
  /** Plain fields of the update (token, amount, usdc, destination, …), strings only. */
  details: Record<string, string>;
};

/**
 * Deposits, transfers and other non-funding balance changes of a testnet
 * account since `startTime` (ms), newest first, at most `limit`.
 */
export async function getLedgerUpdates(
  user: string,
  startTime: number,
  limit = 50,
): Promise<LedgerUpdate[]> {
  if (!ADDRESS.test(user)) throw new HyperliquidError("Invalid account address.", 400);
  if (!isInt(startTime)) throw new HyperliquidError("Invalid start time.", 400);
  const raw = await postInfo({ type: "userNonFundingLedgerUpdates", user, startTime });
  if (!Array.isArray(raw)) throw new HyperliquidError("Unexpected ledger answer.", 502);
  return raw
    .map((u: { time?: unknown; hash?: unknown; delta?: unknown }) => {
      const delta = u?.delta as Record<string, unknown> | undefined;
      if (!isInt(u?.time) || !str(u.hash) || !delta || !str(delta.type)) {
        throw new HyperliquidError("Unexpected ledger update.", 502);
      }
      const details: Record<string, string> = {};
      for (const [k, v] of Object.entries(delta)) {
        if (k === "type") continue;
        if (str(v) && v.length <= 80) details[k] = v;
        else if (typeof v === "number" || typeof v === "boolean") details[k] = String(v);
      }
      return { time: u.time, hash: u.hash, type: delta.type, details };
    })
    .sort((a, b) => b.time - a.time)
    .slice(0, limit);
}
