import { beforeAll, describe, expect, it } from "vitest";

import { TEST_ENV } from "./support/app-mode";

/**
 * Real Solana DEVNET reads for the pending-signature check (Batch 1 review,
 * 10 Nov 2026). Read only: nothing is signed or sent. Skipped unless
 * SOLANA_DEVNET_LIVE=1, so CI never depends on the network:
 *   SOLANA_DEVNET_LIVE=1 npx vitest run tests/pending-signature.devnet.live.test.ts
 *
 * The unit tests mock getSignatureStatuses / getBlockHeight; this checks that a
 * real RPC answers the way pendingSignatureState() expects.
 */

/** The devnet transaction that carried the LamportPay fee on 5 Nov 2026 (public chain data). */
const LANDED_DEVNET_SIGNATURE =
  "2N5yruUUBFpMwwDKjASZub78Grt3dJtetmScPcu3muL6CYQR6rPwCFzHoZ8QZBLDZttvJDmfCtKxgMahnCV8yqnb";

/** A well-formed signature no cluster has ever seen (64 bytes of 0x07, base58). */
function unseenSignature(): string {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let n = 0n;
  for (let i = 0; i < 64; i++) n = (n << 8n) | 7n;
  let out = "";
  while (n > 0n) {
    out = alphabet[Number(n % 58n)] + out;
    n /= 58n;
  }
  return out;
}

describe.runIf(process.env["SOLANA_DEVNET_LIVE"] === "1")(
  "pending funding signature on Solana devnet (live, read only)",
  () => {
    beforeAll(() => {
      Object.assign(process.env, TEST_ENV);
    });
    const usdc = () => import("@/lib/solana-usdc.server");
    const rpcServer = () => import("@/lib/solana-rpc.server");

    it("reads devnet, never mainnet, in TEST MODE", async () => {
      expect((await rpcServer()).activeCluster()).toBe("devnet");
    });

    it("a transaction that landed is 'landed'", async () => {
      const { pendingSignatureState } = await usdc();
      const result = await pendingSignatureState({
        signature: LANDED_DEVNET_SIGNATURE,
        cluster: "devnet",
        expiryHeight: null,
      });
      console.log(`[devnet] landed signature -> ${JSON.stringify(result)}`);
      expect(result.state).toBe("landed");
    });

    it("an unseen signature is 'in_flight' and gets an expiry bound of the chain height + 151", async () => {
      const { pendingSignatureState, BLOCKHASH_VALIDITY_BLOCKS } = await usdc();
      const { rpc } = await rpcServer();
      const before = await rpc<number>("devnet", "getBlockHeight", [{ commitment: "confirmed" }]);
      expect(before.ok).toBe(true);
      const result = await pendingSignatureState({
        signature: unseenSignature(),
        expiryHeight: null,
        cluster: "devnet",
      });
      console.log(`[devnet] unseen signature, first check -> ${JSON.stringify(result)}`);
      expect(result.state).toBe("in_flight");
      const height = before.ok ? before.result : 0;
      expect(result.expiryHeight).toBeGreaterThanOrEqual(height + BLOCKHASH_VALIDITY_BLOCKS);
      expect(result.expiryHeight).toBeLessThan(height + BLOCKHASH_VALIDITY_BLOCKS + 100);

      // Inside the window and the margin: still in flight.
      const waiting = await pendingSignatureState({
        signature: unseenSignature(),
        expiryHeight: result.expiryHeight,
        cluster: "devnet",
      });
      expect(waiting.state).toBe("in_flight");
    });

    it("an unseen signature whose bound is long past is 'expired'", async () => {
      const { pendingSignatureState, PENDING_EXPIRY_MARGIN_BLOCKS } = await usdc();
      const { rpc } = await rpcServer();
      const now = await rpc<number>("devnet", "getBlockHeight", [{ commitment: "confirmed" }]);
      const height = now.ok ? now.result : 0;
      const result = await pendingSignatureState({
        signature: unseenSignature(),
        expiryHeight: height - PENDING_EXPIRY_MARGIN_BLOCKS - 1_000,
        cluster: "devnet",
      });
      console.log(`[devnet] unseen signature, bound long past -> ${JSON.stringify(result)}`);
      expect(result.state).toBe("expired");
    });
  },
);
