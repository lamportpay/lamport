import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { evaluateMode } from "@/lib/app-mode.server";
import {
  DEMO_SWAP_QUOTE_ONLY_MESSAGE,
  demoSwapExecutionRefusal,
} from "@/lib/jupiter/demo-swap.server";

// Decision 2026-11-03: the public swap demonstration is quote-only in LIVE.
describe("swap demonstration is quote-only in LIVE", () => {
  it("refuses in LIVE while LIVE is still locked", () => {
    const locked = evaluateMode({ LAMPORTPAY_MODE: "live" }, false);
    expect(locked.mode).toBe("live");
    expect(demoSwapExecutionRefusal(locked)).toBe(DEMO_SWAP_QUOTE_ONLY_MESSAGE);
  });

  it("refuses in LIVE once LIVE is fully active", () => {
    const locked = evaluateMode({ LAMPORTPAY_MODE: "live" }, false);
    const active = { ...locked, ok: true, problems: [], liveAvailable: true, liveBlockers: [] };
    expect(demoSwapExecutionRefusal(active)).toBe(DEMO_SWAP_QUOTE_ONLY_MESSAGE);
  });

  it("leaves TEST to the existing mode guard (unchanged behaviour)", () => {
    const test = evaluateMode({ LAMPORTPAY_MODE: "test" }, false);
    expect(test.mode).toBe("test");
    expect(demoSwapExecutionRefusal(test)).toBeNull();
  });

  it("treats an unset mode as TEST", () => {
    expect(demoSwapExecutionRefusal(evaluateMode({}, false))).toBeNull();
  });

  for (const route of ["order", "execute"]) {
    it(`/api/jupiter/${route} checks quote-only before sign-in or any Jupiter call`, () => {
      const src = readFileSync(
        join(process.cwd(), "src/routes/api/jupiter", `${route}.ts`),
        "utf8",
      );
      const handler = src.slice(src.indexOf("POST: async"));
      const guard = handler.indexOf("demoSwapExecutionRefusal()");
      expect(guard).toBeGreaterThan(-1);
      for (const later of ["requireUser(", "request.json()", "SwapOrder("]) {
        const at = handler.indexOf(later);
        if (at > -1) expect(guard).toBeLessThan(at);
      }
      expect(handler).toMatch(/if \(quoteOnly\) return errorResponse\(quoteOnly, 403\);/);
    });
  }
});
