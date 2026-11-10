/**
 * Stablecoins (USDC, USDT) on Solana mainnet: build an unsigned transfer to a
 * deposit address and verify on-chain that a deposit arrived. The server never
 * holds keys; the user's wallet signs and sends. Both mints use the classic SPL
 * Token program and 6 decimals.
 */
import {
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

import { toMajor } from "./money";
import { priorityFeeConfig } from "./solana-priority-fee";
import { getTokenInfo, USDC_MINT } from "./tokens";
import { rpc } from "./solana-rpc.server";

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

function stablecoin(mint: string) {
  const info = getTokenInfo(mint);
  if (!info || info.decimals !== 6) throw new Error(`Unsupported payment mint ${mint}.`);
  return { key: new PublicKey(mint), symbol: info.symbol, decimals: info.decimals };
}

export type TokenBalance = {
  accountIndex: number;
  mint: string;
  owner?: string;
  uiTokenAmount: { amount: string; decimals: number; uiAmount: number | null };
};

export type TxMeta = {
  err: unknown;
  fee: number;
  preBalances: number[];
  postBalances: number[];
  preTokenBalances?: TokenBalance[];
  postTokenBalances?: TokenBalance[];
};

export type TxResult = {
  slot: number;
  blockTime: number | null;
  meta: TxMeta | null;
  transaction: {
    message: { accountKeys: unknown[]; header?: { numRequiredSignatures: number } };
  };
} | null;

/** Net change in raw token units held by `owner` (all owners if omitted) for `mint`. */
export function tokenDelta(
  pre: TokenBalance[] | undefined,
  post: TokenBalance[] | undefined,
  mint: string,
  owner?: string,
): bigint {
  const sum = (list: TokenBalance[] | undefined) =>
    (list ?? [])
      .filter((b) => b.mint === mint && (!owner || b.owner === owner))
      .reduce((acc, b) => acc + BigInt(b.uiTokenAmount.amount || "0"), 0n);
  return sum(post) - sum(pre);
}

export function isValidPublicKey(value: string): boolean {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

function tokenAta(owner: PublicKey, mint: PublicKey): PublicKey {
  const [ata] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  return ata;
}

/**
 * Associated token account of `owner` for `mint` (classic Token program): the
 * only account the funding transaction spends from, so balance reads use it too.
 */
export function associatedTokenAddress(owner: PublicKey, mint: PublicKey): PublicKey {
  return tokenAta(owner, mint);
}

function createAtaIdempotent(
  payer: PublicKey,
  ata: PublicKey,
  owner: PublicKey,
  mint: PublicKey,
): TransactionInstruction {
  return new TransactionInstruction({
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: ata, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([1]), // CreateIdempotent
  });
}

function transferChecked(
  source: PublicKey,
  mint: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  amountMinor: bigint,
  decimals: number,
): TransactionInstruction {
  const data = Buffer.alloc(10);
  data.writeUInt8(12, 0); // TransferChecked
  data.writeBigUInt64LE(amountMinor, 1);
  data.writeUInt8(decimals, 9);
  return new TransactionInstruction({
    programId: TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    data,
  });
}

/**
 * Unsigned transaction sending exactly `amountMinor` of `mint` (USDC by
 * default, or USDT) from `payer` to `recipient`'s token account, creating that
 * account if needed (payer covers the rent). With `fee`, the same transaction
 * also sends exactly `fee.amountMinor` of the same coin to LamportPay's revenue
 * wallet as a separate transfer: one signature, and the deposit to `recipient`
 * is never reduced. Returns base64 for the wallet to sign and send.
 */
export async function buildUsdcTransferTransaction(input: {
  payer: string;
  recipient: string;
  amountMinor: bigint;
  mint?: string;
  fee?: { recipient: string; amountMinor: bigint };
  /**
   * Reuse this blockhash instead of fetching a new one. With the same inputs
   * the transaction is byte-for-byte identical, so signing it twice gives the
   * same signature and Solana processes it once (two-window protection).
   */
  blockhash?: { blockhash: string; lastValidBlockHeight: number };
}): Promise<{ transaction: string; blockhash: string; lastValidBlockHeight: number }> {
  const token = stablecoin(input.mint ?? USDC_MINT);
  const payer = new PublicKey(input.payer);
  const recipient = new PublicKey(input.recipient);
  const source = tokenAta(payer, token.key);
  const destination = tokenAta(recipient, token.key);
  if (input.amountMinor <= 0n) throw new Error("Transfer amount must be positive.");
  const fee = input.fee && input.fee.amountMinor > 0n ? input.fee : null;
  if (input.fee && input.fee.amountMinor < 0n) throw new Error("Fee cannot be negative.");
  if (fee && (fee.recipient === input.recipient || fee.recipient === input.payer)) {
    throw new Error("The fee recipient must differ from the payer and the deposit address.");
  }
  // Compute budget from server configuration (validated; refuses when invalid).
  const budget = priorityFeeConfig();
  if (!budget.ok) throw new Error(`Invalid Solana priority fee setting: ${budget.error}`);

  let recent = input.blockhash;
  if (!recent) {
    const fetched = await rpc<{ value: { blockhash: string; lastValidBlockHeight: number } }>(
      "mainnet-beta",
      "getLatestBlockhash",
      [{ commitment: "confirmed" }],
    );
    if (!fetched.ok) throw new Error(fetched.error);
    recent = fetched.result.value;
  }

  const tx = new Transaction({
    feePayer: payer,
    blockhash: recent.blockhash,
    lastValidBlockHeight: recent.lastValidBlockHeight,
  }).add(
    // Paid in SOL by the payer as part of the network fee; separate from the
    // LamportPay fee, and still one signature.
    ComputeBudgetProgram.setComputeUnitLimit({ units: budget.fee.computeUnitLimit }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: budget.fee.microLamportsPerUnit }),
    createAtaIdempotent(payer, destination, recipient, token.key),
    transferChecked(source, token.key, destination, payer, input.amountMinor, token.decimals),
  );
  if (fee) {
    const feeOwner = new PublicKey(fee.recipient);
    const feeAccount = tokenAta(feeOwner, token.key);
    tx.add(
      createAtaIdempotent(payer, feeAccount, feeOwner, token.key),
      transferChecked(source, token.key, feeAccount, payer, fee.amountMinor, token.decimals),
    );
  }

  return {
    transaction: tx
      .serialize({ requireAllSignatures: false, verifySignatures: false })
      .toString("base64"),
    blockhash: recent.blockhash,
    lastValidBlockHeight: recent.lastValidBlockHeight,
  };
}

/** Current mainnet block height (confirmed); throws when Solana cannot be read. */
export async function currentBlockHeight(): Promise<number> {
  const height = await rpc<number>("mainnet-beta", "getBlockHeight", [{ commitment: "confirmed" }]);
  if (!height.ok) throw new Error(height.error);
  return height.result;
}

const MEMO_PROGRAM = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

/**
 * TEST MODE "Pay Now" transaction (devnet only): a memo naming the payment,
 * signed by the payer, plus — when the payment carries a LamportPay fee — a
 * real transfer of exactly `fee.amountMinor` devnet test USDC from the payer to
 * the revenue wallet's token account (created if missing; payer pays rent).
 * Nothing goes to the Stables deposit address: the sandbox simulates that
 * deposit. Unsigned; the user's wallet signs and sends it.
 */
export async function buildTestPaymentTransaction(input: {
  payer: string;
  memo: string;
  mint: string;
  decimals: number;
  fee: { recipient: string; amountMinor: bigint } | null;
}): Promise<{ transaction: string; lastValidBlockHeight: number }> {
  const payer = new PublicKey(input.payer);
  const fee = input.fee && input.fee.amountMinor > 0n ? input.fee : null;
  if (input.fee && input.fee.amountMinor < 0n) throw new Error("Fee cannot be negative.");
  if (fee && fee.recipient === input.payer) {
    throw new Error("The revenue wallet cannot pay its own fee.");
  }
  const blockhash = await rpc<{ value: { blockhash: string; lastValidBlockHeight: number } }>(
    "devnet",
    "getLatestBlockhash",
    [{ commitment: "confirmed" }],
  );
  if (!blockhash.ok) throw new Error(blockhash.error);

  const tx = new Transaction({
    feePayer: payer,
    blockhash: blockhash.result.value.blockhash,
    lastValidBlockHeight: blockhash.result.value.lastValidBlockHeight,
  }).add(
    new TransactionInstruction({
      programId: MEMO_PROGRAM,
      keys: [{ pubkey: payer, isSigner: true, isWritable: false }],
      data: Buffer.from(input.memo, "utf8"),
    }),
  );
  if (fee) {
    const mint = new PublicKey(input.mint);
    const feeOwner = new PublicKey(fee.recipient);
    const feeAccount = tokenAta(feeOwner, mint);
    tx.add(
      createAtaIdempotent(payer, feeAccount, feeOwner, mint),
      transferChecked(
        tokenAta(payer, mint),
        mint,
        feeAccount,
        payer,
        fee.amountMinor,
        input.decimals,
      ),
    );
  }
  return {
    transaction: tx
      .serialize({ requireAllSignatures: false, verifySignatures: false })
      .toString("base64"),
    lastValidBlockHeight: blockhash.result.value.lastValidBlockHeight,
  };
}

export type DepositVerification =
  | { status: "pending" }
  /**
   * `receivedMinor` is what the deposit address actually got in this
   * transaction (0 when nothing moved): a positive value means funds reached
   * Stables even though the deposit does not match.
   */
  | { status: "failed"; reason: string; receivedMinor: bigint }
  | {
      status: "verified";
      receivedMinor: bigint;
      /** What `feeOwner` received in this transaction (0 without one). */
      feeReceivedMinor: bigint;
      payer: string;
      slot: number;
      blockTime: number | null;
    };

/** Accounts that signed the transaction (the first `numRequiredSignatures` keys). */
function signersOf(tx: NonNullable<TxResult>): string[] {
  const { accountKeys, header } = tx.transaction.message;
  const count = header?.numRequiredSignatures ?? 0;
  return accountKeys
    .slice(0, count)
    .map((k) => (typeof k === "string" ? k : String((k as { pubkey?: unknown }).pubkey ?? "")));
}

/**
 * Check on mainnet, at `finalized` commitment, that `signature` is a
 * successful transaction in which `payer` signed and sent exactly
 * `expectedMinor` of `mint` (USDC by default, or USDT) and `depositOwner`
 * received exactly that amount. "pending" means the transaction is not
 * finalized yet.
 */
export async function verifyUsdcDeposit(input: {
  signature: string;
  depositOwner: string;
  payer: string;
  expectedMinor: bigint;
  mint?: string;
  /** LamportPay's revenue wallet, when the payment carries a fee. */
  feeOwner?: string;
}): Promise<DepositVerification> {
  const mint = input.mint ?? USDC_MINT;
  const { symbol } = stablecoin(mint);
  const tx = await rpc<TxResult>("mainnet-beta", "getTransaction", [
    input.signature,
    { maxSupportedTransactionVersion: 0, commitment: "finalized", encoding: "json" },
  ]);
  if (!tx.ok) throw new Error(tx.error);
  if (!tx.result) return { status: "pending" };

  const meta = tx.result.meta;
  if (!meta) {
    return { status: "failed", reason: "Transaction metadata is unavailable.", receivedMinor: 0n };
  }
  if (meta.err != null) {
    return { status: "failed", reason: "Transaction failed on-chain.", receivedMinor: 0n };
  }

  const delta = (owner: string) =>
    tokenDelta(meta.preTokenBalances, meta.postTokenBalances, mint, owner);
  const units = (minor: bigint) => `${toMajor(minor, "usdc")} ${symbol}`;

  const received = delta(input.depositOwner);
  if (received !== input.expectedMinor) {
    return {
      status: "failed",
      reason: `The deposit address received ${units(received)} in this transaction; exactly ${units(input.expectedMinor)} is required.`,
      receivedMinor: received > 0n ? received : 0n,
    };
  }

  if (!signersOf(tx.result).includes(input.payer)) {
    return {
      status: "failed",
      reason: "This transaction was not signed by your wallet.",
      receivedMinor: received,
    };
  }
  // The fee is recorded as received; a missing fee never hides a deposit that
  // did reach Stables (the caller flags it).
  const feeReceived =
    input.feeOwner && input.feeOwner !== input.depositOwner && input.feeOwner !== input.payer
      ? delta(input.feeOwner)
      : 0n;
  const fee = feeReceived > 0n ? feeReceived : 0n;
  const sent = -delta(input.payer);
  if (sent !== input.expectedMinor + fee) {
    return {
      status: "failed",
      reason: `Your wallet sent ${units(sent)} in this transaction; exactly ${units(input.expectedMinor + fee)} is required.`,
      receivedMinor: received,
    };
  }

  return {
    status: "verified",
    receivedMinor: received,
    feeReceivedMinor: fee,
    payer: input.payer,
    slot: tx.result.slot,
    blockTime: tx.result.blockTime,
  };
}

// ------------------------------------------- pending funding signature (9 Nov)

/**
 * Where a wallet-returned funding signature stands on mainnet:
 * - "landed": Solana knows it and it succeeded (verification decides the rest);
 * - "failed": it failed at confirmed or finalized commitment (nothing moved);
 * - "expired": Solana does not know it and it can no longer land (safe to build
 *   a new transaction);
 * - "in_flight": not known yet, or only seen at processed commitment; it could
 *   still land (do not send again).
 */
export type PendingSignatureState = "landed" | "failed" | "expired" | "in_flight";

/**
 * A blockhash can be used for 150 blocks after its own block. Every transaction
 * reported to us was sent at or before the first check, so its blockhash is no
 * newer than the chain height at that check: it can no longer land once the
 * chain passes that height + this many blocks. This holds whatever blockhash
 * the wallet used (a later build, a manual send, a wallet that refreshed it).
 */
export const BLOCKHASH_VALIDITY_BLOCKS = 151;
/**
 * Extra blocks before an unseen signature counts as expired. Signature lookups
 * and RPC nodes can lag the chain tip; about a minute of blocks keeps a
 * just-landed transaction from being misread.
 */
export const PENDING_EXPIRY_MARGIN_BLOCKS = 150;

type SignatureStatus = { err: unknown; confirmationStatus?: string | null } | null;

/**
 * Read-only RPC checks; throws when Solana cannot be read (callers refuse,
 * never guess). `expiryHeight` is the stored bound for this signature; when it
 * is null (first check) the bound is computed from the current height and
 * returned for the caller to store.
 */
export async function pendingSignatureState(input: {
  signature: string;
  expiryHeight: number | null;
  /** Payments always use mainnet; devnet only for the read-only live test. */
  cluster?: "mainnet-beta" | "devnet";
}): Promise<{ state: PendingSignatureState; expiryHeight: number | null }> {
  const cluster = input.cluster ?? "mainnet-beta";
  const statuses = await rpc<{ value: SignatureStatus[] }>(cluster, "getSignatureStatuses", [
    [input.signature],
    { searchTransactionHistory: true },
  ]);
  if (!statuses.ok) throw new Error(statuses.error);
  const status = statuses.result.value[0] ?? null;
  if (status) {
    if (status.err == null) return { state: "landed", expiryHeight: input.expiryHeight };
    // A failure seen only at processed commitment can still be replaced by the
    // cluster's final result: wait until it is confirmed.
    const settled =
      status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized";
    return { state: settled ? "failed" : "in_flight", expiryHeight: input.expiryHeight };
  }

  const height = await rpc<number>(cluster, "getBlockHeight", [{ commitment: "confirmed" }]);
  if (!height.ok) throw new Error(height.error);
  if (input.expiryHeight === null) {
    return { state: "in_flight", expiryHeight: height.result + BLOCKHASH_VALIDITY_BLOCKS };
  }
  return {
    state:
      height.result > input.expiryHeight + PENDING_EXPIRY_MARGIN_BLOCKS ? "expired" : "in_flight",
    expiryHeight: input.expiryHeight,
  };
}
