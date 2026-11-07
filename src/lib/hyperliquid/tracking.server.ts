/**
 * Hyperliquid TESTNET test tracking: every check run, agent approval, order
 * and cancel a customer runs from the app (table hyperliquid_test_events,
 * service role only). Signatures and keys are never stored.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";

export type TestEventKind = "checks" | "approve_agent" | "order" | "cancel";

export type TestEvent = {
  id: string;
  kind: TestEventKind;
  account: string | null;
  agent: string | null;
  nonce: number | null;
  request: Json;
  ok: boolean | null;
  response: Json | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
};

const UNIQUE_VIOLATION = "23505";
const TABLE = "hyperliquid_test_events";

export class DuplicateActionError extends Error {
  constructor() {
    super("This signed action was already sent.");
    this.name = "DuplicateActionError";
  }
}

const clip = (s: string | null | undefined) => (s ? s.slice(0, 500) : null);

/** Record an action before it is sent. Throws DuplicateActionError on a reused (signer, nonce). */
export async function startEvent(row: {
  userId: string;
  kind: TestEventKind;
  account: string | null;
  agent?: string | null;
  signer?: string | null;
  nonce?: number | null;
  request: Json;
}): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert({
      user_id: row.userId,
      kind: row.kind,
      account: row.account,
      agent: row.agent ?? null,
      signer: row.signer ?? null,
      nonce: row.nonce ?? null,
      request: row.request,
    })
    .select("id")
    .single();
  if (error?.code === UNIQUE_VIOLATION) throw new DuplicateActionError();
  if (error || !data) throw new Error(`hyperliquid tracking insert failed: ${error?.message}`);
  return data.id as string;
}

/** Record the outcome of an action started with startEvent. */
export async function finishEvent(
  id: string,
  outcome: { ok: boolean; response?: Json | null; error?: string | null },
): Promise<void> {
  const { error } = await supabaseAdmin
    .from(TABLE)
    .update({
      ok: outcome.ok,
      response: outcome.response ?? null,
      error: clip(outcome.error),
      completed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("ok", null);
  if (error) console.error("[hyperliquid] tracking update failed", error.message);
}

/** The account that approved `agent` through this app for `userId`, if any. */
export async function approvedAccountOf(userId: string, agent: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("account")
    .eq("user_id", userId)
    .eq("kind", "approve_agent")
    .eq("agent", agent)
    .eq("ok", true)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(`hyperliquid tracking read failed: ${error.message}`);
  const account = (data?.[0] as { account?: string | null } | undefined)?.account;
  return account ?? null;
}

/** The customer's own test history, newest first. */
export async function listEvents(userId: string, limit = 50): Promise<TestEvent[]> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select(
      "id, kind, account, agent, nonce, request, ok, response, error, created_at, completed_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`hyperliquid tracking read failed: ${error.message}`);
  return (data ?? []).map((r) => ({
    id: r.id,
    kind: r.kind as TestEventKind,
    account: r.account,
    agent: r.agent,
    nonce: r.nonce === null ? null : Number(r.nonce),
    request: r.request,
    ok: r.ok,
    response: r.response,
    error: r.error,
    createdAt: r.created_at,
    completedAt: r.completed_at,
  }));
}
