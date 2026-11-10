/**
 * Server-side TEST / LIVE mode: configuration, validation and endpoint guards.
 *
 * - The mode comes only from the server environment (LAMPORTPAY_MODE; default
 *   "test"). Nothing the browser sends can change it.
 * - Each mode must use its own configuration. A mismatch BLOCKS payments
 *   (503 mode_blocked); the server never silently falls back to the other mode.
 * - LIVE MODE needs four things: the code lock opened (app-mode-lock.ts), an
 *   owner approval recorded in the environment, a complete production
 *   configuration, and the Production deployment (VERCEL_ENV=production; a
 *   Preview or local build refuses LIVE). Until then it is unavailable.
 * - Endpoint guard: in TEST MODE no production payment endpoint is ever called
 *   (Stables production, Solana mainnet RPC, Jupiter swap orders/execution).
 *   Jupiter is mainnet-only: TEST MODE may read its price quotes (no wallet, no
 *   transaction) but can never build or send a swap.
 *   In LIVE MODE no test endpoint or test credential is used.
 */
import { LIVE_MODE_CODE_UNLOCKED } from "./app-mode-lock";
import { MODE_PROFILES, type AppMode, type ModeProfile, type ModeStatus } from "./app-mode";
import { PaymentError } from "./payments/errors";
import { DEFAULT_RPC_URLS } from "./solana-rpc";
import { priorityFeeConfig } from "./solana-priority-fee";
import { DEV_SUPABASE_REF, LIVE_SUPABASE_REF } from "./supabase-refs";

type Env = Record<string, string | undefined>;

export const STABLES_SANDBOX_HOST_MARK = "sandbox";
/** Supabase project refs (not secrets): dev/test and live. Defined in supabase-refs.ts. */
export { DEV_SUPABASE_REF, LIVE_SUPABASE_REF };

function hostOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

/** The requested mode, or an error for an unknown value (never guessed). */
export function requestedMode(env: Env = process.env): { mode: AppMode; invalid: string | null } {
  const raw = env["LAMPORTPAY_MODE"]?.trim().toLowerCase();
  if (!raw || raw === "test") return { mode: "test", invalid: null };
  if (raw === "live") return { mode: "live", invalid: null };
  // Unknown values block payments in TEST MODE rather than guessing.
  return {
    mode: "test",
    invalid: `LAMPORTPAY_MODE must be "test" or "live", not ${JSON.stringify(raw)}.`,
  };
}

function stablesUrl(env: Env): string {
  return env["STABLES_API_URL"]?.trim() || "https://api.sandbox.stables.money";
}

function isSandboxStables(env: Env): boolean {
  return (hostOf(stablesUrl(env)) ?? "").includes(STABLES_SANDBOX_HOST_MARK);
}

function testRpcUrl(env: Env): string {
  return env["SOLANA_DEVNET_RPC_URL"]?.trim() || DEFAULT_RPC_URLS.devnet;
}

function looksMainnet(url: string | undefined): boolean {
  const host = hostOf(url) ?? "";
  return host.includes("mainnet");
}

function looksTestCluster(url: string | undefined): boolean {
  const host = hostOf(url) ?? "";
  return host.includes("devnet") || host.includes("testnet");
}

/** Problems that stop TEST MODE (test must only touch test systems). */
function testProblems(env: Env): string[] {
  const problems: string[] = [];
  if (!isSandboxStables(env)) {
    problems.push("Devnet / sandbox mode must use the Stables sandbox API, not production.");
  }
  if (env["STABLES_API_KEY"]?.trim().startsWith("sti_live_")) {
    problems.push("Devnet / sandbox mode must not hold a live Stables key.");
  }
  if (looksMainnet(testRpcUrl(env))) {
    problems.push("The devnet / sandbox Solana RPC (SOLANA_DEVNET_RPC_URL) points at mainnet.");
  }
  // The team's original rule assumed two databases (dev + live). On Lovable's
  // single backend the preview and the published app share one database, so
  // TEST MODE can run against it only when the deployment explicitly
  // acknowledges that with LAMPORTPAY_SHARED_DB=1 (no other DB exists).
  const sharedDb = (env["LAMPORTPAY_SHARED_DB"] ?? "").trim() === "1";
  if (!sharedDb && (env["SUPABASE_URL"] ?? "").includes(LIVE_SUPABASE_REF)) {
    problems.push("Devnet / sandbox mode must not use the live database.");
  }
  return problems;
}

