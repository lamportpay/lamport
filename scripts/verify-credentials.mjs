#!/usr/bin/env node
// Read-only check of the credentials in an env file, for use after a rotation.
// Prints each variable's name, an 8-character fingerprint (first 8 hex of its SHA-256) and
// OK / FAIL / SKIP with a short reason. It never prints a value. Compare fingerprints with the
// rotation checklist: a new credential must not match the old fingerprint.
//
//   node --env-file=.env scripts/verify-credentials.mjs
//
// Calls (all read-only): Supabase auth settings and one REST read, Solana getGenesisHash,
// one Jupiter quote without a wallet, Stables sandbox GET /api/v1/customers. It never calls
// Stables production, never signs or sends a transaction, and changes nothing.
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const DEVNET_GENESIS = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";
const MAINNET_GENESIS = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";
const STABLES_SANDBOX_HOST = "api.sandbox.stables.money";
const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const TIMEOUT_MS = 15_000;

export const fingerprint = (value) => createHash("sha256").update(value).digest("hex").slice(0, 8);

async function call(fetchImpl, url, init = {}) {
  try {
    const res = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
    let body = "";
    try {
      body = await res.text();
    } catch {
      /* no body */
    }
    return { status: res.status, body };
  } catch (error) {
    return { status: 0, body: "", error: error instanceof Error ? error.message : String(error) };
  }
}

/** Short reason from a provider's error body; error bodies never contain the key itself. */
function reason(res) {
  if (res.status === 0) return `network error (${res.error})`;
  let message = "";
  try {
    const json = JSON.parse(res.body);
    message = json.message ?? json.msg ?? json.error ?? json.code ?? "";
  } catch {
    /* not JSON */
  }
  return `HTTP ${res.status}${message ? `: ${String(message).slice(0, 80)}` : ""}`;
}

function jwtPayload(token) {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

async function rpcGenesis(fetchImpl, url) {
  const res = await call(fetchImpl, url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getGenesisHash" }),
  });
  if (res.status !== 200) return { res };
  try {
    return { res, genesis: JSON.parse(res.body).result };
  } catch {
    return { res };
  }
}

