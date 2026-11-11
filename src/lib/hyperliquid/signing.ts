/**
 * Hyperliquid TESTNET signing, shared by the browser (signs) and the server
 * (only recomputes hashes and recovers signer addresses: it never holds a key).
 *
 * Two signature kinds (Hyperliquid docs and its Python SDK, utils/signing.py):
 * - L1 actions (order, cancel): msgpack(action) ‖ nonce (8 bytes BE) ‖ 0x00
 *   (no vault), keccak-256 → "phantom agent" {source "b" = testnet,
 *   connectionId}, EIP-712 domain "Exchange" v1, chainId 1337. Signed by an
 *   agent (API) wallet the customer approved.
 * - User-signed actions (approveAgent): EIP-712 domain
 *   "HyperliquidSignTransaction" v1, chainId = signatureChainId (any chain the
 *   wallet is on), signed by the customer's own wallet.
 *
 * Verified against Python SDK vectors in tests/hyperliquid-signing.unit.test.ts.
 */
import { secp256k1 } from "@noble/curves/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3";
import { bytesToHex, concatBytes, hexToBytes, utf8ToBytes } from "@noble/hashes/utils";

import { HL_SOURCE, type HlNetwork } from "./network";

export const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export type HlSignature = { r: string; s: string; v: number };

export type MsgpackValue =
  null | boolean | number | string | MsgpackValue[] | { [key: string]: MsgpackValue };

// ---------------------------------------------------------------- msgpack ---

function uintBytes(value: bigint, size: number): Uint8Array {
  const out = new Uint8Array(size);
  let v = value;
  for (let i = size - 1; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}

function header(small: number, smallMax: number, codes: [number, number, number], n: number) {
  if (n <= smallMax) return Uint8Array.of(small | n);
  if (n <= 0xff && codes[0] !== 0) return Uint8Array.of(codes[0], n);
  if (n <= 0xffff) return concatBytes(Uint8Array.of(codes[1]), uintBytes(BigInt(n), 2));
  return concatBytes(Uint8Array.of(codes[2]), uintBytes(BigInt(n), 4));
}

/**
 * msgpack encoding exactly as Python's msgpack.packb (use_bin_type) for the
 * value kinds Hyperliquid actions use: maps in insertion order, arrays, UTF-8
 * strings, booleans, null and integers (smallest form). Floats are refused:
 * prices and sizes travel as strings.
 */
export function msgpackEncode(value: MsgpackValue): Uint8Array {
  if (value === null) return Uint8Array.of(0xc0);
  if (value === false) return Uint8Array.of(0xc2);
  if (value === true) return Uint8Array.of(0xc3);
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new Error("msgpack: only safe integers are supported.");
    if (value >= 0) {
      if (value < 0x80) return Uint8Array.of(value);
      if (value <= 0xff) return Uint8Array.of(0xcc, value);
      if (value <= 0xffff) return concatBytes(Uint8Array.of(0xcd), uintBytes(BigInt(value), 2));
      if (value <= 0xffffffff) return concatBytes(Uint8Array.of(0xce), uintBytes(BigInt(value), 4));
      return concatBytes(Uint8Array.of(0xcf), uintBytes(BigInt(value), 8));
    }
    if (value >= -32) return Uint8Array.of(value & 0xff);
    const twos = (bits: number) => BigInt.asUintN(bits, BigInt(value));
    if (value >= -0x80) return Uint8Array.of(0xd0, Number(twos(8)));
    if (value >= -0x8000) return concatBytes(Uint8Array.of(0xd1), uintBytes(twos(16), 2));
    if (value >= -0x80000000) return concatBytes(Uint8Array.of(0xd2), uintBytes(twos(32), 4));
    return concatBytes(Uint8Array.of(0xd3), uintBytes(twos(64), 8));
  }
  if (typeof value === "string") {
    const bytes = utf8ToBytes(value);
    return concatBytes(header(0xa0, 31, [0xd9, 0xda, 0xdb], bytes.length), bytes);
  }
  if (Array.isArray(value)) {
    return concatBytes(
      header(0x90, 15, [0, 0xdc, 0xdd], value.length),
      ...value.map(msgpackEncode),
    );
  }
  const entries = Object.entries(value);
  return concatBytes(
    header(0x80, 15, [0, 0xde, 0xdf], entries.length),
    ...entries.flatMap(([k, v]) => [msgpackEncode(k), msgpackEncode(v)]),
  );
}

// ---------------------------------------------------------------- hashing ---

export const keccak = (data: Uint8Array): Uint8Array => keccak_256(data);

const strip0x = (hex: string) => (hex.startsWith("0x") ? hex.slice(2) : hex);
export const toHex = (bytes: Uint8Array): string => `0x${bytesToHex(bytes)}`;

