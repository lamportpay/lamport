import { MODE_PROFILES } from "./app-mode";
import { currentMode, endpointAllowed } from "./app-mode.server";
import { DEFAULT_RPC_URLS, type SolanaCluster } from "./solana-rpc";

/**
 * SOLANA_RPC_URL may list several mainnet endpoints separated by commas (12 Nov 2026):
 * LIVE tries them in order and moves to the next one when an endpoint fails or refuses
 * a method (network error, timeout, HTTP error, unreadable answer). Only endpoints the
 * deployment configured are used.
 */
export function parseRpcList(value: string | undefined): string[] {
  return (value ?? "")
    .split(/[\s,]+/)
    .map((u) => u.trim())
    .filter(Boolean);
}

/** Every configured endpoint for a cluster, in the order they are tried. */
export function resolveRpcUrls(cluster: SolanaCluster): { urls: string[]; custom: boolean } {
  const list = parseRpcList(
    process.env[
      cluster === "mainnet-beta"
        ? "SOLANA_RPC_URL"
        : cluster === "devnet"
          ? "SOLANA_DEVNET_RPC_URL"
          : "SOLANA_TESTNET_RPC_URL"
    ],
  );
  return list.length ? { urls: list, custom: true } : { urls: [DEFAULT_RPC_URLS[cluster]], custom: false };
}

/** Resolve the (first) RPC endpoint for a cluster; a custom SOLANA_RPC_URL wins for mainnet. */
export function resolveRpcUrl(cluster: SolanaCluster): { url: string; custom: boolean } {
  const custom = parseRpcList(process.env["SOLANA_RPC_URL"])[0];
  if (custom && cluster === "mainnet-beta") return { url: custom, custom: true };
  const devnetCustom = process.env["SOLANA_DEVNET_RPC_URL"];
  if (devnetCustom && cluster === "devnet") return { url: devnetCustom, custom: true };
  const testnetCustom = process.env["SOLANA_TESTNET_RPC_URL"];
  if (testnetCustom && cluster === "testnet") return { url: testnetCustom, custom: true };
  return { url: DEFAULT_RPC_URLS[cluster], custom: false };
}

/** The Solana cluster of the server's mode (TEST: devnet, LIVE: mainnet-beta). */
export function activeCluster(): SolanaCluster {
  return MODE_PROFILES[currentMode().mode].solanaCluster;
}

/** Longest one RPC attempt may take (30 Oct 2026). TEST may make a second, fallback attempt. */
export const RPC_TIMEOUT_MS = 8_000;

export async function rpc<T>(
  cluster: SolanaCluster,
  method: string,
  params: unknown[],
  options: { timeoutMs?: number } = {},
): Promise<{ ok: true; result: T } | { ok: false; error: string; status: number }> {
  const timeoutMs = options.timeoutMs ?? RPC_TIMEOUT_MS;
  // TEST MODE never reaches mainnet; LIVE MODE never reaches a test cluster.
  const mode = currentMode().mode;
  if (cluster !== MODE_PROFILES[mode].solanaCluster) {
    const reason = `${mode === "test" ? "TEST" : "LIVE"} MODE: the ${cluster} cluster is blocked.`;
    console.error("[mode] RPC refused:", reason);
    return { ok: false, error: reason, status: 403 };
  }
  if (mode === "live") {
    // LIVE: the configured endpoints only, in order, each checked by the mode guard.
    const { urls } = resolveRpcUrls(cluster);
    for (const u of urls) {
      const verdict = endpointAllowed(mode, "solana_rpc", u);
      if (!verdict.ok) {
        console.error("[mode] RPC refused:", cluster, verdict.reason);
        return { ok: false, error: verdict.reason, status: 403 };
      }
    }
    let last: RpcFailure | null = null;
    for (const [i, u] of urls.entries()) {
      const attempt = await rpcAt<T>(u, cluster, method, params, timeoutMs);
      if (attempt.ok || !attempt.retryable) return strip(attempt);
      last = attempt;
      if (i < urls.length - 1) {
        console.error(
          `[rpc] LIVE: ${cluster} endpoint ${i + 1}/${urls.length} failed (${attempt.status}) for ${method}; trying the next.`,
        );
      }
    }
    return strip(last!);
  }
  const { url, custom } = resolveRpcUrl(cluster);
  // TEST keeps the public endpoint as a fallback, so it is checked as before.
  // LIVE never falls back, so only its dedicated endpoint is checked.
  const primary = endpointAllowed(mode, "solana_rpc", url);
  const fallback =
    mode === "test" ? endpointAllowed(mode, "solana_rpc", DEFAULT_RPC_URLS[cluster]) : primary;
  if (!primary.ok || !fallback.ok) {
    const reason = !primary.ok ? primary.reason : (fallback as { reason: string }).reason;
    console.error("[mode] RPC refused:", cluster, reason);
    return { ok: false, error: reason, status: 403 };
  }
  const attempt = await rpcAt<T>(url, cluster, method, params, timeoutMs);
  if (!attempt.ok && custom && url !== DEFAULT_RPC_URLS[cluster]) {
    // TEST: a misconfigured or unreachable custom endpoint should not break the
    // cluster check — retry once on the public endpoint.
    return strip(await rpcAt<T>(DEFAULT_RPC_URLS[cluster], cluster, method, params, timeoutMs));
  }
  return strip(attempt);
}

type RpcFailure = { ok: false; error: string; status: number; retryable: boolean };

/** The public result shape (the retry flag is internal). */
function strip<T>(
  r: { ok: true; result: T } | RpcFailure,
): { ok: true; result: T } | { ok: false; error: string; status: number } {
  return r.ok ? r : { ok: false, error: r.error, status: r.status };
}

/**
 * One request to one endpoint. `retryable` is true when the endpoint itself failed
 * (network, timeout, HTTP error, unreadable answer), false for a JSON-RPC error the
 * node returned for the request (the next endpoint would answer the same).
 */
async function rpcAt<T>(
  url: string,
  cluster: SolanaCluster,
  method: string,
  params: unknown[],
  timeoutMs: number,
): Promise<{ ok: true; result: T } | RpcFailure> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    let json: { result?: T; error?: { message?: string } } | null = null;
    try {
      json = JSON.parse(text) as { result?: T; error?: { message?: string } };
    } catch {
      return {
        ok: false,
        error: `Invalid RPC response from ${cluster}.`,
        status: 502,
        retryable: true,
      };
    }
    if (!res.ok) {
      return {
        ok: false,
        error: json?.error?.message ?? `RPC request failed (${res.status}).`,
        status: 502,
        retryable: true,
      };
    }
    if (json?.error) {
      return { ok: false, error: json.error.message ?? "RPC error.", status: 502, retryable: false };
    }
    return { ok: true, result: json?.result as T };
  } catch (e) {
    if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) {
      return {
        ok: false,
        error: `The ${cluster} RPC endpoint did not answer within ${timeoutMs / 1000} s.`,
        status: 504,
        retryable: true,
      };
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : `Could not reach the ${cluster} RPC endpoint.`,
      status: 502,
      retryable: true,
    };
  }
}
