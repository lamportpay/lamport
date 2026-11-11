/**
 * Relay of Hyperliquid TESTNET actions (src/lib/hyperliquid/exchange.server.ts):
 * signer checks, agent approval tracking, replay refusal, mode gating, and the
 * mode guard for the exchange endpoint. No network: fetch is stubbed.
 */
import { hexToBytes } from "@noble/hashes/utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  mode: "test" as "test" | "live",
  events: [] as Record<string, unknown>[],
}));

vi.mock("@/lib/app-mode.server", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/app-mode.server")>();
  const status = () => ({ mode: state.mode, ok: true, problems: [] }) as never;
  return {
    ...real,
    currentMode: status,
    assertEndpointAllowed: (kind: never, url: string) => {
      const v = real.endpointAllowed(state.mode, kind, url);
      if (!v.ok) throw new real.ModeGuardError(v.reason, kind);
    },
  };
});

vi.mock("@/lib/hyperliquid/tracking.server", () => {
  class DuplicateActionError extends Error {}
  return {
    DuplicateActionError,
    startEvent: async (row: Record<string, unknown>) => {
      if (
        row.signer &&
        state.events.some((e) => e.signer === row.signer && e.nonce === row.nonce)
      ) {
        throw new DuplicateActionError("This signed action was already sent.");
      }
      const id = `ev${state.events.length + 1}`;
      state.events.push({ ...row, id, ok: null });
      return id;
    },
    finishEvent: async (id: string, outcome: Record<string, unknown>) => {
      const e = state.events.find((x) => x.id === id);
      if (e) Object.assign(e, outcome);
    },
    approvedAccountOf: async (userId: string, agent: string) =>
      (state.events.find(
        (e) =>
          e.userId === userId && e.kind === "approve_agent" && e.agent === agent && e.ok === true,
      )?.account as string | undefined) ?? null,
  };
});

import { endpointAllowed } from "@/lib/app-mode.server";
import {
  approveAgentAction,
  cancelAction,
  ExchangeRequest,
  orderAction,
} from "@/lib/hyperliquid/actions";
import {
  HYPERLIQUID_EXCHANGE_URL,
  relayTestnetAction,
  summarize,
} from "@/lib/hyperliquid/exchange.server";
import {
  addressOfPrivateKey,
  approveAgentDigest,
  l1Digest,
  signDigest,
  type MsgpackValue,
} from "@/lib/hyperliquid/signing";
import { PaymentError } from "@/lib/payments/service.server";

const USER = { id: "user-1" } as never;
const WALLET_KEY = hexToBytes("11".repeat(32));
const AGENT_KEY = hexToBytes("22".repeat(32));
const WALLET = addressOfPrivateKey(WALLET_KEY);
const AGENT = addressOfPrivateKey(AGENT_KEY);
const NOW = 1_762_500_000_000;

const fetchMock = vi.fn();

