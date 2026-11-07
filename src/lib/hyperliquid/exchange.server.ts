/**
 * Relay of Hyperliquid TESTNET actions signed in the customer's browser (owner
 * decision 2026-11-07). TEST MODE only; the testnet exchange endpoint only.
 *
 * The server holds no key and cannot sign or change anything: it rebuilds the
 * action in canonical form, recomputes the signed hash, recovers the signer and
 * checks it before relaying:
 * - approveAgent must be signed by the customer's own account (their wallet);
 * - an order or cancel must be signed by an agent that this customer approved
 *   through the app for that same account (tracked in hyperliquid_test_events).
 * Every relayed action is tracked; a (signer, nonce) is relayed at most once.
 */
import { assertEndpointAllowed, currentMode } from "@/lib/app-mode.server";
import type { Json } from "@/integrations/supabase/types";
import type { AuthenticatedUser } from "@/lib/payments/auth.server";
import { PaymentError } from "@/lib/payments/service.server";

import { canonicalAction, type ExchangeRequest, type RelayAction } from "./actions";
import { approveAgentDigest, l1Digest, recoverSigner, type MsgpackValue } from "./signing";
import {
  approvedAccountOf,
  DuplicateActionError,
  finishEvent,
  startEvent,
  type TestEventKind,
} from "./tracking.server";

export const HYPERLIQUID_EXCHANGE_URL = "https://api.hyperliquid-testnet.xyz/exchange";
/** A signed action older or newer than this is refused (replay window). */
export const NONCE_WINDOW_MS = 10 * 60_000;
const TIMEOUT_MS = 15_000;
const MAX_STORED_RESPONSE = 4_000;

export type RelayResult = {
  ok: boolean;
  eventId: string;
  kind: TestEventKind;
  /** Plain summary: "resting #123", "filled 10 @ 4.5", "cancelled", or Hyperliquid's error. */
  outcome: string[];
  response: unknown;
};

function kindOf(action: RelayAction): TestEventKind {
  return action.type === "approveAgent" ? "approve_agent" : action.type;
}

/** One line per order / cancel status, and whether any of them failed. */
export function summarize(body: unknown): { ok: boolean; outcome: string[] } {
  const b = body as { status?: unknown; response?: unknown } | null;
  if (!b || b.status !== "ok") {
    const msg = typeof b?.response === "string" ? b.response : "Hyperliquid refused the action.";
    return { ok: false, outcome: [msg.slice(0, 300)] };
  }
  const statuses = (b.response as { data?: { statuses?: unknown } } | undefined)?.data?.statuses;
  if (!Array.isArray(statuses)) return { ok: true, outcome: ["accepted"] };
  let ok = true;
  const outcome = statuses.map((s: unknown) => {
    if (s === "success") return "cancelled";
    const st = s as Record<string, Record<string, unknown> | string | undefined>;
    if (typeof st?.error === "string") {
      ok = false;
      return `error: ${st.error.slice(0, 300)}`;
    }
    const resting = st?.resting as { oid?: unknown } | undefined;
    if (resting) return `resting #${String(resting.oid)}`;
    const filled = st?.filled as { totalSz?: unknown; avgPx?: unknown; oid?: unknown } | undefined;
    if (filled)
      return `filled ${String(filled.totalSz)} @ ${String(filled.avgPx)} (#${String(filled.oid)})`;
    return "accepted";
  });
  return { ok, outcome };
}

function storable(body: unknown): Json {
  const text = JSON.stringify(body ?? null);
  return text.length <= MAX_STORED_RESPONSE
    ? (JSON.parse(text) as Json)
    : { truncated: true, start: text.slice(0, MAX_STORED_RESPONSE) };
}

export async function relayTestnetAction(
  user: AuthenticatedUser,
  req: ExchangeRequest,
  now: number = Date.now(),
): Promise<RelayResult> {
  if (currentMode().mode !== "test") {
    throw new PaymentError(
      "Hyperliquid test trading is available in TEST MODE only.",
      409,
      "hyperliquid_test_only",
    );
  }
  if (Math.abs(req.nonce - now) > NONCE_WINDOW_MS) {
    throw new PaymentError(
      "This signed action is too old or too new. Sign it again.",
      400,
      "stale_nonce",
    );
  }
  const action = canonicalAction(req.action);
  const account = req.account.toLowerCase();
  const kind = kindOf(action);

  let signer: string;
  let agent: string;
  try {
    if (action.type === "approveAgent") {
      if (action.nonce !== req.nonce) {
        throw new PaymentError("The approval nonce does not match.", 400, "nonce_mismatch");
      }
      signer = recoverSigner(approveAgentDigest(action), req.signature);
      agent = action.agentAddress;
    } else {
      signer = recoverSigner(l1Digest(action as unknown as MsgpackValue, req.nonce), req.signature);
      agent = signer;
    }
  } catch (e) {
    if (e instanceof PaymentError) throw e;
    throw new PaymentError("The signature could not be checked.", 400, "bad_signature");
  }

  if (action.type === "approveAgent") {
    if (signer !== account) {
      throw new PaymentError(
        "The approval was not signed by this account. Sign with the connected wallet.",
        400,
        "signature_mismatch",
      );
    }
  } else if ((await approvedAccountOf(user.id, agent)) !== account) {
    throw new PaymentError(
      "Enable test trading for this wallet first (the trading key is not approved).",
      403,
      "agent_not_approved",
    );
  }

  assertEndpointAllowed("hyperliquid_exchange", HYPERLIQUID_EXCHANGE_URL);

  let eventId: string;
  try {
    eventId = await startEvent({
      userId: user.id,
      kind,
      account,
      agent,
      signer,
      nonce: req.nonce,
      request: action as unknown as Json,
    });
  } catch (e) {
    if (e instanceof DuplicateActionError) {
      throw new PaymentError(e.message, 409, "duplicate_action");
    }
    throw e;
  }

  let body: unknown;
  try {
    const res = await fetch(HYPERLIQUID_EXCHANGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        action,
        nonce: req.nonce,
        signature: req.signature,
        vaultAddress: null,
        expiresAfter: null,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const text = await res.text();
    try {
      body = JSON.parse(text);
    } catch {
      body = {
        status: "err",
        response: `Hyperliquid answered ${res.status}: ${text.slice(0, 200)}`,
      };
    }
  } catch {
    await finishEvent(eventId, {
      ok: false,
      error: "Hyperliquid did not answer; the action may still have been applied.",
    });
    throw new PaymentError(
      "Hyperliquid testnet did not answer. Refresh the account before trying again.",
      503,
      "hyperliquid_down",
    );
  }

  const { ok, outcome } = summarize(body);
  await finishEvent(eventId, {
    ok,
    response: storable(body),
    error: ok ? null : outcome.join("; "),
  });
  return { ok, eventId, kind, outcome, response: body };
}
