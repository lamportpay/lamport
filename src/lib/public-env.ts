/**
 * Build-time check of the public (browser) backend configuration (31 Oct 2026, remediation R4).
 *
 * vite.config.ts used to fill missing VITE_SUPABASE_* values with Lovable Cloud's project, the
 * live site's database. Any build without them (CI, a Vercel environment missing a variable, a
 * fresh VS Code checkout) then silently pointed browsers at live customer data. There is no
 * default any more: `vite dev` and `vite build` stop with the problems this returns.
 *
 * Pure (no Node, browser or server imports) so vite.config.ts and the unit tests can use it.
 * Messages name variables, never their values.
 */
import { LIVE_SUPABASE_REF } from "./supabase-refs";

type Env = Record<string, string | undefined>;

export const PUBLIC_SUPABASE_VARS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_PROJECT_ID",
] as const;

/**
 * Non-VITE_ variables the check also reads (vite.config.ts loads them by these prefixes).
 * VERCEL_ENV is set by Vercel; the others come from the hosting environment or `.env`.
 */
export const PUBLIC_ENV_CONTEXT_VARS = [
  "VERCEL_ENV",
  "LAMPORTPAY_MODE",
  "LAMPORTPAY_SHARED_DB",
  "SUPABASE_URL",
] as const;

const PROJECT_REF = /^[a-z0-9]{20}$/;

/** The project ref of `https://<ref>.supabase.co`, or null for anything else. */
export function supabaseRefFromUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  if (parsed.username || parsed.password || parsed.port || parsed.search || parsed.hash) return null;
  if (parsed.pathname !== "/") return null;
  const match = /^([a-z0-9]{20})\.supabase\.co$/.exec(parsed.hostname);
  return match ? match[1]! : null;
}

/** The `role` claim of a JWT, or null when the value is not a readable JWT. */
function jwtRole(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload: unknown = JSON.parse(atob(padded));
    const role = (payload as { role?: unknown } | null)?.role;
    return typeof role === "string" ? role : null;
  } catch {
    return null;
  }
}

function publishableKeyProblem(key: string): string | null {
  if (key.startsWith("sb_publishable_")) return null;
  if (key.startsWith("sb_secret_")) {
    return "VITE_SUPABASE_PUBLISHABLE_KEY holds a secret key (sb_secret_...). Only the publishable key may reach the browser; rotate that secret key if it was ever built.";
  }
  const role = jwtRole(key);
  if (role === "anon") return null;
  if (role === "service_role") {
    return "VITE_SUPABASE_PUBLISHABLE_KEY holds a service-role key. Only the publishable key may reach the browser; rotate the service-role key if it was ever built.";
  }
  return "VITE_SUPABASE_PUBLISHABLE_KEY is not a Supabase publishable key (sb_publishable_... or a legacy anon key).";
}

/** Every problem with the public configuration; empty = the build may run. */
export function validatePublicEnv(env: Env): string[] {
  const value = (name: string) => (env[name] ?? "").trim();
  const problems: string[] = [];

  const missing = PUBLIC_SUPABASE_VARS.filter((name) => !value(name));
  if (missing.length > 0) {
    problems.push(
      `Missing ${missing.join(", ")}. Set them in .env for local work (see .env.example) or in the hosting environment's variables; there is no built-in default.`,
    );
  }

  const url = value("VITE_SUPABASE_URL");
  const projectId = value("VITE_SUPABASE_PROJECT_ID");
  const key = value("VITE_SUPABASE_PUBLISHABLE_KEY");

  const urlRef = url ? supabaseRefFromUrl(url) : null;
  if (url && !urlRef) {
    problems.push("VITE_SUPABASE_URL must be https://<project-ref>.supabase.co, with no path, port or query.");
  }
  const idValid = PROJECT_REF.test(projectId);
  if (projectId && !idValid) {
    problems.push("VITE_SUPABASE_PROJECT_ID must be a 20-character Supabase project ref.");
  }
  if (urlRef && idValid && urlRef !== projectId) {
    problems.push("VITE_SUPABASE_URL and VITE_SUPABASE_PROJECT_ID name different projects.");
  }

  const serverUrl = value("SUPABASE_URL");
  const serverRef = serverUrl ? supabaseRefFromUrl(serverUrl) : null;
  if (urlRef && serverRef && urlRef !== serverRef) {
    problems.push("SUPABASE_URL (server) and VITE_SUPABASE_URL (browser) name different projects.");
  }

  if (key) {
    const keyProblem = publishableKeyProblem(key);
    if (keyProblem) problems.push(keyProblem);
  }

  const usesLiveDatabase =
    urlRef === LIVE_SUPABASE_REF || projectId === LIVE_SUPABASE_REF || serverRef === LIVE_SUPABASE_REF;
  if (usesLiveDatabase) {
    if (value("VERCEL_ENV") === "preview") {
      problems.push(
        "A Vercel Preview must never use the live (Lovable Cloud) database. Point the Supabase variables at the dev project.",
      );
    } else if (value("LAMPORTPAY_SHARED_DB") !== "1") {
      problems.push(
        "The Supabase variables point at the live (Lovable Cloud) database. Only Lovable's own builds may, and only with LAMPORTPAY_SHARED_DB=1.",
      );
    }
  }

  const browserMode = value("VITE_LAMPORTPAY_MODE").toLowerCase();
  const serverMode = value("LAMPORTPAY_MODE").toLowerCase();
  if (browserMode && serverMode && browserMode !== serverMode) {
    problems.push(
      `VITE_LAMPORTPAY_MODE (${browserMode}) and LAMPORTPAY_MODE (${serverMode}) differ; set both to the same mode.`,
    );
  }

  return problems;
}