beforeEach(() => {
  state.mode = "test";
  state.events = [];
  fetchMock.mockReset();
  fetchMock.mockImplementation(
    async () => new Response(JSON.stringify({ status: "ok", response: { type: "default" } })),
  );
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

function approveRequest(nonce = NOW, signer = WALLET_KEY) {
  const action = approveAgentAction(AGENT, "0x66eee", nonce);
  return ExchangeRequest.parse({
    action,
    nonce,
    signature: signDigest(approveAgentDigest(action), signer),
    account: WALLET,
  });
}

function orderRequest(nonce = NOW + 1, key = AGENT_KEY) {
  const action = orderAction({ asset: 10000, isBuy: true, price: "4.5", size: "10", tif: "Gtc" });
  return ExchangeRequest.parse({
    action,
    nonce,
    signature: signDigest(l1Digest(action as unknown as MsgpackValue, nonce), key),
    account: WALLET,
  });
}

async function code(p: Promise<unknown>): Promise<string | undefined> {
  try {
    await p;
    return "resolved";
  } catch (e) {
    return e instanceof PaymentError ? e.code : String(e);
  }
}

describe("Hyperliquid testnet relay", () => {
  it("relays an approval signed by the account and tracks it", async () => {
    const result = await relayTestnetAction(USER, approveRequest(), NOW);
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(HYPERLIQUID_EXCHANGE_URL);
    const sent = JSON.parse((init as RequestInit).body as string);
    expect(sent.action.type).toBe("approveAgent");
    expect(sent.action.hyperliquidChain).toBe("Testnet");
    expect(sent.vaultAddress).toBeNull();
    expect(state.events[0]).toMatchObject({
      kind: "approve_agent",
      account: WALLET,
      agent: AGENT,
      signer: WALLET,
      ok: true,
    });
  });

  it("refuses an approval signed by another key", async () => {
    expect(await code(relayTestnetAction(USER, approveRequest(NOW, AGENT_KEY), NOW))).toBe(
      "signature_mismatch",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses an order from an agent the customer never approved", async () => {
    expect(await code(relayTestnetAction(USER, orderRequest(), NOW))).toBe("agent_not_approved");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("relays an order signed by the approved agent, once", async () => {
    await relayTestnetAction(USER, approveRequest(), NOW);
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: "ok",
          response: { type: "order", data: { statuses: [{ resting: { oid: 77 } }] } },
        }),
      ),
    );
    const result = await relayTestnetAction(USER, orderRequest(), NOW);
    expect(result).toMatchObject({ ok: true, kind: "order", outcome: ["resting #77"] });
    expect(await code(relayTestnetAction(USER, orderRequest(), NOW))).toBe("duplicate_action");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not let another user use someone else's agent", async () => {
    await relayTestnetAction(USER, approveRequest(), NOW);
    expect(await code(relayTestnetAction({ id: "user-2" } as never, orderRequest(), NOW))).toBe(
      "agent_not_approved",
    );
  });

  it("records Hyperliquid's refusal as a failed action", async () => {
    await relayTestnetAction(USER, approveRequest(), NOW);
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: "ok",
          response: {
            type: "order",
            data: { statuses: [{ error: "Order must have minimum value of $10." }] },
          },
        }),
      ),
    );
    const result = await relayTestnetAction(USER, orderRequest(), NOW);
    expect(result.ok).toBe(false);
    expect(state.events[1]).toMatchObject({ ok: false });
  });

  it("refuses a stale nonce", async () => {
    expect(await code(relayTestnetAction(USER, approveRequest(NOW - 11 * 60_000), NOW))).toBe(
      "stale_nonce",
    );
  });

  it("in LIVE MODE refuses a testnet approval (network follows the mode, 11 Nov 2026)", async () => {
    state.mode = "live";
    expect(await code(relayTestnetAction(USER, approveRequest(), NOW))).toBe("network_mismatch");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("in LIVE MODE relays mainnet actions to mainnet only, signed for mainnet", async () => {
    state.mode = "live";
    const approve = approveAgentAction(AGENT, "0xa4b1", NOW, "mainnet");
    expect(approve).toMatchObject({ hyperliquidChain: "Mainnet", agentName: "lamportpay" });
    const approveSig = signDigest(approveAgentDigest(approve), WALLET_KEY);
    const a = await relayTestnetAction(
      USER,
      { action: approve, nonce: NOW, signature: approveSig, account: WALLET },
      NOW,
    );
    expect(a.ok).toBe(true);
    expect(fetchMock.mock.calls[0]![0]).toBe("https://api.hyperliquid.xyz/exchange");
    expect(state.events[0]).toMatchObject({ network: "mainnet", kind: "approve_agent" });

    const order = orderAction({ asset: 10142, isBuy: true, price: "100000", size: "0.0001", tif: "Gtc" });
    const mainnetSig = signDigest(
      l1Digest(order as unknown as MsgpackValue, NOW + 1, "mainnet"),
      AGENT_KEY,
    );
    const o = await relayTestnetAction(
      USER,
      { action: order, nonce: NOW + 1, signature: mainnetSig, account: WALLET },
      NOW,
    );
    expect(o.ok).toBe(true);
    expect(fetchMock.mock.calls[1]![0]).toBe("https://api.hyperliquid.xyz/exchange");

    // An order signed for the testnet (source "b") recovers another signer on mainnet: refused.
    const testnetSig = signDigest(l1Digest(order as unknown as MsgpackValue, NOW + 2), AGENT_KEY);
    expect(
      await code(
        relayTestnetAction(
          USER,
          { action: order, nonce: NOW + 2, signature: testnetSig, account: WALLET },
          NOW,
        ),
      ),
    ).toBe("agent_not_approved");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps each network's exchange endpoint to its own mode", async () => {
    const real = await vi.importActual<typeof import("@/lib/app-mode.server")>(
      "@/lib/app-mode.server",
    );
    expect(real.endpointAllowed("test", "hyperliquid_exchange", "https://api.hyperliquid.xyz/exchange").ok).toBe(false);
    expect(real.endpointAllowed("live", "hyperliquid_exchange", HYPERLIQUID_EXCHANGE_URL).ok).toBe(false);
  });

  it("parses only order, cancel and approveAgent; no transfers, perps, builders or vaults", () => {
    const sig = { r: "0x1", s: "0x2", v: 27 };
    const base = { nonce: NOW, signature: sig, account: WALLET };
    expect(
      ExchangeRequest.safeParse({
        ...base,
        action: { type: "withdraw3", destination: WALLET, amount: "1", time: NOW },
      }).success,
    ).toBe(false);
    expect(
      ExchangeRequest.safeParse({
        ...base,
        action: { type: "usdSend", destination: WALLET, amount: "1", time: NOW },
      }).success,
    ).toBe(false);
    const perp = orderAction({ asset: 0, isBuy: true, price: "1", size: "1", tif: "Gtc" });
    expect(ExchangeRequest.safeParse({ ...base, action: perp }).success).toBe(false);
    const withBuilder = { ...orderRequest().action, builder: { b: WALLET, f: 10 } };
    expect(ExchangeRequest.safeParse({ ...base, action: withBuilder }).success).toBe(false);
    expect(
      ExchangeRequest.safeParse({ ...base, action: cancelAction(10000, 5), vaultAddress: WALLET })
        .success,
    ).toBe(false);
    // Both networks parse (the relay checks the network against the app mode), but only
    // the two LamportPay key names; a mismatched name is rebuilt canonically and fails
    // the signature check.
    const mainnetApprove = approveAgentAction(AGENT, "0xa4b1", NOW, "mainnet");
    expect(ExchangeRequest.safeParse({ ...base, action: mainnetApprove }).success).toBe(true);
    expect(
      ExchangeRequest.safeParse({ ...base, action: { ...mainnetApprove, agentName: "other" } })
        .success,
    ).toBe(false);
    expect(
      ExchangeRequest.safeParse({ ...base, action: { ...mainnetApprove, hyperliquidChain: "Devnet" } })
        .success,
    ).toBe(false);
  });

  it("summarizes Hyperliquid answers", () => {
    expect(summarize({ status: "err", response: "User or API Wallet does not exist." })).toEqual({
      ok: false,
      outcome: ["User or API Wallet does not exist."],
    });
    expect(
      summarize({
        status: "ok",
        response: {
          type: "order",
          data: { statuses: [{ filled: { totalSz: "10", avgPx: "4.5", oid: 9 } }] },
        },
      }),
    ).toEqual({ ok: true, outcome: ["filled 10 @ 4.5 (#9)"] });
    expect(
      summarize({ status: "ok", response: { type: "cancel", data: { statuses: ["success"] } } }),
    ).toEqual({ ok: true, outcome: ["cancelled"] });
  });
});

describe("mode guard: hyperliquid_exchange", () => {
  it("allows only the testnet exchange path, in TEST MODE only", () => {
    expect(endpointAllowed("test", "hyperliquid_exchange", HYPERLIQUID_EXCHANGE_URL).ok).toBe(true);
    expect(endpointAllowed("live", "hyperliquid_exchange", HYPERLIQUID_EXCHANGE_URL).ok).toBe(
      false,
    );
    expect(
      endpointAllowed("test", "hyperliquid_exchange", "https://api.hyperliquid.xyz/exchange").ok,
    ).toBe(false);
    expect(
      endpointAllowed("test", "hyperliquid_exchange", "https://api.hyperliquid-testnet.xyz/info")
        .ok,
    ).toBe(false);
  });
});
