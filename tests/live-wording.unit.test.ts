import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

/**
 * LIVE wording (docs/launch/live-wording.md): once LIVE is active, the converted
 * public components must not say sandbox, devnet, simulated or DISABLED; in TEST
 * they keep saying it. The stage hook is mocked; the components render on the server.
 */
let stage: "test" | "live" = "live";
vi.mock("@/lib/launch-stage", () => ({
  useLaunchStage: () => stage,
  stageFromMatches: () => stage,
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children?: unknown }) => createElement("a", null, children as never),
}));

const FORBIDDEN = /sandbox|devnet|simulated|DISABLED|test network|no real (money|funds)/i;

async function render(load: () => Promise<Record<string, unknown>>, name: string) {
  const mod = await load();
  // Visible text only: attributes such as disabled="" are not wording.
  return renderToStaticMarkup(createElement(mod[name] as ComponentType))
    .replace(/<[^>]*>/g, " ")
    .trim();
}

const COMPONENTS: [string, () => Promise<Record<string, unknown>>][] = [
  ["HomeCapabilities", () => import("@/components/site/HomeCapabilities")],
  ["HomeBankNetwork", () => import("@/components/site/HomeBankNetwork")],
  ["HomeRegionalNetwork", () => import("@/components/site/HomeRegionalNetwork")],
  ["SupportedCorridors", () => import("@/components/site/SupportedCorridors")],
  ["VerificationJourney", () => import("@/components/site/VerificationJourney")],
  ["PaymentFlowStatus", () => import("@/components/site/PaymentFlowStatus")],
  ["TechnologyEcosystem", () => import("@/components/site/TechnologyEcosystem")],
];

describe("public wording switches with the launch stage", () => {
  for (const [name, load] of COMPONENTS) {
    it(`${name}: no sandbox wording once LIVE is active, sandbox wording in TEST`, async () => {
      stage = "live";
      const live = await render(load, name);
      expect(live.match(FORBIDDEN)?.[0] ?? null).toBeNull();
      stage = "test";
      const test = await render(load, name);
      expect(test).toMatch(/sandbox|disabled/i);
    });
  }

  it("the pre-launch popup is not shown once LIVE is active", async () => {
    stage = "live";
    expect(await render(() => import("@/components/site/LaunchPopup"), "LaunchPopup")).toBe("");
  });

  it("the payment-flow copy has no sandbox wording in LIVE", async () => {
    const { paymentFlowCopy } = await import("@/content/payment-flow");
    const live = JSON.stringify(paymentFlowCopy("live"));
    expect(live.match(FORBIDDEN)?.[0] ?? null).toBeNull();
    expect(JSON.stringify(paymentFlowCopy("test"))).toMatch(/sandbox/i);
  });
});
