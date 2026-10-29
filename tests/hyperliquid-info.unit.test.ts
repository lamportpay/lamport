import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { endpointAllowed } from "@/lib/app-mode.server";
import {
  HYPERLIQUID_INFO_URL,
  HyperliquidError,
  findUsdcPair,
  getAllMids,
  getSpotMeta,
  indicativeUsdcValue,
  usdcMinorFor,
} from "@/lib/hyperliquid/info.server";

// Shapes as documented for POST /info (types "spotMeta" and "allMids"); values made up.
const SPOT_META = {
  tokens: [
    { name: "USDC", szDecimals: 8, weiDecimals: 8, index: 0, tokenId: "0x01", isCanonical: true },
    { name: "PURR", szDecimals: 0, weiDecimals: 5, index: 1, tokenId: "0x02", isCanonical: true },
    {
      name: "UBTC",
      szDecimals: 5,
      weiDecimals: 10,
      index: 197,
      tokenId: "0x03",
      isCanonical: false,
    },
  ],
  universe: [
    { name: "PURR/USDC", tokens: [1, 0], index: 0, isCanonical: true },
    { name: "@142", tokens: [197, 0], index: 142, isCanonical: false },
  ],
};
const ALL_MIDS = { BTC: "104000.5", "PURR/USDC": "0.21234", "@142": "103987.25", bad: 7 };

function mockInfo(answers: Record<string, unknown>) {
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    const type = (JSON.parse(String(init.body)) as { type: string }).type;
    return new Response(JSON.stringify(answers[type]), { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.stubEnv("LAMPORTPAY_MODE", "test");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Hyperliquid mode guard: read-only info endpoint only", () => {
  it("allows only POST /info on api.hyperliquid.xyz, in both modes", () => {
    for (const mode of ["test", "live"] as const) {
      expect(endpointAllowed(mode, "hyperliquid_info", HYPERLIQUID_INFO_URL).ok).toBe(true);
      expect(
        endpointAllowed(mode, "hyperliquid_info", "https://api.hyperliquid.xyz/exchange").ok,
      ).toBe(false);
      expect(endpointAllowed(mode, "hyperliquid_info", "https://evil.example/info").ok).toBe(false);
      expect(endpointAllowed(mode, "hyperliquid_info", "not a url").ok).toBe(false);
    }
  });
});

describe("Hyperliquid info client", () => {
  it("posts JSON to the info endpoint and parses spotMeta and allMids", async () => {
    const fetchMock = mockInfo({ spotMeta: SPOT_META, allMids: ALL_MIDS });
    const meta = await getSpotMeta();
    expect(meta.universe).toHaveLength(2);
    const mids = await getAllMids();
    expect(mids).toEqual({ BTC: "104000.5", "PURR/USDC": "0.21234", "@142": "103987.25" });
    for (const [url, init] of fetchMock.mock.calls) {
      expect(url).toBe(HYPERLIQUID_INFO_URL);
      expect(init.method).toBe("POST");
    }
  });

  it("names spot pairs as Hyperliquid does: PURR/USDC by name, others as @index", () => {
    expect(findUsdcPair(SPOT_META, "PURR")).toEqual({ coin: "PURR/USDC" });
    expect(findUsdcPair(SPOT_META, "UBTC")).toEqual({ coin: "@142" });
    expect(findUsdcPair(SPOT_META, "USDC")).toBeNull();
    expect(findUsdcPair(SPOT_META, "DOGE")).toBeNull();
  });

  it("computes the indicative USDC value exactly, rounded down", async () => {
    mockInfo({ spotMeta: SPOT_META, allMids: ALL_MIDS });
    const quote = await indicativeUsdcValue("UBTC", "0.015");
    expect(quote).toMatchObject({ status: "quoted", coin: "@142", mid: "103987.25" });
    // 0.015 × 103987.25 = 1559.80875 USDC → 1559.808750
    expect(quote.status === "quoted" && quote.usdcMinor).toBe(1_559_808_750n);
    expect(usdcMinorFor("3", "0.21234")).toBe(637_020n);
    expect(usdcMinorFor("0.0000001", "1.5")).toBe(0n);
  });

  it("reports unavailable for unknown tokens, missing prices and zero amounts", async () => {
    mockInfo({ spotMeta: SPOT_META, allMids: { "PURR/USDC": "0.2" } });
    expect((await indicativeUsdcValue("DOGE", "1")).status).toBe("unavailable");
    expect((await indicativeUsdcValue("UBTC", "1")).status).toBe("unavailable");
    expect((await indicativeUsdcValue("PURR", "0")).status).toBe("unavailable");
    expect((await indicativeUsdcValue("PURR", "-1")).status).toBe("unavailable");
  });

  it("refuses malformed answers and network failures without guessing", async () => {
    mockInfo({ spotMeta: { tokens: [{ name: 1 }], universe: [] } });
    await expect(getSpotMeta()).rejects.toBeInstanceOf(HyperliquidError);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("busy", { status: 429 })),
    );
    await expect(getAllMids()).rejects.toMatchObject({ status: 503 });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );
    await expect(getAllMids()).rejects.toMatchObject({ status: 503 });
  });
});
