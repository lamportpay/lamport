/**
 * Early access (owner decision 2026-10-15): the first FREE_SLOTS people who
 * join from the website's launch popup pay no LamportPay fee — the 2% is
 * waived for them. Payout partner and network costs still apply.
 *
 * This module is browser-safe (no server imports) so the popup, the admin page
 * and the server's fee check all read the same number and the same matching
 * rule. Signups must be passed in oldest-first order (the order they joined).
 */
export const FREE_SLOTS = 10;

/** Stored in payments.platform_fee_waiver when LamportPay charges no fee. */
export const FEE_WAIVER_REASON = "early_access";

export type EarlyAccessSignup = {
  email: string;
  /** Wallet connected when the person joined; Solana addresses are case sensitive. */
  wallet_address: string | null;
};

/**
 * The position (1 = first in line) of `identity` in the early-access list, or
 * null when the person is not one of the first FREE_SLOTS. A row matches when
 * one of the candidate wallets is exactly the wallet that joined, or the email
 * matches ignoring case.
 */
export function earlyAccessRankOf(
  signups: readonly EarlyAccessSignup[],
  identity: { wallets?: readonly (string | null | undefined)[]; email?: string | null },
): number | null {
  const wallets = (identity.wallets ?? [])
    .map((w) => w?.trim() ?? "")
    .filter((w) => w.length > 0);
  const email = (identity.email ?? "").trim().toLowerCase();
  if (wallets.length === 0 && email.length === 0) return null;
  const line = signups.slice(0, FREE_SLOTS);
  for (let i = 0; i < line.length; i++) {
    const row = line[i]!;
    const rowWallet = row.wallet_address?.trim() ?? "";
    const rowEmail = (row.email ?? "").trim().toLowerCase();
    if (rowWallet && wallets.includes(rowWallet)) return i + 1;
    if (email && rowEmail && rowEmail === email) return i + 1;
  }
  return null;
}
