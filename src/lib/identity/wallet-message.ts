/**
 * The plain-text message a wallet signs to sign in to LamportPay (Sign in with
 * Solana format, so Phantom/Solflare show the domain). Shared by the browser
 * (builds it) and the server (re-checks every line before trusting it).
 */
import { WALLET_SIGN_IN_STATEMENT } from "@/lib/wallet-sign-in";

export const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
/** How long a signed sign-in message stays usable. */
export const WALLET_MESSAGE_MAX_AGE_MS = 5 * 60_000;

export function buildWalletSignInMessage(input: {
  host: string;
  origin: string;
  address: string;
  issuedAt: string;
}): string {
  return [
    `${input.host} wants you to sign in with your Solana account:`,
    input.address,
    "",
    WALLET_SIGN_IN_STATEMENT,
    "",
    `URI: ${input.origin}`,
    `Issued At: ${input.issuedAt}`,
  ].join("\n");
}

export type ParsedWalletMessage = { host: string; address: string; origin: string; issuedAt: Date };

/** Parses a message built by buildWalletSignInMessage; null if it differs in any way. */
export function parseWalletSignInMessage(message: string): ParsedWalletMessage | null {
  const lines = message.split("\n");
  if (lines.length !== 7) return null;
  const head = /^(\S+) wants you to sign in with your Solana account:$/.exec(lines[0] ?? "");
  const address = lines[1] ?? "";
  const uri = /^URI: (\S+)$/.exec(lines[5] ?? "");
  const issued = /^Issued At: (\S+)$/.exec(lines[6] ?? "");
  if (!head || !uri || !issued || !SOLANA_ADDRESS.test(address)) return null;
  if (lines[2] !== "" || lines[3] !== WALLET_SIGN_IN_STATEMENT || lines[4] !== "") return null;
  const issuedAt = new Date(issued[1]!);
  if (Number.isNaN(issuedAt.getTime())) return null;
  const rebuilt = buildWalletSignInMessage({
    host: head[1]!,
    origin: uri[1]!,
    address,
    issuedAt: issued[1]!,
  });
  if (rebuilt !== message) return null;
  return { host: head[1]!, address, origin: uri[1]!, issuedAt };
}

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** Base58 (Bitcoin alphabet) decode; null on any invalid character. */
export function base58Decode(value: string): Uint8Array | null {
  let num = 0n;
  for (const ch of value) {
    const digit = BASE58.indexOf(ch);
    if (digit < 0) return null;
    num = num * 58n + BigInt(digit);
  }
  const bytes: number[] = [];
  while (num > 0n) {
    bytes.unshift(Number(num & 0xffn));
    num >>= 8n;
  }
  for (const ch of value) {
    if (ch !== "1") break;
    bytes.unshift(0);
  }
  return Uint8Array.from(bytes);
}
