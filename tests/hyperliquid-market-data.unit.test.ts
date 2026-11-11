/**
 * Hyperliquid market data and account history (11 Nov 2026): 24h asset contexts,
 * candles, order history, fills by time and portfolio parsing, the network each
 * mode reads, and the markets ordering. No network: fetch is stubbed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  currentHlNetwork,
  getCandles,
  getHistoricalOrders,
  getPortfolio,
  getSpotAssetCtxs,
  getUserFillsByTime,
} from "@/lib/hyperliquid/info.server";
import { HL_SOURCE, networkForMode } from "@/lib/hyperliquid/network";

const USER = "0x" + "ab".repeat(20);
const fetchMock = vi.fn();

function answer(body: unknown) {
  fetchMock.mockImplementationOnce(async () => new Response(JSON.stringify(body)));
}
const sentBody = (i = 0) => JSON.parse(String(fetchMock.mock.calls[i]![1].body));

beforeEach(() => {
  vi.stubEnv("LAMPORTPAY_MODE", "test");
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("network follows the app mode", () => {
  it("testnet in TEST MODE, mainnet in LIVE MODE; phantom-agent source b / a", () => {
    expect(networkForMode("test")).toBe("testnet");
    expect(networkForMode("live")).toBe("mainnet");
    expect(HL_SOURCE).toEqual({ testnet: "b", mainnet: "a" });
    expect(currentHlNetwork()).toBe("testnet");
  });

  it("TEST MODE reads go to the testnet info endpoint", async () => {
    answer([{ universe: [], tokens: [] }, []]);
    await getSpotAssetCtxs();
    expect(fetchMock.mock.calls[0]![0]).toBe("https://api.hyperliquid-testnet.xyz/info");
    expect(sentBody()).toEqual({ type: "spotMetaAndAssetCtxs" });
  });
});

describe("market data parsing", () => {
  it("spotMetaAndAssetCtxs: keeps valid decimals, nulls the rest", async () => {
    answer([
      { universe: [], tokens: [] },
      [
        { coin: "@142", markPx: "104000.5", midPx: "104001.0", prevDayPx: "100000", dayNtlVlm: "1234567.8" },
        { coin: "PURR/USDC", markPx: "x", midPx: null, prevDayPx: "0.2", dayNtlVlm: "-1" },
        { nope: true },
      ],
    ]);
    const ctxs = await getSpotAssetCtxs();
    expect(ctxs.get("@142")).toEqual({
      coin: "@142",
      markPx: "104000.5",
      midPx: "104001.0",
      prevDayPx: "100000",
      dayNtlVlm: "1234567.8",
    });
    expect(ctxs.get("PURR/USDC")).toMatchObject({ markPx: null, midPx: null, dayNtlVlm: null });
    expect(ctxs.size).toBe(2);
  });

  it("candleSnapshot: asks for the window, drops malformed candles, sorts by time", async () => {
    const now = 1_762_800_000_000;
    answer([
      { t: now - 3_600_000, o: "2", h: "3", l: "1", c: "2.5", v: "10" },
      { t: now - 7_200_000, o: "1", h: "2", l: "1", c: "2", v: "5" },
      { t: "bad", o: "1", h: "1", l: "1", c: "1", v: "1" },
    ]);
    const candles = await getCandles("@142", "1h", 2, now);
    expect(sentBody()).toEqual({
      type: "candleSnapshot",
      req: { coin: "@142", interval: "1h", startTime: now - 7_200_000, endTime: now },
    });
    expect(candles.map((c) => c.c)).toEqual(["2", "2.5"]);
    await expect(getCandles("bad coin!", "1h")).rejects.toThrow("Unknown market");
  });

  it("historicalOrders: newest status first, malformed entries skipped", async () => {
    answer([
      {
        order: { coin: "@142", side: "B", limitPx: "100", sz: "0", origSz: "0.1", oid: 1, timestamp: 10, orderType: "Limit", tif: "Gtc" },
        status: "filled",
        statusTimestamp: 20,
      },
      {
        order: { coin: "@151", side: "A", limitPx: "3000", sz: "1", oid: 2, timestamp: 30 },
        status: "canceled",
        statusTimestamp: 40,
      },
      { order: { coin: "@1" }, status: "open", statusTimestamp: 50 },
    ]);
    const orders = await getHistoricalOrders(USER);
    expect(orders.map((o) => [o.oid, o.status, o.side])).toEqual([
      [2, "canceled", "sell"],
      [1, "filled", "buy"],
    ]);
    expect(orders[1]).toMatchObject({ origSz: "0.1", tif: "Gtc" });
    expect(sentBody()).toEqual({ type: "historicalOrders", user: USER });
    await expect(getHistoricalOrders("0x123")).rejects.toThrow("Invalid account address");
  });

  it("userFillsByTime: validates the range and parses fills", async () => {
    answer([
      { coin: "@142", side: "B", px: "100", sz: "0.1", fee: "0.01", feeToken: "USDC", oid: 1, time: 5, hash: "0xaa" },
      { coin: "@142", side: "A", px: "101", sz: "0.1", fee: "bad", oid: 2, time: 9, hash: "0xbb" },
    ]);
    const fills = await getUserFillsByTime(USER, 1, 10);
    expect(fills.map((f) => [f.oid, f.fee])).toEqual([
      [2, "0"],
      [1, "0.01"],
    ]);
    await expect(getUserFillsByTime(USER, 10, 1)).rejects.toThrow("Invalid time range");
  });

  it("portfolio: periods with account value and PnL history", async () => {
    answer([
      ["day", { accountValueHistory: [[1, "10.5"], [2, "11"]], pnlHistory: [[1, "0"], [2, "-0.5"]], vlm: "100" }],
      ["allTime", { accountValueHistory: [["x", "1"]], pnlHistory: [], vlm: "bad" }],
      "junk",
    ]);
    const p = await getPortfolio(USER);
    expect(p).toEqual([
      {
        period: "day",
        accountValue: [
          { t: 1, value: "10.5" },
          { t: 2, value: "11" },
        ],
        pnl: [
          { t: 1, value: "0" },
          { t: 2, value: "-0.5" },
        ],
        volume: "100",
      },
      { period: "allTime", accountValue: [], pnl: [], volume: null },
    ]);
  });
});
