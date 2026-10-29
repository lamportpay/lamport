/**
 * Hyperliquid, read only: spot market data from the public info endpoint
 * (POST https://api.hyperliquid.xyz/info, no key, no signature).
 *
 * Scope (29 Oct 2026): the "major digital assets → Hyperliquid → USDC" route
 * is in progress and not enabled. This module only reads spot metadata and mid
 * prices to give an indicative USDC value for an amount of a spot token. It
 * never calls the exchange endpoint (orders, transfers and withdrawals are
 * signed actions there) and nothing in the app routes to it yet. The mode
 * guard allows the info path only (app-mode.server.ts, "hyperliquid_info").
 *
 * Like Jupiter quotes, prices are mainnet market data in both modes: the
 * testnet's books are not real prices, and reading a price moves nothing.
 */
import { assertEndpointAllowed } from "@/lib/app-mode.server";

export const HYPERLIQUID_INFO_URL = "https://api.hyperliquid.xyz/info";
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

export type SpotToken = { name: string; index: number };
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
      source: "hyperliquid_spot_mid";
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
  const tokens = raw.tokens.map((t: { name?: unknown; index?: unknown }) => {
    if (typeof t?.name !== "string" || !isInt(t.index)) {
      throw new HyperliquidError("Unexpected spotMeta token.", 502);
    }
    return { name: t.name, index: t.index };
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
    source: "hyperliquid_spot_mid",
  };
}