/** Everything LIVE MODE needs; empty = live could run. */
function liveBlockers(env: Env, codeUnlocked: boolean): string[] {
  const blockers: string[] = [];
  if (!codeUnlocked) {
    blockers.push("Live mode is locked in the code until the owner approves going live.");
  }
  // LIVE runs only on the Production deployment (Batch 1, 9 Nov 2026): a Preview
  // or a local build refuses LIVE even when it is given production-like values,
  // so a mis-scoped variable can never turn a Preview into a real-money app.
  // Vercel sets VERCEL_ENV itself ("production" | "preview" | "development").
  if (env["VERCEL_ENV"]?.trim() !== "production") {
    blockers.push("Live mode runs only on the Production deployment (VERCEL_ENV=production).");
  }
  const approvedBy = env["LAMPORTPAY_LIVE_APPROVED_BY"]?.trim();
  const approvedAt = env["LAMPORTPAY_LIVE_APPROVED_AT"]?.trim();
  if (!approvedBy || !approvedAt || Number.isNaN(Date.parse(approvedAt))) {
    blockers.push("No owner approval is recorded (LAMPORTPAY_LIVE_APPROVED_BY / _AT).");
  }
  if (isSandboxStables(env)) blockers.push("The production Stables API is not configured.");
  const key = env["STABLES_API_KEY"]?.trim();
  if (!key) blockers.push("No Stables API key is set.");
  else if (key.startsWith("sti_test_"))
    blockers.push("A Stables TEST key cannot be used in live mode.");
  // Stables accepts production calls only from an allowlisted IP; Vercel's outbound IPs
  // change, so LIVE needs the fixed-IP proxy (decision 2026-11-04; values never reported).
  if (!env["STABLES_PROXY_URL"]?.trim())
    blockers.push("The fixed-IP proxy for Stables (STABLES_PROXY_URL) is not set.");
  if (!env["STABLES_WEBHOOK_SECRET"]?.trim())
    blockers.push("The Stables webhook signing secret (STABLES_WEBHOOK_SECRET) is not set.");
  // The funding transaction's compute budget must be valid (never guessed).
  const budget = priorityFeeConfig(env);
  if (!budget.ok) blockers.push(`Solana priority fee configuration: ${budget.error}`);
  const mainnetRpc = env["SOLANA_RPC_URL"]?.trim();
  if (!mainnetRpc) blockers.push("A dedicated Solana mainnet RPC (SOLANA_RPC_URL) is not set.");
  else if (looksTestCluster(mainnetRpc)) blockers.push("SOLANA_RPC_URL points at a test cluster.");
  const supabase = env["SUPABASE_URL"] ?? "";
  // Decision 11 Nov 2026: until a separate production project exists, LIVE may run on the
  // current project, but only when the deployment names it explicitly.
  const currentDbForLive = env["LAMPORTPAY_LIVE_DATABASE_REF"]?.trim() === DEV_SUPABASE_REF;
  if (!supabase || (supabase.includes(DEV_SUPABASE_REF) && !currentDbForLive)) {
    blockers.push("Live mode must use the production database, not the dev project.");
  }
  if (!hostOf(env["LAMPORTPAY_LIVE_URL"]))
    blockers.push("No live app URL (LAMPORTPAY_LIVE_URL) is set.");
  return blockers;
}

/** Full, secret-free mode report. `codeUnlocked` is injectable for tests only via the lock module. */
export function evaluateMode(
  env: Env = process.env,
  codeUnlocked: boolean = LIVE_MODE_CODE_UNLOCKED,
): ModeStatus {
  const { mode, invalid } = requestedMode(env);
  const profile = MODE_PROFILES[mode];
  const live = liveBlockers(env, codeUnlocked);
  const problems = invalid ? [invalid] : mode === "test" ? testProblems(env) : live;
  const liveUrl = env["LAMPORTPAY_LIVE_URL"]?.trim() || null;
  return {
    mode,
    ok: problems.length === 0,
    problems,
    solanaCluster: profile.solanaCluster,
    stablesEnvironment: profile.stablesEnvironment,
    realFunds: profile.realFunds,
    liveAvailable: live.length === 0,
    liveBlockers: live,
    liveUrl: live.length === 0 ? liveUrl : null,
  };
}

/**
 * What anyone may see: the mode and whether it is usable. Configuration
 * details (which variable is missing) are for admins only.
 */
export function publicModeStatus(status: ModeStatus): ModeStatus {
  return {
    ...status,
    problems: status.ok ? [] : ["The server configuration does not match its mode."],
    liveBlockers: status.liveAvailable
      ? []
      : ["Production setup and owner approval are not complete."],
  };
}

export function currentMode(): ModeStatus {
  return evaluateMode(process.env);
}

/** The active profile, or a 503 when the configuration does not match the mode. */
export function requireModeProfile(status: ModeStatus = currentMode()): ModeProfile {
  if (!status.ok) {
    console.error("[mode] blocked:", status.mode, status.problems.join(" | "));
    throw new PaymentError(
      `${status.mode === "live" ? "LIVE" : "TEST"} MODE is blocked by its configuration. No payment actions are possible.`,
      503,
      "mode_blocked",
    );
  }
  return MODE_PROFILES[status.mode];
}

/** Refuse anything that could move real funds unless LIVE MODE is fully active. */
export function requireRealFundsMode(status: ModeStatus = currentMode()): void {
  const profile = requireModeProfile(status);
  if (!profile.realFunds) {
    throw new PaymentError(
      "Devnet / sandbox mode: moving real funds is impossible here. Use devnet test assets; the sandbox deposit is simulated by an admin.",
      409,
      "test_mode_no_real_funds",
    );
  }
}