export async function checkCredentials(env, fetchImpl = fetch) {
  const results = [];
  const add = (name, status, detail) =>
    results.push({ name, status, fingerprint: env[name] ? fingerprint(env[name]) : "-", detail });
  const missing = (name) => {
    if (env[name]) return false;
    add(name, "SKIP", "not set");
    return true;
  };

  // Supabase
  const supabaseUrl = env.SUPABASE_URL?.replace(/\/+$/, "");
  if (!missing("SUPABASE_URL")) add("SUPABASE_URL", "OK", `host ${new URL(supabaseUrl).host}`);
  if (supabaseUrl && !missing("SUPABASE_PUBLISHABLE_KEY")) {
    const key = env.SUPABASE_PUBLISHABLE_KEY;
    const res = await call(fetchImpl, `${supabaseUrl}/auth/v1/settings`, { headers: { apikey: key } });
    add("SUPABASE_PUBLISHABLE_KEY", res.status === 200 ? "OK" : "FAIL", res.status === 200 ? "accepted by the project" : reason(res));
  }
  for (const [vite, server] of [
    ["VITE_SUPABASE_URL", "SUPABASE_URL"],
    ["VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_PUBLISHABLE_KEY"],
  ]) {
    if (env[vite] && env[server]) add(vite, env[vite] === env[server] ? "OK" : "FAIL", env[vite] === env[server] ? `same as ${server}` : `differs from ${server}`);
  }
  if (supabaseUrl && !missing("SUPABASE_SERVICE_ROLE_KEY")) {
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    const headers = { apikey: key };
    let problem = null;
    if (key.startsWith("sb_publishable_")) problem = "this is a publishable key, not a secret key";
    else if (key.startsWith("eyJ")) {
      const claims = jwtPayload(key);
      const ref = new URL(supabaseUrl).host.split(".")[0];
      if (claims?.role !== "service_role") problem = `JWT role is ${claims?.role ?? "unknown"}, not service_role`;
      else if (claims?.ref && claims.ref !== ref) problem = "JWT belongs to a different project";
      headers.Authorization = `Bearer ${key}`;
    } else if (!key.startsWith("sb_secret_")) problem = "not a Supabase secret key (expected sb_secret_…)";
    if (problem) add("SUPABASE_SERVICE_ROLE_KEY", "FAIL", problem);
    else {
      const res = await call(fetchImpl, `${supabaseUrl}/rest/v1/business_settings?select=*&limit=1`, { headers });
      add("SUPABASE_SERVICE_ROLE_KEY", res.status === 200 ? "OK" : "FAIL", res.status === 200 ? `server read accepted (${key.slice(0, 15)}…)` : reason(res));
    }
  }

  // Solana RPC (Alchemy). The URL's path holds the API key, so only the host is shown.
  for (const [name, expected, label] of [
    ["SOLANA_DEVNET_RPC_URL", DEVNET_GENESIS, "devnet"],
    ["SOLANA_RPC_URL", MAINNET_GENESIS, "mainnet (LIVE only; read-only call)"],
  ]) {
    if (missing(name)) continue;
    const { res, genesis } = await rpcGenesis(fetchImpl, env[name]);
    const host = new URL(env[name]).host;
    if (genesis === expected) add(name, "OK", `${label} via ${host}`);
    else if (genesis) add(name, "FAIL", `${host} answers for a different cluster than ${label}`);
    else add(name, "FAIL", `${host}: ${reason(res)}`);
  }

  // Jupiter: one quote without a wallet (no transaction is built).
  if (!missing("JUPITER_API_KEY")) {
    const url = `https://api.jup.ag/swap/v2/order?inputMint=${SOL_MINT}&outputMint=${USDC_MINT}&amount=1000000&swapMode=ExactIn`;
    const res = await call(fetchImpl, url, { headers: { "x-api-key": env.JUPITER_API_KEY } });
    add("JUPITER_API_KEY", res.status === 200 ? "OK" : "FAIL", res.status === 200 ? "quote accepted" : reason(res));
  }

  // Stables: sandbox only.
  const stablesUrl = (env.STABLES_API_URL || `https://${STABLES_SANDBOX_HOST}`).replace(/\/+$/, "");
  const sandbox = new URL(stablesUrl).host === STABLES_SANDBOX_HOST;
  if (!missing("STABLES_API_KEY")) {
    if (!sandbox) add("STABLES_API_KEY", "SKIP", "STABLES_API_URL is not the sandbox: this script never calls Stables production");
    else if (env.STABLES_API_KEY.startsWith("sti_live_")) add("STABLES_API_KEY", "FAIL", "a live key with the sandbox URL");
    else {
      const res = await call(fetchImpl, `${stablesUrl}/api/v1/customers`, {
        headers: { Authorization: `Bearer ${env.STABLES_API_KEY}`, Accept: "application/json" },
      });
      add("STABLES_API_KEY", res.status === 200 ? "OK" : "FAIL", res.status === 200 ? "sandbox read accepted" : reason(res));
    }
  }
  if (!missing("STABLES_WEBHOOK_SECRET")) {
    const raw = env.STABLES_WEBHOOK_SECRET;
    const bytes = Buffer.from(raw.startsWith("whsec_") ? raw.slice(6) : raw, "base64").length;
    const ok = raw.startsWith("whsec_") && bytes >= 24;
    add("STABLES_WEBHOOK_SECRET", ok ? "OK" : "FAIL", ok ? "format valid; confirm with a test event from the Stables dashboard" : "expected whsec_ followed by base64 (24+ bytes)");
  }

  // Cron
  if (!missing("CRON_SECRET")) {
    if (env.CRON_SECRET.length < 32) add("CRON_SECRET", "FAIL", "shorter than 32 characters");
    else if (env.CRON_SECRET_PREVIOUS && env.CRON_SECRET === env.CRON_SECRET_PREVIOUS) add("CRON_SECRET", "FAIL", "same as CRON_SECRET_PREVIOUS");
    else add("CRON_SECRET", "OK", `${env.CRON_SECRET.length} characters`);
  }
  return results;
}

async function main() {
  const results = await checkCredentials(process.env);
  const width = Math.max(...results.map((r) => r.name.length));
  console.log(`${"Variable".padEnd(width)}  Status  Fingerprint  Detail`);
  for (const r of results) console.log(`${r.name.padEnd(width)}  ${r.status.padEnd(6)}  ${r.fingerprint.padEnd(11)}  ${r.detail}`);
  const failed = results.filter((r) => r.status === "FAIL").length;
  console.log(failed ? `\n${failed} check(s) failed.` : "\nAll checks passed or skipped.");
  process.exitCode = failed ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) await main();
