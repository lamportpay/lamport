import { describe, expect, it, vi } from "vitest";

// @ts-expect-error -- plain ESM script without types
import { checkCredentials, fingerprint } from "../scripts/verify-credentials.mjs";

type Result = { name: string; status: string; fingerprint: string; detail: string };

const ENV = {
  SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_TESTONLYpublishable0000",
  VITE_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_TESTONLYpublishable0000",
  SUPABASE_SERVICE_ROLE_KEY: "sb_secret_TESTONLYsecretvalue000000",
  SOLANA_DEVNET_RPC_URL: "https://solana-devnet.example-rpc.test/v2/TESTONLYdevnetkey",
  SOLANA_RPC_URL: "https://solana-mainnet.example-rpc.test/v2/TESTONLYmainnetkey",
  JUPITER_API_KEY: "TESTONLYjupiterkey00000000",
  STABLES_API_URL: "https://api.sandbox.stables.money",
  STABLES_API_KEY: "sti_test_TESTONLYstableskey000",
  STABLES_WEBHOOK_SECRET: `whsec_${Buffer.alloc(32, 7).toString("base64")}`,
  CRON_SECRET: "c".repeat(64),
};

function router(overrides: Record<string, () => Response> = {}) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    for (const [part, make] of Object.entries(overrides)) if (url.includes(part)) return make();
    if (url.includes("/auth/v1/settings")) return new Response("{}", { status: 200 });
    if (url.includes("/rest/v1/business_settings")) return new Response("[]", { status: 200 });
    if (url.includes("solana-devnet")) return Response.json({ result: "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG" });
    if (url.includes("solana-mainnet")) return Response.json({ result: "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d" });
    if (url.startsWith("https://api.jup.ag/swap/v2/order")) return Response.json({ outAmount: "1" });
    if (url.endsWith("/api/v1/customers")) return Response.json({ data: [] });
    throw new Error(`unexpected ${init?.method ?? "GET"} ${url}`);
  });
}

const byName = (results: Result[]) => Object.fromEntries(results.map((r) => [r.name, r]));

describe("verify-credentials script", () => {
  it("passes every check with working credentials and prints no value", async () => {
    const results: Result[] = await checkCredentials(ENV, router());
    expect(results.filter((r) => r.status !== "OK")).toEqual([]);
    const output = JSON.stringify(results);
    for (const [name, value] of Object.entries(ENV)) {
      if (name.endsWith("_URL") && !name.includes("RPC")) continue; // project URLs are not secret
      expect(output).not.toContain(value);
    }
    expect(output).not.toContain("TESTONLYdevnetkey");
    expect(byName(results).JUPITER_API_KEY.fingerprint).toBe(fingerprint(ENV.JUPITER_API_KEY));
  });

  it("reports Supabase's reason when the secret key is refused", async () => {
    const fetchImpl = router({
      "/rest/v1/business_settings": () => Response.json({ message: "Unregistered API key" }, { status: 401 }),
    });
    const r = byName(await checkCredentials(ENV, fetchImpl)).SUPABASE_SERVICE_ROLE_KEY;
    expect(r.status).toBe("FAIL");
    expect(r.detail).toBe("HTTP 401: Unregistered API key");
  });

  it("refuses a publishable key in the service-role slot without calling Supabase", async () => {
    const fetchImpl = router();
    const env = { ...ENV, SUPABASE_SERVICE_ROLE_KEY: "sb_publishable_wrongslot" };
    const r = byName(await checkCredentials(env, fetchImpl)).SUPABASE_SERVICE_ROLE_KEY;
    expect(r.status).toBe("FAIL");
    expect(fetchImpl.mock.calls.some(([url]) => String(url).includes("/rest/v1/"))).toBe(false);
  });

  it("never calls Stables production", async () => {
    const fetchImpl = router();
    const env = { ...ENV, STABLES_API_URL: "https://api.stables.money", STABLES_API_KEY: "sti_live_x" };
    const r = byName(await checkCredentials(env, fetchImpl)).STABLES_API_KEY;
    expect(r.status).toBe("SKIP");
    expect(fetchImpl.mock.calls.some(([url]) => String(url).includes("stables.money"))).toBe(false);
  });

  it("flags a devnet URL that answers for mainnet, and a reused cron secret", async () => {
    const fetchImpl = router({
      "solana-devnet": () => Response.json({ result: "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d" }),
    });
    const env = { ...ENV, CRON_SECRET_PREVIOUS: ENV.CRON_SECRET };
    const results = byName(await checkCredentials(env, fetchImpl));
    expect(results.SOLANA_DEVNET_RPC_URL.status).toBe("FAIL");
    expect(results.CRON_SECRET.status).toBe("FAIL");
  });
});