export type EndpointKind =
  | "stables"
  | "solana_rpc"
  | "jupiter_quote"
  | "jupiter_order"
  | "jupiter_execute"
  | "hyperliquid_info"
  | "hyperliquid_exchange";

export class ModeGuardError extends Error {
  constructor(
    message: string,
    readonly kind: EndpointKind,
  ) {
    super(message);
    this.name = "ModeGuardError";
  }
}

/**
 * Whether calling `url` for `kind` is allowed in `mode`. TEST MODE never calls
 * a production payment endpoint; LIVE MODE never calls a test one.
 */
export function endpointAllowed(
  mode: AppMode,
  kind: EndpointKind,
  url: string,
  opts: { withWallet?: boolean } = {},
): { ok: true } | { ok: false; reason: string } {
  const host = hostOf(url) ?? "";
  if (kind === "stables") {
    const sandbox = host.includes(STABLES_SANDBOX_HOST_MARK);
    if (mode === "test" && !sandbox)
      return { ok: false, reason: "Devnet / sandbox mode: the production Stables API is blocked." };
    if (mode === "live" && sandbox)
      return { ok: false, reason: "LIVE MODE: the Stables sandbox is blocked." };
    return { ok: true };
  }
  if (kind === "solana_rpc") {
    if (mode === "test" && looksMainnet(url))
      return { ok: false, reason: "Devnet / sandbox mode: Solana mainnet RPC is blocked." };
    if (mode === "live" && looksTestCluster(url))
      return { ok: false, reason: "LIVE MODE: Solana test clusters are blocked." };
    return { ok: true };
  }
  if (kind === "hyperliquid_info") {
    // Read-only TESTNET reads only, in every mode (decision 2026-11-04): the
    // testnet's public info endpoint and nothing else. Mainnet is never
    // called; the testnet exchange endpoint is the separate
    // "hyperliquid_exchange" kind below (TEST MODE only).
    let path = "";
    try {
      path = new URL(url).pathname;
    } catch {
      // Unparseable URL: refused below.
    }
    if (host !== "api.hyperliquid-testnet.xyz" || path !== "/info")
      return {
        ok: false,
        reason: "Only Hyperliquid's read-only testnet info endpoint may be called.",
      };
    return { ok: true };
  }
  if (kind === "hyperliquid_exchange") {
    // TESTNET orders signed in the customer's own browser (owner decision
    // 2026-11-07): TEST MODE only, the testnet exchange path only. The server
    // relays an already-signed action; it holds no key and cannot sign. LIVE
    // MODE and Hyperliquid mainnet are never called.
    let path = "";
    try {
      path = new URL(url).pathname;
    } catch {
      // Unparseable URL: refused below.
    }
    if (mode !== "test")
      return { ok: false, reason: "Hyperliquid test trading is available in TEST MODE only." };
    if (host !== "api.hyperliquid-testnet.xyz" || path !== "/exchange")
      return {
        ok: false,
        reason: "Only Hyperliquid's testnet exchange endpoint may be called.",
      };
    return { ok: true };
  }
  if (isJupiterKind(kind)) {
    // Jupiter has no devnet: every Jupiter call is a mainnet call. TEST MODE
    // allows only the read-only price quote (no wallet, no transaction: nothing
    // can be signed or moved) so swap pricing, fees and price impact can be
    // tested (owner decision, 3 Oct 2026). Building an order for a wallet (a
    // real mainnet transaction) and relaying one stay blocked in TEST MODE.
    const readOnly = kind === "jupiter_quote" || (kind === "jupiter_order" && !opts.withWallet);
    if (mode === "test" && !readOnly)
      return {
        ok: false,
        reason:
          "Devnet / sandbox mode: Jupiter swap transactions run on Solana mainnet only, so building or sending one is blocked. Price quotes are read-only and allowed.",
      };
  }
  return { ok: true };
}

function isJupiterKind(kind: EndpointKind): boolean {
  return kind === "jupiter_quote" || kind === "jupiter_order" || kind === "jupiter_execute";
}

/** Throws ModeGuardError when the current mode forbids calling `url`. */
export function assertEndpointAllowed(
  kind: EndpointKind,
  url: string,
  opts: { withWallet?: boolean } = {},
  status: ModeStatus = currentMode(),
): void {
  let verdict = endpointAllowed(status.mode, kind, url, opts);
  // A mode whose configuration fails its checks (e.g. LIVE requested but not
  // approved) never reaches Jupiter, not even for a quote.
  if (
    verdict.ok &&
    (isJupiterKind(kind) || kind === "hyperliquid_info" || kind === "hyperliquid_exchange") &&
    !status.ok
  ) {
    verdict = {
      ok: false,
      reason: `${status.mode.toUpperCase()} MODE is blocked by its configuration: ${isJupiterKind(kind) ? "Jupiter" : "Hyperliquid"} is not called.`,
    };
  }
  if (!verdict.ok) {
    console.error("[mode] endpoint refused:", kind, hostOf(url), verdict.reason);
    throw new ModeGuardError(verdict.reason, kind);
  }
}
