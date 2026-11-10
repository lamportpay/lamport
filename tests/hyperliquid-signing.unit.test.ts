/**
 * Hyperliquid TESTNET signing against vectors produced by Hyperliquid's own
 * Python SDK (hyperliquid-python-sdk, utils/signing.py: action_hash,
 * sign_l1_action(is_mainnet=False), sign_agent) with a throwaway key.
 */
import { hexToBytes } from "@noble/hashes/utils";
import { describe, expect, it } from "vitest";

import { approveAgentAction, cancelAction, orderAction } from "@/lib/hyperliquid/actions";
import {
  actionHash,
  addressOfPrivateKey,
  approveAgentDigest,
  l1Digest,
  msgpackEncode,
  recoverSigner,
  signDigest,
  spotOrderProblem,
  splitSignature,
  toHex,
  toWireDecimal,
  type MsgpackValue,
} from "@/lib/hyperliquid/signing";

const KEY = hexToBytes("0123456789abcdef".repeat(4));
const ADDRESS = "0xfcad0b19bb29d4674531d6f115237e16afce377c";
const NONCE = 1762500000000;

const ORDER = orderAction({ asset: 10000, isBuy: true, price: "4.5", size: "10", tif: "Gtc" });
const CANCEL = cancelAction(10035, 44000000123);
const APPROVE = {
  ...approveAgentAction("0x1111111111111111111111111111111111111111", "0x66eee", NONCE),
};

const sameSig = (a: { r: string; s: string; v: number }, b: { r: string; s: string; v: number }) =>
  BigInt(a.r) === BigInt(b.r) && BigInt(a.s) === BigInt(b.s) && a.v === b.v;

describe("Hyperliquid signing (Python SDK vectors)", () => {
  it("derives the address of a key", () => {
    expect(addressOfPrivateKey(KEY)).toBe(ADDRESS);
  });

  it("msgpack-encodes an order exactly like msgpack.packb", () => {
    expect(toHex(msgpackEncode(ORDER as unknown as MsgpackValue))).toBe(
      "0x83a474797065a56f72646572a66f72646572739186a161cd2710a162c3a170a3342e35a173a23130a172c2a17481a56c696d697481a3746966a3477463a867726f7570696e67a26e61",
    );
  });

  it("msgpack-encodes a 64-bit order id", () => {
    expect(toHex(msgpackEncode(CANCEL as unknown as MsgpackValue))).toBe(
      "0x82a474797065a663616e63656ca763616e63656c739182a161cd2733a16fcf0000000a3e9ab87b",
    );
  });

  it("hashes actions like action_hash", () => {
    expect(toHex(actionHash(ORDER as unknown as MsgpackValue, NONCE))).toBe(
      "0xdc2023beda748ca6fd0e708ccaa72342f1b79a63c80789a4f6d363b0567c34bb",
    );
    expect(toHex(actionHash(CANCEL as unknown as MsgpackValue, NONCE))).toBe(
      "0xff41d8d7be1db3ab00ae727969488c63e7d4c8ef0b297cce43e1ba77a6811c73",
    );
  });

  it("signs L1 actions like sign_l1_action on the testnet", () => {
    const order = signDigest(l1Digest(ORDER as unknown as MsgpackValue, NONCE), KEY);
    expect(
      sameSig(order, {
        r: "0xcf09ad776bb0d553dc30d723285f1ea84316982535fbe72bf6bf7f93ddfdfc7f",
        s: "0x3a00760efc12bc84147f16a783caf2d5ae458f4114a26c56d8f3e126e2f082e7",
        v: 28,
      }),
    ).toBe(true);
    const cancel = signDigest(l1Digest(CANCEL as unknown as MsgpackValue, NONCE), KEY);
    expect(
      sameSig(cancel, {
        r: "0xa549ed240ea5c01f3c9e5daa78335e5713c472823907912a2d65fc4736cb3213",
        s: "0x56b3938289b892b8198e68cc5e25b8da50a6e418a77ce7fb0749d71d285f178",
        v: 27,
      }),
    ).toBe(true);
  });

  it("signs approveAgent like sign_agent", () => {
    const sig = signDigest(approveAgentDigest(APPROVE), KEY);
    expect(
      sameSig(sig, {
        r: "0xdbd89088c8a0e3a12adc3a32ba04d282cd3bb834a768dd0f9952d92a02f90d2a",
        s: "0x7e86cfa935ef061d3bdf334c606b06af856e459adcc5481e74aa6ddb5caf133",
        v: 28,
      }),
    ).toBe(true);
  });

  it("recovers the signer, and a different one for a changed action", () => {
    const digest = l1Digest(ORDER as unknown as MsgpackValue, NONCE);
    const sig = signDigest(digest, KEY);
    expect(recoverSigner(digest, sig)).toBe(ADDRESS);
    const changed = orderAction({
      asset: 10000,
      isBuy: true,
      price: "4.6",
      size: "10",
      tif: "Gtc",
    });
    expect(recoverSigner(l1Digest(changed as unknown as MsgpackValue, NONCE), sig)).not.toBe(
      ADDRESS,
    );
  });

  it("splits a 65-byte wallet signature", () => {
    const hex = `0x${"11".repeat(32)}${"22".repeat(32)}1c`;
    expect(splitSignature(hex)).toEqual({
      r: `0x${"11".repeat(32)}`,
      s: `0x${"22".repeat(32)}`,
      v: 28,
    });
    expect(splitSignature(`0x${"11".repeat(32)}${"22".repeat(32)}00`).v).toBe(27);
    expect(() => splitSignature("0x1234")).toThrow();
  });
});

describe("Hyperliquid number wire form and spot tick rules", () => {
  it("normalizes decimals", () => {
    expect(toWireDecimal("004.5000")).toBe("4.5");
    expect(toWireDecimal("10.")).toBe("10");
    expect(toWireDecimal(".5")).toBe("0.5");
    expect(toWireDecimal("0")).toBe("0");
    expect(toWireDecimal("1e5")).toBeNull();
    expect(toWireDecimal("-1")).toBeNull();
  });

  it("applies the 5 significant figure and decimal limits", () => {
    expect(spotOrderProblem("4.5342", "10", 0)).toBeNull();
    expect(spotOrderProblem("4.53421", "10", 0)).toMatch(/significant/);
    expect(spotOrderProblem("123456", "1", 2)).toBeNull();
    expect(spotOrderProblem("0.0000123", "1", 2)).toMatch(/decimals/);
    expect(spotOrderProblem("4.5", "10.5", 0)).toMatch(/whole number/);
    expect(spotOrderProblem("4.5", "1.25", 2)).toBeNull();
    expect(spotOrderProblem("0", "1", 2)).toMatch(/price/);
  });
});
