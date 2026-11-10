/**
 * Security headers added to every server response (src/server.ts).
 *
 * The enforced CSP has no script/style/connect directives yet: the wallet adapters,
 * Supabase, Solana RPC and Stables' hosted KYC need a full allowlist, now on trial
 * as Content-Security-Policy-Report-Only (reportOnlyPolicy below). The enforced
 * directives restrict nothing the app loads; they stop framing (clickjacking of the
 * payment and admin pages), plugin content and base-URL hijacking.
 */
export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  "Content-Security-Policy":
    "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  // Wallet extensions and Solflare's web wallet use popups; keep them working.
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  // Browsers ignore HSTS over plain http (local development).
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
};

const SOLANA_RPC = [
  "https://api.devnet.solana.com",
  "wss://api.devnet.solana.com",
  "https://api.mainnet-beta.solana.com",
  "wss://api.mainnet-beta.solana.com",
];
// Marketing tickers and fee calculator (browser fetches).
const PRICE_FEEDS = ["https://lite-api.jup.ag", "https://api.jup.ag", "https://api.coingecko.com", "https://open.er-api.com"];
// gtag.js and its collection endpoints, only after cookie consent (GoogleAnalytics.tsx).
const GOOGLE_ANALYTICS = ["https://*.google-analytics.com", "https://*.analytics.google.com"];

/**
 * Content-Security-Policy-Report-Only (30 Oct 2026): the full policy the app is expected
 * to need. Browsers report what it would block to /api/csp-report and block nothing; the
 * enforced policy above is unchanged. Enforcing it is a separate, later decision once the
 * reports are clean. frame-ancestors is left out (ignored in report-only, enforced above).
 */
export function reportOnlyPolicy(env: Record<string, string | undefined> = process.env): string {
  let supabase: string[] = [];
  try {
    const host = new URL(env["SUPABASE_URL"] ?? env["VITE_SUPABASE_URL"] ?? "").host;
    supabase = [`https://${host}`, `wss://${host}`];
  } catch {
    /* not configured: Supabase calls then show up in the reports */
  }
  const connect = [...supabase, ...SOLANA_RPC, ...PRICE_FEEDS, "https://api.pwnedpasswords.com", "https://www.googletagmanager.com", ...GOOGLE_ANALYTICS];
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${connect.join(" ")}`,
    // Solflare's web wallet connects through its own iframe.
    "frame-src https://connect.solflare.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "report-uri /api/csp-report",
  ].join("; ");
}

let allHeaders: Array<[string, string]> | undefined;

/** The response with the security headers set (existing values are kept). */
export function withSecurityHeaders(response: Response): Response {
  allHeaders ??= [...Object.entries(SECURITY_HEADERS), ["Content-Security-Policy-Report-Only", reportOnlyPolicy()]];
  const missing = allHeaders.filter(([k]) => !response.headers.has(k));
  if (missing.length === 0) return response;
  try {
    for (const [k, v] of missing) response.headers.set(k, v);
    return response;
  } catch {
    // Immutable headers (e.g. a proxied fetch response): copy into a new response.
    const headers = new Headers(response.headers);
    for (const [k, v] of missing) headers.set(k, v);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
}
