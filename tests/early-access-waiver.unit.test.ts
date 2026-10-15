import { describe, expect, it } from "vitest";

import { earlyAccessRankOf, FREE_SLOTS, type EarlyAccessSignup } from "@/lib/early-access";

/** The first FREE_SLOTS rows, in the order people joined. */
const line = (n: number, make: (i: number) => EarlyAccessSignup): EarlyAccessSignup[] =>
  Array.from({ length: n }, (_, i) => make(i + 1));

const byWallet = (i: number): EarlyAccessSignup => ({
  email: `user${i}@example.com`,
  wallet_address: `wallet${i}${"x".repeat(30)}`,
});

describe("early access fee waiver", () => {
  it("gives the fee waiver to the wallet that joined, in the order people signed up", () => {
    const signups = line(3, byWallet);
    expect(earlyAccessRankOf(signups, { wallets: [`wallet2${"x".repeat(30)}`] })).toBe(2);
    expect(earlyAccessRankOf(signups, { wallets: [`wallet3${"x".repeat(30)}`] })).toBe(3);
  });

  it("matches the email ignoring case, so a capital letter does not lose the spot", () => {
    const signups = line(2, byWallet);
    expect(earlyAccessRankOf(signups, { email: "USER2@EXAMPLE.COM" })).toBe(2);
    expect(earlyAccessRankOf(signups, { email: " user2@example.com " })).toBe(2);
  });

  it("stops at the first 10: an eleventh person pays the normal fee", () => {
    const signups = line(FREE_SLOTS + 1, byWallet);
    expect(earlyAccessRankOf(signups, { wallets: [`wallet${FREE_SLOTS}${"x".repeat(30)}`] })).toBe(
      FREE_SLOTS,
    );
    expect(
      earlyAccessRankOf(signups, { wallets: [`wallet${FREE_SLOTS + 1}${"x".repeat(30)}`] }),
    ).toBeNull();
    expect(earlyAccessRankOf(signups, { email: `user${FREE_SLOTS + 1}@example.com` })).toBeNull();
  });

  it("treats Solana addresses case-sensitively and ignores blank values", () => {
    const signups = line(1, byWallet);
    const joined = `wallet1${"x".repeat(30)}`;
    expect(earlyAccessRankOf(signups, { wallets: [joined.toUpperCase()] })).toBeNull();
    expect(earlyAccessRankOf(signups, { wallets: [`${joined} `] })).toBe(1); // trimmed
    expect(earlyAccessRankOf(signups, { wallets: [null, ""] })).toBeNull();
    expect(earlyAccessRankOf(signups, {})).toBeNull();
    expect(earlyAccessRankOf(signups, { email: "" })).toBeNull();
  });

  it("does not need a wallet when the account's email is the one that joined", () => {
    const signups = line(1, byWallet);
    expect(earlyAccessRankOf(signups, { wallets: [null], email: "user1@example.com" })).toBe(1);
  });

  it("nobody is entitled when the list is empty", () => {
    expect(earlyAccessRankOf([], { wallets: [`wallet1${"x".repeat(30)}`], email: "a@b.co" })).toBeNull();
  });
});
