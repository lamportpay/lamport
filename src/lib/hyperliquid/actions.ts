/**
 * The only Hyperliquid TESTNET actions LamportPay relays (owner decision
 * 2026-11-07): spot limit orders, cancels, and approving a browser agent key.
 * Transfers, withdrawals, perps, vaults, builder fees and every other action
 * are refused by the server. Builders return the canonical key order the
 * signature hash depends on (msgpack keeps insertion order).
 */
import { z } from "zod";

import { ADDRESS_RE, WIRE_DECIMAL_RE, type ApproveAgentAction } from "./signing";

/** Spot assets are 10000 + the spot pair index (Hyperliquid docs: asset ids). */
export const SPOT_ASSET_OFFSET = 10_000;
export const AGENT_NAME = "lamportpay-test";
export const TIFS = ["Gtc", "Ioc", "Alo"] as const;
export type Tif = (typeof TIFS)[number];

export type OrderWire = {
  a: number;
  b: boolean;
  p: string;
  s: string;
  r: boolean;
  t: { limit: { tif: Tif } };
};
export type OrderAction = { type: "order"; orders: OrderWire[]; grouping: "na" };
export type CancelAction = { type: "cancel"; cancels: { a: number; o: number }[] };
export type L1Action = OrderAction | CancelAction;
export type RelayAction = L1Action | ApproveAgentAction;

export function orderAction(o: {
  asset: number;
  isBuy: boolean;
  price: string;
  size: string;
  tif: Tif;
}): OrderAction {
  return {
    type: "order",
    orders: [
      { a: o.asset, b: o.isBuy, p: o.price, s: o.size, r: false, t: { limit: { tif: o.tif } } },
    ],
    grouping: "na",
  };
}

export function cancelAction(asset: number, oid: number): CancelAction {
  return { type: "cancel", cancels: [{ a: asset, o: oid }] };
}

export function approveAgentAction(
  agentAddress: string,
  signatureChainId: string,
  nonce: number,
): ApproveAgentAction {
  return {
    type: "approveAgent",
    hyperliquidChain: "Testnet",
    signatureChainId,
    agentAddress: agentAddress.toLowerCase(),
    agentName: AGENT_NAME,
    nonce,
  };
}

const spotAsset = z
  .number()
  .int()
  .min(SPOT_ASSET_OFFSET)
  .max(SPOT_ASSET_OFFSET + 99_999);
const wireDecimal = z.string().max(24).regex(WIRE_DECIMAL_RE, "Invalid decimal.");
const address = z.string().regex(ADDRESS_RE, "Invalid address.");
const nonce = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);

const OrderSchema = z
  .object({
    type: z.literal("order"),
    orders: z
      .array(
        z
          .object({
            a: spotAsset,
            b: z.boolean(),
            p: wireDecimal,
            s: wireDecimal,
            r: z.literal(false),
            t: z.object({ limit: z.object({ tif: z.enum(TIFS) }).strict() }).strict(),
          })
          .strict(),
      )
      .length(1),
    grouping: z.literal("na"),
  })
  .strict();

const CancelSchema = z
  .object({
    type: z.literal("cancel"),
    cancels: z
      .array(
        z
          .object({ a: spotAsset, o: z.number().int().positive().max(Number.MAX_SAFE_INTEGER) })
          .strict(),
      )
      .min(1)
      .max(10),
  })
  .strict();

const ApproveSchema = z
  .object({
    type: z.literal("approveAgent"),
    hyperliquidChain: z.literal("Testnet"),
    signatureChainId: z.string().regex(/^0x[0-9a-fA-F]{1,12}$/),
    agentAddress: address,
    agentName: z.literal(AGENT_NAME),
    nonce,
  })
  .strict();

const Signature = z
  .object({
    r: z.string().regex(/^0x[0-9a-fA-F]{1,64}$/),
    s: z.string().regex(/^0x[0-9a-fA-F]{1,64}$/),
    v: z.union([z.literal(27), z.literal(28)]),
  })
  .strict();

/** What the browser posts to /api/hyperliquid/exchange. */
export const ExchangeRequest = z
  .object({
    action: z.discriminatedUnion("type", [OrderSchema, CancelSchema, ApproveSchema]),
    nonce,
    signature: Signature,
    /** The customer's Hyperliquid account (their wallet address). */
    account: address,
  })
  .strict();
export type ExchangeRequest = z.infer<typeof ExchangeRequest>;

/** Rebuild the action in canonical key order (the order its hash was signed in). */
export function canonicalAction(action: ExchangeRequest["action"]): RelayAction {
  if (action.type === "order") {
    const o = action.orders[0]!;
    return orderAction({ asset: o.a, isBuy: o.b, price: o.p, size: o.s, tif: o.t.limit.tif });
  }
  if (action.type === "cancel") {
    return { type: "cancel", cancels: action.cancels.map((c) => ({ a: c.a, o: c.o })) };
  }
  return approveAgentAction(action.agentAddress, action.signatureChainId, action.nonce);
}
