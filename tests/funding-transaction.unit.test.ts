import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { associatedTokenAddress, buildUsdcTransferTransaction } from "@/lib/solana-usdc.server";
import { USDC_MINT } from "@/lib/tokens";

// The only network call is the blockhash; nothing is sent.
vi.mock("@/lib/solana-rpc.server", () => ({
  rpc: vi.fn(async () => ({
    ok: true,
    result: {
      value: { blockhash: Keypair.generate().publicKey.toBase58(), lastValidBlockHeight: 1 },
    },
  })),
}));

const payer = Keypair.generate().publicKey.toBase58();
const deposit = Keypair.generate().publicKey.toBase58(); // Stables' single-use deposit address
const revenue = Keypair.generate().publicKey.toBase58(); // LamportPay revenue wallet

const usdcAccountOf = (owner: string) =>
  associatedTokenAddress(new PublicKey(owner), new PublicKey(USDC_MINT)).toBase58();

/** SPL Token TransferChecked (instruction 12): amount u64 LE after the tag. */
function transfers(tx: Transaction) {
  return tx.instructions
    .filter((ix) => ix.data[0] === 12)
    .map((ix) => ({
      destination: ix.keys[2]!.pubkey.toBase58(),
      authority: ix.keys[3]!.pubkey.toBase58(),
      amount: Buffer.from(ix.data).readBigUInt64LE(1),
    }));
}

describe("funding transaction: exact deposit plus a separate LamportPay fee", () => {
  it("sends 147.00 to Stables and 3.00 to the revenue wallet, unsigned, in one transaction", async () => {
    const { transaction } = await buildUsdcTransferTransaction({
      payer,
      recipient: deposit,
      amountMinor: 147_000_000n,
      fee: { recipient: revenue, amountMinor: 3_000_000n },
    });
    const tx = Transaction.from(Buffer.from(transaction, "base64"));
    expect(tx.signatures.every((s) => s.signature === null)).toBe(true); // the server signs nothing
    expect(tx.feePayer?.toBase58()).toBe(payer);
    expect(transfers(tx)).toEqual([
      {
        destination: usdcAccountOf(deposit),
        authority: payer,
        amount: 147_000_000n,
      },
      {
        destination: usdcAccountOf(revenue),
        authority: payer,
        amount: 3_000_000n,
      },
    ]);
  });

  it("refuses a fee to the payer or to the deposit address", async () => {
    for (const recipient of [payer, deposit]) {
      await expect(
        buildUsdcTransferTransaction({
          payer,
          recipient: deposit,
          amountMinor: 147_000_000n,
          fee: { recipient, amountMinor: 3_000_000n },
        }),
      ).rejects.toThrow(/must differ from the payer and the deposit address/);
    }
  });

  it("adds no fee transfer when there is no fee (early-access waiver, fee off)", async () => {
    const { transaction } = await buildUsdcTransferTransaction({
      payer,
      recipient: deposit,
      amountMinor: 150_000_000n,
      fee: { recipient: revenue, amountMinor: 0n },
    });
    const tx = Transaction.from(Buffer.from(transaction, "base64"));
    expect(transfers(tx).map((t) => t.amount)).toEqual([150_000_000n]);
  });
});

// ------------------------------------------------ compute budget (Batch 1, 9 Nov)

const COMPUTE_BUDGET_PROGRAM = "ComputeBudget111111111111111111111111111111";

/** SetComputeUnitLimit (tag 2, u32 LE) and SetComputeUnitPrice (tag 3, u64 LE). */
function computeBudget(tx: Transaction) {
  const ixs = tx.instructions.filter((ix) => ix.programId.toBase58() === COMPUTE_BUDGET_PROGRAM);
  const data = (tag: number) => ixs.find((ix) => ix.data[0] === tag)?.data;
  const limit = data(2);
  const price = data(3);
  return {
    count: ixs.length,
    limit: limit ? Buffer.from(limit).readUInt32LE(1) : null,
    price: price ? Buffer.from(price).readBigUInt64LE(1) : null,
    first: tx.instructions
      .slice(0, 2)
      .every((ix) => ix.programId.toBase58() === COMPUTE_BUDGET_PROGRAM),
  };
}

async function buildWithFee() {
  const { transaction } = await buildUsdcTransferTransaction({
    payer,
    recipient: deposit,
    amountMinor: 147_000_000n,
    fee: { recipient: revenue, amountMinor: 3_000_000n },
  });
  return Transaction.from(Buffer.from(transaction, "base64"));
}

describe("funding transaction: compute budget (priority fee)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("adds a compute-unit limit and a modest priority fee by default, first in the transaction", async () => {
    const tx = await buildWithFee();
    expect(computeBudget(tx)).toEqual({ count: 2, limit: 120_000, price: 10_000n, first: true });
  });

  it("keeps the 2% fee transfer, the exact deposit and a single signer", async () => {
    const tx = await buildWithFee();
    expect(transfers(tx).map((t) => t.amount)).toEqual([147_000_000n, 3_000_000n]);
    expect(tx.signatures).toHaveLength(1);
    expect(tx.signatures[0]!.publicKey.toBase58()).toBe(payer);
    expect(tx.signatures.every((s) => s.signature === null)).toBe(true);
  });

  it("uses the server configuration", async () => {
    vi.stubEnv("SOLANA_COMPUTE_UNIT_LIMIT", "80000");
    vi.stubEnv("SOLANA_PRIORITY_FEE_MICROLAMPORTS", "0");
    const tx = await buildWithFee();
    expect(computeBudget(tx)).toMatchObject({ limit: 80_000, price: 0n });
  });

  for (const [name, value] of [
    ["SOLANA_COMPUTE_UNIT_LIMIT", "49999"],
    ["SOLANA_COMPUTE_UNIT_LIMIT", "400001"],
    ["SOLANA_PRIORITY_FEE_MICROLAMPORTS", "1000001"],
    ["SOLANA_PRIORITY_FEE_MICROLAMPORTS", "-5"],
    ["SOLANA_PRIORITY_FEE_MICROLAMPORTS", "1e5"],
  ] as const) {
    it(`refuses to build with ${name}=${value} (never guessed)`, async () => {
      vi.stubEnv(name, value);
      await expect(buildWithFee()).rejects.toThrow(/Invalid Solana priority fee setting/);
    });
  }
});