/** keccak(msgpack(action) ‖ nonce ‖ 0x00): no vault address, no expiry. */
export function actionHash(action: MsgpackValue, nonce: number): Uint8Array {
  if (!Number.isSafeInteger(nonce) || nonce <= 0) throw new Error("Invalid nonce.");
  return keccak(concatBytes(msgpackEncode(action), uintBytes(BigInt(nonce), 8), Uint8Array.of(0)));
}

type Field = { name: string; type: "string" | "address" | "bytes32" | "uint64" | "uint256" };

const DOMAIN_FIELDS: Field[] = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

export const AGENT_FIELDS: Field[] = [
  { name: "source", type: "string" },
  { name: "connectionId", type: "bytes32" },
];

export const APPROVE_AGENT_TYPE = "HyperliquidTransaction:ApproveAgent";
export const APPROVE_AGENT_FIELDS: Field[] = [
  { name: "hyperliquidChain", type: "string" },
  { name: "agentAddress", type: "address" },
  { name: "agentName", type: "string" },
  { name: "nonce", type: "uint64" },
];

function encodeField(type: Field["type"], value: unknown): Uint8Array {
  switch (type) {
    case "string":
      return keccak(utf8ToBytes(String(value)));
    case "bytes32": {
      const bytes = value instanceof Uint8Array ? value : hexToBytes(strip0x(String(value)));
      if (bytes.length !== 32) throw new Error("bytes32 must be 32 bytes.");
      return bytes;
    }
    case "address": {
      const a = String(value);
      if (!ADDRESS_RE.test(a)) throw new Error("Invalid address.");
      return concatBytes(new Uint8Array(12), hexToBytes(strip0x(a).toLowerCase()));
    }
    case "uint64":
    case "uint256": {
      const n = BigInt(value as number | string | bigint);
      if (n < 0n) throw new Error("Negative uint.");
      return uintBytes(n, 32);
    }
  }
}

function hashStruct(typeName: string, fields: Field[], data: Record<string, unknown>): Uint8Array {
  const typeString = `${typeName}(${fields.map((f) => `${f.type} ${f.name}`).join(",")})`;
  return keccak(
    concatBytes(
      keccak(utf8ToBytes(typeString)),
      ...fields.map((f) => encodeField(f.type, data[f.name])),
    ),
  );
}

function typedDataDigest(
  domain: { name: string; version: string; chainId: number },
  typeName: string,
  fields: Field[],
  message: Record<string, unknown>,
): Uint8Array {
  const domainHash = hashStruct("EIP712Domain", DOMAIN_FIELDS, {
    ...domain,
    verifyingContract: ZERO_ADDRESS,
  });
  return keccak(
    concatBytes(Uint8Array.of(0x19, 0x01), domainHash, hashStruct(typeName, fields, message)),
  );
}

/**
 * EIP-712 digest an agent signs for an L1 action: phantom agent source "b" on
 * the testnet, "a" on mainnet (Hyperliquid Python SDK, sign_l1_action).
 */
export function l1Digest(
  action: MsgpackValue,
  nonce: number,
  network: HlNetwork = "testnet",
): Uint8Array {
  return typedDataDigest({ name: "Exchange", version: "1", chainId: 1337 }, "Agent", AGENT_FIELDS, {
    source: HL_SOURCE[network],
    connectionId: actionHash(action, nonce),
  });
}

export type ApproveAgentAction = {
  type: "approveAgent";
  hyperliquidChain: "Testnet" | "Mainnet";
  signatureChainId: string;
  agentAddress: string;
  agentName: string;
  nonce: number;
};

/** The chain id a user-signed action names (hex string, e.g. "0x66eee"). */
export function chainIdOf(signatureChainId: string): number {
  if (!/^0x[0-9a-fA-F]{1,12}$/.test(signatureChainId)) throw new Error("Invalid signatureChainId.");
  return Number.parseInt(signatureChainId, 16);
}

export function approveAgentDomain(action: ApproveAgentAction) {
  return {
    name: "HyperliquidSignTransaction",
    version: "1",
    chainId: chainIdOf(action.signatureChainId),
    verifyingContract: ZERO_ADDRESS,
  };
}

/** EIP-712 digest the customer's wallet signs to approve an agent. */
export function approveAgentDigest(action: ApproveAgentAction): Uint8Array {
  const { name, version, chainId } = approveAgentDomain(action);
  return typedDataDigest({ name, version, chainId }, APPROVE_AGENT_TYPE, APPROVE_AGENT_FIELDS, {
    hyperliquidChain: action.hyperliquidChain,
    agentAddress: action.agentAddress,
    agentName: action.agentName,
    nonce: action.nonce,
  });
}

