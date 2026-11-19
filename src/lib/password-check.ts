/**
 * Leaked-password check against HaveIBeenPwned's range API (k-anonymity: only the first five
 * hex characters of the password's SHA-1 leave the browser; padding hides the answer size).
 * Supabase's own leaked-password protection needs a paid plan, so the app does it itself
 * (docs/security/leaked-password-protection.md): a new password is refused on /auth/reset, a
 * customer who signs in with a leaked password is sent there to replace it, and an admin
 * cannot sign in with one at all.
 *
 * Returns how often the password appears in known breaches (0 = not found), or null when the
 * check could not run. Callers fail open on null: Supabase's password rules still apply.
 */
/** Where a customer goes after signing in with a password found in a breach. */
export const BREACHED_PASSWORD_RESET_PATH = "/auth/reset?reason=breached";

/** Supabase's password rules (Authentication → Email), mirrored for the form hint. */
export const PASSWORD_MIN_LENGTH = 12;

export async function passwordBreachCount(
  password: string,
  fetchImpl: typeof fetch = fetch,
): Promise<number | null> {
  try {
    const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(password));
    const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    const res = await fetchImpl(`https://api.pwnedpasswords.com/range/${hex.slice(0, 5)}`, {
      headers: { "Add-Padding": "true" },
    });
    if (!res.ok) return null;
    const suffix = hex.slice(5);
    for (const line of (await res.text()).split("\n")) {
      const [candidate, count] = line.trim().split(":");
      if (candidate === suffix) return Number(count) || 0;
    }
    return 0;
  } catch {
    return null;
  }
}
