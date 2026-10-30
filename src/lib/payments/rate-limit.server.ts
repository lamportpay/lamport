/**
 * Small fixed-window rate limiter for public, read-only endpoints (the /pay
 * calculator and wallet balances). Keyed by signed-in user id, else by client
 * IP. In memory, per server instance: it stops casual abuse of the partner APIs
 * but is not a global limit — the platform-wide limiter is C35 / S34 (Phase 4).
 */
const windows = new Map<string, { start: number; count: number }>();

export function clientKey(
  request: Request,
  userId: string | null,
  env: Record<string, string | undefined> = process.env,
): string {
  if (userId) return `u:${userId}`;
  // Never the first x-forwarded-for entry: behind Cloudflare the client controls it.
  return `ip:${trustedClientIp(request, env)}`;
}

/**
 * The client IP from the header the hosting platform sets and clients cannot forge:
 * Vercel overwrites x-real-ip / x-forwarded-for; Cloudflare (Lovable) overwrites
 * cf-connecting-ip but appends to a client-sent x-forwarded-for. "unknown" if absent.
 */
export function trustedClientIp(
  request: Request,
  env: Record<string, string | undefined> = process.env,
): string {
  const h = (n: string) => request.headers.get(n)?.split(",")[0]?.trim() || null;
  const ip = env["VERCEL"] ? (h("x-real-ip") ?? h("x-forwarded-for")) : h("cf-connecting-ip");
  return ip ?? "unknown";
}

/** True when the call is allowed; false when `key` used up `limit` calls in `windowMs`. */
export function allow(bucket: string, key: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const id = `${bucket}|${key}`;
  const w = windows.get(id);
  if (!w || now - w.start >= windowMs) {
    windows.set(id, { start: now, count: 1 });
    if (windows.size > 10_000) {
      for (const [k, v] of windows) if (now - v.start >= windowMs) windows.delete(k);
    }
    return true;
  }
  if (w.count >= limit) return false;
  w.count += 1;
  return true;
}

/** For tests. */
export function resetRateLimits(): void {
  windows.clear();
}

/**
 * Platform-wide limit shared by every server instance: a fixed-window counter in
 * Postgres (`rate_limit_hit`, service role only). True when the call is allowed.
 *
 * If the database cannot be reached, it falls back to this instance's in-memory
 * limiter rather than failing open completely (the payment itself would fail on
 * the same outage anyway). Every refusal is logged with the bucket.
 */
export async function allowShared(
  bucket: string,
  key: string,
  limit: number,
  windowSeconds = 60,
): Promise<boolean> {
  let allowed: boolean;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("rate_limit_hit", {
      p_bucket: bucket,
      p_key: key.slice(0, 200),
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error || typeof data !== "boolean") throw new Error(error?.message ?? "no answer");
    allowed = data;
  } catch (e) {
    console.warn(
      JSON.stringify({
        event: "rate_limit_fallback",
        bucket,
        reason: e instanceof Error ? e.message : String(e),
      }),
    );
    allowed = allow(bucket, key, limit, windowSeconds * 1000);
  }
  if (!allowed) {
    // The key is a user id or an IP; log only its kind, never the value.
    console.warn(JSON.stringify({ event: "rate_limited", bucket, key_kind: keyKind(key) }));
  }
  return allowed;
}

/**
 * "u" or "ip" for keys made by clientKey(); anything else is "other". Derived from a fixed set
 * so a raw address passed as a key ("203.0.113.9", "2001:db8::1") can never reach the logs.
 */
function keyKind(key: string): "u" | "ip" | "other" {
  if (key.startsWith("u:")) return "u";
  if (key.startsWith("ip:")) return "ip";
  return "other";
}

/** Per-minute limits for the payment API, per signed-in user. */
export const USER_LIMITS = {
  /** Every authenticated payment route (reads included, the /pay page polls every 5 s). */
  default: { bucket: "user-api", perMinute: 120 },
  createPayment: { bucket: "payment-create", perMinute: 10 },
  quote: { bucket: "payment-quote", perMinute: 20 },
  transfer: { bucket: "payment-transfer", perMinute: 10 },
  funding: { bucket: "payment-funding", perMinute: 20 },
  kyc: { bucket: "kyc", perMinute: 10 },
} as const;

export type UserLimit = { bucket: string; perMinute: number };