/** The eth_signTypedData_v4 payload for approveAgent (signed in the customer's wallet). */
export function approveAgentTypedData(action: ApproveAgentAction) {
  return {
    domain: approveAgentDomain(action),
    types: {
      EIP712Domain: DOMAIN_FIELDS,
      [APPROVE_AGENT_TYPE]: APPROVE_AGENT_FIELDS,
    },
    primaryType: APPROVE_AGENT_TYPE,
    message: {
      hyperliquidChain: action.hyperliquidChain,
      agentAddress: action.agentAddress,
      agentName: action.agentName,
      nonce: action.nonce,
    },
  };
}

// ------------------------------------------------------- keys / signatures ---

export function addressOfPublicKey(uncompressed: Uint8Array): string {
  if (uncompressed.length !== 65 || uncompressed[0] !== 4) throw new Error("Bad public key.");
  return toHex(keccak(uncompressed.slice(1)).slice(12));
}

export function addressOfPrivateKey(privateKey: Uint8Array): string {
  return addressOfPublicKey(secp256k1.getPublicKey(privateKey, false));
}

/** A fresh agent key, generated and kept in the browser only. */
export function newAgentKey(): Uint8Array {
  return secp256k1.utils.randomPrivateKey();
}

/** Sign a 32-byte digest (deterministic RFC 6979, low-s), Hyperliquid {r, s, v} form. */
export function signDigest(digest: Uint8Array, privateKey: Uint8Array): HlSignature {
  const sig = secp256k1.sign(digest, privateKey, { lowS: true });
  return {
    r: `0x${sig.r.toString(16).padStart(64, "0")}`,
    s: `0x${sig.s.toString(16).padStart(64, "0")}`,
    v: 27 + sig.recovery,
  };
}

/** A 65-byte wallet signature (0x r ‖ s ‖ v) in Hyperliquid {r, s, v} form. */
export function splitSignature(hex: string): HlSignature {
  const raw = strip0x(hex);
  if (!/^[0-9a-fA-F]{130}$/.test(raw)) throw new Error("Unexpected wallet signature.");
  let v = Number.parseInt(raw.slice(128), 16);
  if (v < 27) v += 27;
  return { r: `0x${raw.slice(0, 64)}`, s: `0x${raw.slice(64, 128)}`, v };
}

/** The address that signed `digest`, lower case; throws on a malformed signature. */
export function recoverSigner(digest: Uint8Array, signature: HlSignature): string {
  const r = BigInt(signature.r);
  const s = BigInt(signature.s);
  if (signature.v !== 27 && signature.v !== 28) throw new Error("Invalid signature v.");
  const pub = new secp256k1.Signature(r, s)
    .addRecoveryBit(signature.v - 27)
    .recoverPublicKey(digest)
    .toRawBytes(false);
  return addressOfPublicKey(pub);
}

// ------------------------------------------------------------ number wire ---

/** Hyperliquid's wire form of a decimal: no leading zeros, no trailing zeros. */
export const WIRE_DECIMAL_RE = /^(?:0|[1-9]\d*)(?:\.\d*[1-9])?$/;

/** "004.5000" → "4.5"; null when not a plain non-negative decimal. */
export function toWireDecimal(input: string): string | null {
  const v = input.trim();
  if (!/^\d+(?:\.\d+)?$|^\d+\.$|^\.\d+$/.test(v)) return null;
  let [whole = "", frac = ""] = v.split(".");
  whole = whole.replace(/^0+(?=\d)/, "") || "0";
  frac = frac.replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

const decimals = (wire: string) => (wire.includes(".") ? wire.split(".")[1]!.length : 0);
const significant = (wire: string) => wire.replace(".", "").replace(/^0+/, "").length;

/**
 * Hyperliquid spot tick rules: a price has at most 5 significant figures and
 * at most 8 − szDecimals decimals (integer prices are always allowed); a size
 * has at most szDecimals decimals. Returns a reason when a rule is broken.
 */
export function spotOrderProblem(price: string, size: string, szDecimals: number): string | null {
  if (!WIRE_DECIMAL_RE.test(price) || price === "0") return "Enter a price above 0.";
  if (!WIRE_DECIMAL_RE.test(size) || size === "0") return "Enter a size above 0.";
  if (price.includes(".") && significant(price) > 5)
    return "Price can have at most 5 significant figures.";
  if (decimals(price) > 8 - szDecimals)
    return `Price can have at most ${8 - szDecimals} decimals on this market.`;
  if (decimals(size) > szDecimals)
    return szDecimals === 0
      ? "Size must be a whole number on this market."
      : `Size can have at most ${szDecimals} decimals on this market.`;
  return null;
}
