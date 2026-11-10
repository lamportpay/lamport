/**
 * rpc() (src/lib/solana-rpc.server.ts): an 8 s timeout per attempt; TEST keeps
 * its public-endpoint fallback; LIVE fails closed on its dedicated endpoint.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RPC_TIMEOUT_MS, rpc } from "@/lib/solana-rpc.server";
import { LIVE_ENV, MODE_ENV_KEYS, TEST_ENV } from "./support/app-mode";

// LIVE needs the code lock open in tests that exercise it (as elsewhere).
vi.mock("@/lib/app-mode-lock", () => ({ LIVE_MODE_CODE_UNLOCKED: true }));

const DEVNET_CUSTOM = "https://solana-devnet.rpc-fixture.example/v2/key";
const MAINNET_CUSTOM = LIVE_ENV.SOLANA_RPC_URL;
const fetchMock = vi.fn<typeof fetch>();

const okBody = (result: unknown) =>
  new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }), { status: 200 });

/** A fetch that never answers until its signal aborts it. */
function hangUntilAborted(_url: unknown, init?: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(init.signal!.reason));
  });
}

function setEnv(env: Record<string, string>) {
  for (const key of MODE_ENV_KEYS) vi.stubEnv(key, "");
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
}

const calledUrls = () => fetchMock.mock.calls.map(([url]) => String(url));

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Solana RPC timeout and fallback", () => {
  it("uses an 8 second timeout per attempt", () => {
    expect(RPC_TIMEOUT_MS).toBe(8_000);
  });

  it("TEST: a failing dedicated devnet endpoint falls back once to the public one (unchanged)", async () => {
    setEnv({ ...TEST_ENV, SOLANA_DEVNET_RPC_URL: DEVNET_CUSTOM });
    fetchMock.mockResolvedValueOnce(new Response("upstream error", { status: 500 }));
    fetchMock.mockResolvedValueOnce(okBody("ok"));
    const result = await rpc<string>("devnet", "getHealth", []);
    expect(result).toEqual({ ok: true, result: "ok" });
    expect(calledUrls()).toEqual([DEVNET_CUSTOM, "https://api.devnet.solana.com"]);
  });

  it("TEST: an endpoint that never answers is aborted at the timeout, then the fallback is used", async () => {
    setEnv({ ...TEST_ENV, SOLANA_DEVNET_RPC_URL: DEVNET_CUSTOM });
    fetchMock.mockImplementationOnce(hangUntilAborted);
    fetchMock.mockResolvedValueOnce(okBody(123));
    const result = await rpc<number>("devnet", "getSlot", [], { timeoutMs: 20 });
    expect(result).toEqual({ ok: true, result: 123 });
    expect(calledUrls()).toHaveLength(2);
  });

  it("TEST: every attempt carries an abort signal", async () => {
    setEnv({ ...TEST_ENV });
    fetchMock.mockResolvedValueOnce(okBody("ok"));
    await rpc("devnet", "getHealth", []);
    expect((fetchMock.mock.calls[0]![1] as RequestInit).signal).toBeInstanceOf(AbortSignal);
  });

  it("LIVE: a failing dedicated mainnet endpoint is not retried on the public endpoint", async () => {
    setEnv({ ...LIVE_ENV });
    fetchMock.mockResolvedValueOnce(new Response("upstream error", { status: 500 }));
    const result = await rpc("mainnet-beta", "getTransaction", ["sig"]);
    expect(result).toMatchObject({ ok: false, status: 502 });
    expect(calledUrls()).toEqual([MAINNET_CUSTOM]);
  });

  it("LIVE: a timeout answers 504 and still does not fall back", async () => {
    setEnv({ ...LIVE_ENV });
    fetchMock.mockImplementationOnce(hangUntilAborted);
    const result = await rpc("mainnet-beta", "getTransaction", ["sig"], { timeoutMs: 20 });
    expect(result).toMatchObject({ ok: false, status: 504 });
    expect(calledUrls()).toEqual([MAINNET_CUSTOM]);
  });

  it("each mode still refuses the other cluster", async () => {
    setEnv({ ...TEST_ENV });
    expect(await rpc("mainnet-beta", "getHealth", [])).toMatchObject({ ok: false, status: 403 });
    setEnv({ ...LIVE_ENV });
    expect(await rpc("devnet", "getHealth", [])).toMatchObject({ ok: false, status: 403 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
