import { describe, expect, it } from "vitest";

import { ASSET_LISTINGS, plannedProviderFor, resolveConversionRoute } from "@/lib/asset-routing";
import { SOL_MINT, USDC_MINT } from "@/lib/tokens";

describe("asset routing", () => {
  it("routes SOL on Solana to Jupiter, live and executable", () => {
    const r = resolveConversionRoute("solana", SOL_MINT);
    expect(r.ok && r.provider).toBe("jupiter");
    expect(r.ok && r.executable).toBe(true);
    expect(r.ok && r.settlementAsset).toBe("USDC");
  });

  it("rejects USDC as input (already settlement asset)", () => {
    expect(resolveConversionRoute("solana", USDC_MINT).ok).toBe(false);
  });

  it("does not accept major assets for intake yet", () => {
    expect(resolveConversionRoute("bitcoin", "native").ok).toBe(false);
    expect(resolveConversionRoute("ethereum", "native").ok).toBe(false);
  });

  it("maps major assets to planned Hyperliquid provider", () => {
    const btc = ASSET_LISTINGS.find((l) => l.asset === "BTC")!;
    const p = plannedProviderFor(btc)!;
    expect(p.id).toBe("hyperliquid");
    expect(p.status).toBe("PLANNED");
  });

  it("rejects unknown network and unknown asset", () => {
    expect(resolveConversionRoute("dogechain", "x").ok).toBe(false);
    expect(resolveConversionRoute("solana", "UnknownMint111").ok).toBe(false);
  });
});
