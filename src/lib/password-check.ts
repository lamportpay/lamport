/**
 * Leaked-password check against HaveIBeenPwned's range API (k-anonymity: only the first five
 * hex characters of the password's SHA-1 leave the browser; padding hides the answer size).
 * Supabase's own leaked-password protection is a dashboard setting (see
 * docs/security/leaked-password-protection.md); this covers the app's own password form until
 * it is on, and keeps checking after.
 *
 * Returns how often the password appears in known breaches (0 = not found), or null when the
 * check could not run. Callers fail open on null: Supabase's password rules still apply.
 */
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
