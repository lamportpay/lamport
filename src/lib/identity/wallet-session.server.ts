/**
 * Wallet sign-in run by LamportPay's server (the backend's built-in wallet
 * provider is not available here). The browser sends the wallet's signature
 * over one plain-text message; the server checks the message, the domain, the
 * age and the Ed25519 signature, then finds or creates the account that owns
 * this wallet and returns a one-time sign-in token.
 *
 * Wallet ownership is recorded only by the server: in app_metadata (users can
 * not edit it) and in user_wallets (unique per address), so one wallet always
 * maps to one account and nobody can claim another wallet's verified status.
 */
import { allowShared } from "@/lib/payments/rate-limit.server";
import { WALLET_EMAIL_DOMAIN } from "@/lib/identity/wallet-identity";
import {
  WALLET_MESSAGE_MAX_AGE_MS,
  base58Decode,
  parseWalletSignInMessage,
} from "@/lib/identity/wallet-message";


function placeholderEmail(publicKey: Uint8Array): string {
  const hex = [...publicKey].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex}@${WALLET_EMAIL_DOMAIN}`;
}

export class WalletSignInError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

function base64Decode(value: string): Uint8Array | null {
  try {
    const bin = atob(value);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

async function verifyEd25519(publicKey: Uint8Array, signature: Uint8Array, message: Uint8Array) {
  const key = await crypto.subtle.importKey("raw", publicKey, { name: "Ed25519" }, false, [
    "verify",
  ]);
  return crypto.subtle.verify({ name: "Ed25519" }, key, signature, message);
}

export async function walletSignIn(input: {
  message: string;
  signature: string;
  requestOrigin: string | null;
}): Promise<{ tokenHash: string; address: string }> {
  const parsed = parseWalletSignInMessage(input.message);
  if (!parsed) throw new WalletSignInError("The sign-in message is not valid.");

  // The message must name the site the browser is actually on.
  let originHost: string | null = null;
  try {
    originHost = input.requestOrigin ? new URL(input.requestOrigin).host : null;
  } catch {
    originHost = null;
  }
  if (!originHost || originHost !== parsed.host || new URL(parsed.origin).host !== parsed.host) {
    throw new WalletSignInError("The sign-in message is for another site.");
  }

  const age = Date.now() - parsed.issuedAt.getTime();
  if (age > WALLET_MESSAGE_MAX_AGE_MS || age < -60_000) {
    throw new WalletSignInError("The sign-in request expired. Please try again.");
  }

  const publicKey = base58Decode(parsed.address);
  const signature = base64Decode(input.signature);
  if (!publicKey || publicKey.length !== 32 || !signature || signature.length !== 64) {
    throw new WalletSignInError("The wallet signature is not valid.");
  }
  const ok = await verifyEd25519(publicKey, signature, new TextEncoder().encode(input.message));
  if (!ok) throw new WalletSignInError("The wallet signature is not valid.", 401);

  // Each signature works once.
  if (!(await allowShared("wallet-sign-in-signature", input.signature.slice(0, 120), 1, 600))) {
    throw new WalletSignInError("This signature was already used. Please try again.", 401);
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const address = parsed.address;

  const { data: linked, error: linkError } = await supabaseAdmin
    .from("user_wallets")
    .select("user_id")
    .eq("chain", "solana")
    .eq("address", address)
    .maybeSingle();
  if (linkError) throw new WalletSignInError("Could not sign in right now.", 503);

  let userId = linked?.user_id ?? null;
  let email: string | null = null;

  if (userId) {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error || !data.user?.email) throw new WalletSignInError("Could not sign in right now.", 503);
    email = data.user.email;
    if (data.user.app_metadata?.["wallet_solana"] !== address) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: { ...data.user.app_metadata, wallet_solana: address },
      });
    }
  } else {
    email = placeholderEmail(publicKey);
    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      app_metadata: { wallet_solana: address, sign_in: "wallet" },
    });
    if (created.error || !created.data.user) {
      throw new WalletSignInError("Could not create your account right now.", 503);
    }
    userId = created.data.user.id;
    const { error: insertError } = await supabaseAdmin
      .from("user_wallets")
      .insert({ user_id: userId, chain: "solana", address, last_authenticated_at: new Date().toISOString() });
    if (insertError) throw new WalletSignInError("Could not link your wallet right now.", 503);
    await supabaseAdmin
      .from("identity_events")
      .insert({ user_id: userId, event: "wallet_linked", wallet_address: address });
  }

  if (linked) {
    await supabaseAdmin
      .from("user_wallets")
      .update({ last_authenticated_at: new Date().toISOString() })
      .eq("chain", "solana")
      .eq("address", address)
      .eq("user_id", userId);
    await supabaseAdmin
      .from("identity_events")
      .insert({ user_id: userId, event: "wallet_authenticated", wallet_address: address });
  }

  const link = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = link.data?.properties?.hashed_token;
  if (link.error || !tokenHash) throw new WalletSignInError("Could not sign in right now.", 503);
  return { tokenHash, address };
}
