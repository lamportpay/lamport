/**
 * Authentication for /api/cron/* routes: `Authorization: Bearer <secret>`.
 *
 * Accepted secrets, in this order: CRON_SECRET (what Vercel Cron sends and what
 * the Supabase pg_cron job keeps in Vault as `lamportpay_cron_secret`) and
 * CRON_SECRET_PREVIOUS (for a rotation without downtime). LOVABLE_CRON_SECRET /
 * LOVABLE_CRON_SECRET_PREVIOUS are still accepted while the site also runs on Lovable.
 *
 * Replaces the Lovable-generated src/integrations/supabase/cron-auth.ts, which only
 * read LOVABLE_CRON_SECRET and so answered 500 everywhere else.
 */
export function cronSecrets(env: Record<string, string | undefined> = process.env): string[] {
  return [
    env["CRON_SECRET"],
    env["CRON_SECRET_PREVIOUS"],
    env["LOVABLE_CRON_SECRET"],
    env["LOVABLE_CRON_SECRET_PREVIOUS"],
  ].filter((s): s is string => typeof s === "string" && s.length > 0);
}

export async function authenticateCronRequest(
  request: Request,
  env: Record<string, string | undefined> = process.env,
): Promise<Response | null> {
  const secrets = cronSecrets(env);
  if (secrets.length === 0) {
    return new Response("Cron secret not configured", { status: 503 });
  }

  const match = /^Bearer ([^\s,]+)$/.exec(request.headers.get("authorization") ?? "");
  const token = match?.[1];
  if (!token) return new Response("Unauthorized", { status: 401 });

  const { createHash, timingSafeEqual } = await import("node:crypto");
  const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();
  const provided = digest(token);
  // Compare against every secret (no early exit), in constant time per comparison.
  let ok = false;
  for (const secret of secrets) ok = timingSafeEqual(provided, digest(secret)) || ok;
  return ok ? null : new Response("Unauthorized", { status: 401 });
}
