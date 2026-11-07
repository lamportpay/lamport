/**
 * Browser side of Hyperliquid TESTNET test trading.
 *
 * "Enable test trading" makes a fresh trading (agent) key in this browser tab
 * and asks the customer's wallet to approve it once (approveAgent). Orders and
 * cancels are then signed in the tab with that key. The key lives in memory
 * only: it is never sent to LamportPay, never stored, and is gone when the
 * tab reloads. An agent can trade but cannot withdraw or transfer funds
 * (Hyperliquid docs: API wallets).
 */
import { paymentApi } from "@/lib/payments/api-client";

import {
  approveAgentAction,
  cancelAction,
  orderAction,
  type RelayAction,
  type Tif,
} from "./actions";
import { connectEvmWallet, evmChainId, signTypedData } from "./evm-wallet";
import {
  addressOfPrivateKey,
  approveAgentDigest,
  approveAgentTypedData,
  l1Digest,
  newAgentKey,
  recoverSigner,
  signDigest,
  splitSignature,
  type HlSignature,
  type MsgpackValue,
} from "./signing";

export type TradingSession = { account: string; agent: string; key: Uint8Array };

export type RelayResult = {
  ok: boolean;
  eventId: string;
  kind: string;
  outcome: string[];
  response: unknown;
};

let lastNonce = 0;
/** Millisecond nonces, strictly increasing within the tab (Hyperliquid nonce rules). */
export function nextNonce(now = Date.now()): number {
  lastNonce = Math.max(now, lastNonce + 1);
  return lastNonce;
}

async function relay(
  action: RelayAction,
  nonce: number,
  signature: HlSignature,
  account: string,
): Promise<RelayResult> {
  const { data } = await paymentApi<RelayResult>("/api/hyperliquid/exchange", {
    method: "POST",
    body: { action, nonce, signature, account },
  });
  return data;
}

export class TradingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TradingError";
  }
}

/** One wallet signature approving a new in-tab trading key for `account`. */
export async function enableTrading(account: string): Promise<TradingSession> {
  const walletAccount = await connectEvmWallet();
  if (walletAccount !== account) {
    throw new TradingError("Your wallet switched account. Reconnect and try again.");
  }
  const key = newAgentKey();
  const agent = addressOfPrivateKey(key);
  const chain = await evmChainId();
  const nonce = nextNonce();
  const action = approveAgentAction(agent, chain, nonce);
  const signature = splitSignature(await signTypedData(account, approveAgentTypedData(action)));
  if (recoverSigner(approveAgentDigest(action), signature) !== account) {
    throw new TradingError("The wallet signed with a different account.");
  }
  const result = await relay(action, nonce, signature, account);
  if (!result.ok) throw new TradingError(result.outcome.join("; ") || "Hyperliquid refused.");
  return { account, agent, key };
}

function signL1(session: TradingSession, action: RelayAction, nonce: number): HlSignature {
  return signDigest(l1Digest(action as unknown as MsgpackValue, nonce), session.key);
}

export async function placeOrder(
  session: TradingSession,
  order: { asset: number; isBuy: boolean; price: string; size: string; tif: Tif },
): Promise<RelayResult> {
  const action = orderAction(order);
  const nonce = nextNonce();
  return relay(action, nonce, signL1(session, action, nonce), session.account);
}

export async function cancelOrder(
  session: TradingSession,
  asset: number,
  oid: number,
): Promise<RelayResult> {
  const action = cancelAction(asset, oid);
  const nonce = nextNonce();
  return relay(action, nonce, signL1(session, action, nonce), session.account);
}
