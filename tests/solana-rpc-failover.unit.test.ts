/**
 * LIVE Solana RPC with several configured mainnet endpoints (12 Nov 2026): tried in
 * order, the next one used when an endpoint fails or refuses a method, a node's
 * JSON-RPC error returned as is, test clusters refused. No network: fetch is stubbed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/app-mode.server", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/app-mode.server")>();
  return { ...real, currentMode: () => ({ mode: "live", ok: true, problems: [] }) as never };
});

import { evaluateMode } from "@/lib/app-mode.server";
import { parseRpcList, resolveRpcUrl, rpc } from "@/lib/solana-rpc.server";

import { LIVE_ENV } from "./support/app-mode";

const A = "https://api.mainnet-beta.solana.com";
const B = "https://solana-rpc.publicnode.com";
const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("SOLANA_RPC_URL", `${B}, ${A}`);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const ok = (result: unknown) => new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }));

describe("SOLANA_RPC_URL list", () => {
  it("parses commas and spaces; the first endpoint is the primary", () => {
    expect(parseRpcList(` ${B},${A}  `)).toEqual([B, A]);
    expect(parseRpcList(undefined)).toEqual([]);
    expect(resolveRpcUrl("mainnet-beta")).toEqual({ url: B, custom: true });
  });

  it("uses the first endpoint when it answers", async () => {
    fetchMock.mockResolvedValueOnce(ok(123));
    expect(await rpc("mainnet-beta", "getBlockHeight", [])).toEqual({ ok: true, result: 123 });
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([B]);
  });

  it("moves to the next endpoint when one refuses a method (HTTP 403) or times out", async () => {
    fetchMock.mockResolvedValueOnce(new Response("Forbidden", { status: 403 }));
    fetchMock.mockResolvedValueOnce(ok({ value: [] }));
    expect(await rpc("mainnet-beta", "getTokenAccountsByOwner", [])).toEqual({
      ok: true,
      result: { value: [] },
    });
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([B, A]);

    fetchMock.mockReset();
    fetchMock.mockRejectedValueOnce(Object.assign(new Error("t"), { name: "TimeoutError" }));
    fetchMock.mockResolvedValueOnce(ok(7));
    expect(await rpc("mainnet-beta", "getSlot", [])).toEqual({ ok: true, result: 7 });
  });

  it("returns a node's JSON-RPC error without trying the next endpoint", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, error: { message: "Invalid param" } })),
    );
    expect(await rpc("mainnet-beta", "getSlot", [])).toMatchObject({ ok: false, error: "Invalid param" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports the last failure when every endpoint fails", async () => {
    fetchMock.mockResolvedValue(new Response("down", { status: 503 }));
    expect(await rpc("mainnet-beta", "getSlot", [])).toMatchObject({ ok: false, status: 502 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("refuses the whole list if any endpoint is a test cluster", async () => {
    vi.stubEnv("SOLANA_RPC_URL", `${A},https://api.devnet.solana.com`);
    expect(await rpc("mainnet-beta", "getSlot", [])).toMatchObject({ ok: false, status: 403 });
    expect(fetchMock).not.toHaveBeenCalled();
    const live = { ...LIVE_ENV, SOLANA_RPC_URL: `${A},https://api.devnet.solana.com` };
    expect(evaluateMode(live, true).liveBlockers.join(" ")).toMatch(/test cluster/);
    expect(evaluateMode({ ...LIVE_ENV, SOLANA_RPC_URL: `${A}, ${B}` }, true).ok).toBe(true);
    expect(evaluateMode({ ...LIVE_ENV, SOLANA_RPC_URL: `${A},not-a-url` }, true).ok).toBe(false);
  });
});
