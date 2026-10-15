/**
 * Who is entitled to the early-access fee waiver (owner decision 2026-10-15):
 * the first FREE_SLOTS people who joined early access from the website pay no
 * LamportPay fee. A paying customer is matched to their signup by the wallet
 * they had connected when they joined, or by the email on their account.
 *
 * The signup list holds personal details and only admins may read it through
 * the app, so this check runs with the privileged database client and returns
 * nothing but this payment's own decision (waived, and the place in line).
 *
 * A failed lookup never waives: the customer is charged the fee exactly as
 * configured rather than a fee silently disappearing for everyone.
 */
import { FREE_SLOTS, earlyAccessRankOf, type EarlyAccessSignup } from "@/lib/early-access";

import type { AuthenticatedUser } from "./auth.server";

export type FeeWaiver = {
  /** True when LamportPay's own fee is waived for this customer. */
  waived: boolean;
  /** Position in the early-access list (1 = first), when waived. */
  rank: number | null;
};

export const NO_WAIVER: FeeWaiver = { waived: false, rank: null };

/**
 * Whether this customer is one of the first FREE_SLOTS early-access signups.
 * `wallet` is the wallet the payment will actually be paid from; the account's
 * own verified wallets and its email are considered too.
 */
export async function earlyAccessWaiver(
  user: Pick<AuthenticatedUser, "email" | "wallets"> | null | undefined,
  wallet: string | null,
): Promise<FeeWaiver> {
  const wallets = [wallet, ...(user?.wallets ?? [])].filter(
    (w): w is string => typeof w === "string" && w.trim().length > 0,
  );
  const email = user?.email ?? null;
  if (wallets.length === 0 && !email) return NO_WAIVER;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("early_access_signups")
      .select("email,wallet_address")
      .order("created_at", { ascending: true })
      .limit(FREE_SLOTS);
    if (error) throw new Error(error.message);
    const rank = earlyAccessRankOf((data ?? []) as EarlyAccessSignup[], { wallets, email });
    return rank === null ? NO_WAIVER : { waived: true, rank };
  } catch (e) {
    console.error("[early-access] waiver check failed:", e instanceof Error ? e.message : e);
    return NO_WAIVER;
  }
}
