import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { describe, expect, it, vi } from "vitest";

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
