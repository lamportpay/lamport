import { beforeAll, describe, expect, it } from "vitest";

import { TEST_ENV } from "./support/app-mode";

/**
 * Real calls to the Hyperliquid TESTNET info endpoint (read only; nothing is
 * signed, no order exists). Skipped unless HYPERLIQUID_LIVE=1, so CI never
 * depends on the network:
 *   HYPERLIQUID_LIVE=1 npx vitest run tests/hyperliquid-testnet.live.test.ts
 */
describe.runIf(process.env["HYPERLIQUID_LIVE"] === "1")("Hyperliquid testnet reads (live)", () => {
  beforeAll(() => {
    Object.assign(process.env, TEST_ENV);
  });
  const hl = () => import("@/lib/hyperliquid/info.server");

  it("1. spot metadata lists USDC and the PURR/USDC pair", async () => {
    const meta = await (await hl()).getSpotMeta();
    console.log(`[hl] spotMeta: ${meta.tokens.length} tokens, ${meta.universe.length} pairs`);
    expect(meta.tokens.some((t) => t.name === "USDC")).toBe(true);
    expect(meta.universe.some((p) => p.name === "PURR/USDC")).toBe(true);
  });

  it("2. mid prices include PURR/USDC", async () => {
    const mids = await (await hl()).getAllMids();
    console.log(
      `[hl] allMids: ${Object.keys(mids).length} markets, PURR/USDC = ${mids["PURR/USDC"]}`,
    );
    expect(Number(mids["PURR/USDC"])).toBeGreaterThan(0);
  });

  it("3. the PURR/USDC order book has ordered bids and asks", async () => {
    const book = await (await hl()).getL2Book("PURR/USDC");
    console.log(
      `[hl] l2Book ${book.coin}: ${book.bids.length} bids (best ${book.bids[0]?.px}), ${book.asks.length} asks (best ${book.asks[0]?.px})`,
    );
    expect(book.coin).toBe("PURR/USDC");
    if (book.bids[0] && book.asks[0]) {
      expect(Number(book.bids[0].px)).toBeLessThan(Number(book.asks[0].px));
    }
  });

  it("4. spot balances answer for a valid address and refuse a malformed one", async () => {
    const mod = await hl();
    const balances = await mod.getSpotBalances("0x0000000000000000000000000000000000000001");
    console.log(`[hl] spotClearinghouseState: ${balances.length} balances`);
    expect(Array.isArray(balances)).toBe(true);
    await expect(mod.getSpotBalances("not-an-address")).rejects.toMatchObject({ status: 400 });
  });

  it("5. account activity reads (open orders, fills, ledger) parse for an active trader", async () => {
    // An address that traded PURR/USDC recently (public recentTrades data).
    const res = await fetch("https://api.hyperliquid-testnet.xyz/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "recentTrades", coin: "PURR/USDC" }),
    });
    const trades = (await res.json()) as { users?: string[] }[];
    const user = trades.find((t) => t.users?.[0])?.users?.[0];
    expect(user).toMatch(/^0x[0-9a-fA-F]{40}$/);
    const mod = await hl();
    const [orders, fills, ledger] = await Promise.all([
      mod.getOpenOrders(user!),
      mod.getUserFills(user!, 2000),
      mod.getLedgerUpdates(user!, Date.now() - 30 * 86_400_000, 2000),
    ]);
    console.log(
      `[hl] active trader ${user!.slice(0, 8)}…: ${orders.length} open orders, ${fills.length} fills, ${ledger.length} ledger updates`,
    );
    expect(fills.length).toBeGreaterThan(0);
    const meta = await mod.getSpotMeta();
    expect(meta.tokens.find((t) => t.name === "PURR")?.szDecimals).toBeTypeOf("number");
  });

  it("6. the testnet exchange recovers the same signer from our signatures", async () => {
    // A throwaway key with no account: Hyperliquid refuses the order and names
    // the address it recovered from the signature. That address matching ours
    // proves the action hash and EIP-712 signing match Hyperliquid's own.
    const { orderAction } = await import("@/lib/hyperliquid/actions");
    const s = await import("@/lib/hyperliquid/signing");
    const key = s.newAgentKey();
    const agent = s.addressOfPrivateKey(key);
    const action = orderAction({ asset: 10000, isBuy: true, price: "1", size: "11", tif: "Alo" });
    const nonce = Date.now();
    const signature = s.signDigest(s.l1Digest(action as unknown as s.MsgpackValue, nonce), key);
    const res = await fetch("https://api.hyperliquid-testnet.xyz/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, nonce, signature, vaultAddress: null, expiresAfter: null }),
    });
    const body = (await res.json()) as { status?: string; response?: unknown };
    console.log(`[hl] exchange answer for unknown agent ${agent}: ${JSON.stringify(body)}`);
    expect(body.status).toBe("err");
    expect(String(body.response).toLowerCase()).toContain(agent);
  });

  it("indicative USDC value of 10 PURR comes from the testnet mid", async () => {
    const quote = await (await hl()).indicativeUsdcValue("PURR", "10");
    console.log(
      `[hl] 10 PURR = ${quote.status === "quoted" ? quote.usdcMinor : quote.reason} (USDC minor)`,
    );
    expect(quote.status).toBe("quoted");
    if (quote.status === "quoted") {
      expect(quote.source).toBe("hyperliquid_testnet_spot_mid");
      expect(quote.usdcMinor).toBeGreaterThan(0n);
    }
  });
});
