/**
 * Compute budget configuration for the mainnet funding transaction (Batch 1, 9 Nov):
 * safe defaults, strict bounds, and LIVE refusing an invalid setting.
 */
import { describe, expect, it } from "vitest";

import { evaluateMode } from "@/lib/app-mode.server";
import {
  COMPUTE_UNIT_LIMIT,
  PRIORITY_FEE_MICROLAMPORTS,
  priorityFeeConfig,
} from "@/lib/solana-priority-fee";
import { LIVE_ENV } from "./support/app-mode";

describe("Solana priority fee configuration", () => {
  it("defaults to a modest fee: 120000 units at 10000 micro-lamports (1200 lamports at most)", () => {
    expect(priorityFeeConfig({})).toEqual({
      ok: true,
      fee: { computeUnitLimit: 120_000, microLamportsPerUnit: 10_000, maxLamports: 1_200n },
    });
  });

  it("accepts values inside the bounds and rounds the lamport cost up", () => {
    expect(
      priorityFeeConfig({
        SOLANA_COMPUTE_UNIT_LIMIT: "50000",
        SOLANA_PRIORITY_FEE_MICROLAMPORTS: "1",
      }),
    ).toEqual({
      ok: true,
      fee: { computeUnitLimit: 50_000, microLamportsPerUnit: 1, maxLamports: 1n },
    });
    const max = priorityFeeConfig({
      SOLANA_COMPUTE_UNIT_LIMIT: String(COMPUTE_UNIT_LIMIT.max),
      SOLANA_PRIORITY_FEE_MICROLAMPORTS: String(PRIORITY_FEE_MICROLAMPORTS.max),
    });
    // Worst case stays tiny: 0.0004 SOL.
    expect(max).toMatchObject({ ok: true, fee: { maxLamports: 400_000n } });
  });

  for (const [name, value] of [
    ["SOLANA_COMPUTE_UNIT_LIMIT", "49999"],
    ["SOLANA_COMPUTE_UNIT_LIMIT", "400001"],
    ["SOLANA_COMPUTE_UNIT_LIMIT", "abc"],
    ["SOLANA_PRIORITY_FEE_MICROLAMPORTS", "1000001"],
    ["SOLANA_PRIORITY_FEE_MICROLAMPORTS", "1.5"],
    ["SOLANA_PRIORITY_FEE_MICROLAMPORTS", "-1"],
  ] as const) {
    it(`refuses ${name}=${value} without repeating the value`, () => {
      const result = priorityFeeConfig({ [name]: value });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain(name);
        expect(result.error).not.toContain(value);
      }
    });
  }

  it("blocks LIVE when the setting is invalid", () => {
    const s = evaluateMode({ ...LIVE_ENV, SOLANA_PRIORITY_FEE_MICROLAMPORTS: "999999999" }, true);
    expect(s).toMatchObject({ ok: false, liveAvailable: false });
    expect(s.liveBlockers.join(" ")).toMatch(/priority fee/);
  });

  it("does not affect TEST MODE", () => {
    const s = evaluateMode({ LAMPORTPAY_MODE: "test", SOLANA_PRIORITY_FEE_MICROLAMPORTS: "x" });
    expect(s).toMatchObject({ mode: "test", ok: true });
  });
});
