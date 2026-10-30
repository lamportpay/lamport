/**
 * Rate-limit refusals never log a client IP (30 Oct 2026). Before, four public routes keyed
 * the limiter by the raw IP and the refusal log took everything before the first ":" as the
 * "key kind": the whole IPv4 address. Now every route uses clientKey(), and the logged kind
 * comes from a fixed set whatever key a caller passes.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { rpc, from: () => ({ insert: vi.fn(), upsert: vi.fn() }) },
}));

import { allowShared, resetRateLimits } from "@/lib/payments/rate-limit.server";
import { Route as AskAiRoute } from "@/routes/api/ask-ai";
import { Route as EarlyAccessRoute } from "@/routes/api/early-access";
import { Route as HealthRoute } from "@/routes/api/solana/health";
import { Route as VerifyTxRoute } from "@/routes/api/solana/verify-tx";

type Handler = (ctx: { request: Request }) => Promise<Response>;
const handler = (route: unknown, method: "GET" | "POST") =>
  (route as { options: { server: { handlers: Record<string, Handler> } } }).options.server.handlers[method]!;

const IP = "198.51.100.23";
let logged: string[];

beforeEach(() => {
  resetRateLimits();
  rpc.mockReset();
  rpc.mockResolvedValue({ data: false, error: null });
  vi.stubEnv("VERCEL", "1"); // the client IP then comes from Vercel's x-real-ip
  logged = [];
  const capture = (...args: unknown[]) => void logged.push(args.map(String).join(" "));
  vi.spyOn(console, "warn").mockImplementation(capture);
  vi.spyOn(console, "error").mockImplementation(capture);
  vi.spyOn(console, "log").mockImplementation(capture);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

const post = (path: string, body: unknown) =>
  new Request(`https://lamport.example${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": IP },
    body: JSON.stringify(body),
  });

describe("public routes key the limiter by clientKey() and never log the IP", () => {
  const cases: Array<[string, string, () => Promise<Response>]> = [
    ["solana-health", "GET /api/solana/health", () =>
      handler(HealthRoute, "GET")({ request: new Request("https://lamport.example/api/solana/health?cluster=devnet", { headers: { "x-real-ip": IP } }) })],
    ["solana-verify-tx", "POST /api/solana/verify-tx", () =>
      handler(VerifyTxRoute, "POST")({ request: post("/api/solana/verify-tx", { signature: "x" }) })],
    ["ask-ai", "POST /api/ask-ai", () =>
      handler(AskAiRoute, "POST")({ request: post("/api/ask-ai", { sessionId: "00000000-0000-4000-8000-000000000000", messages: [] }) })],
    ["early-access", "POST /api/early-access", () =>
      handler(EarlyAccessRoute, "POST")({ request: post("/api/early-access", { name: "Test", email: "test@example.com" }) })],
  ];

  for (const [bucket, name, call] of cases) {
    it(`${name}: 429 with key "ip:…", and the address is in no log line`, async () => {
      const res = await call();
      expect(res.status).toBe(429);
      expect(rpc).toHaveBeenCalledWith("rate_limit_hit", expect.objectContaining({ p_bucket: bucket, p_key: `ip:${IP}` }));
      expect(logged.some((line) => line.includes('"event":"rate_limited"') && line.includes('"key_kind":"ip"'))).toBe(true);
      expect(logged.join("\n")).not.toContain(IP);
    });
  }
});

describe("the refusal log never carries the key itself", () => {
  it("logs a fixed kind for raw IPv4, IPv6 and unknown keys", async () => {
    for (const key of ["203.0.113.9", "2001:db8:85a3::8a2e:370:7334", "unknown"]) {
      await allowShared("any-bucket", key, 1);
    }
    const refusals = logged.filter((line) => line.includes("rate_limited")).map((line) => JSON.parse(line));
    expect(refusals).toEqual([
      { event: "rate_limited", bucket: "any-bucket", key_kind: "other" },
      { event: "rate_limited", bucket: "any-bucket", key_kind: "other" },
      { event: "rate_limited", bucket: "any-bucket", key_kind: "other" },
    ]);
    const all = logged.join("\n");
    for (const leak of ["203.0.113.9", "2001", "db8", "8a2e"]) expect(all).not.toContain(leak);
  });

  it("keeps the kind for keys made by clientKey()", async () => {
    await allowShared("any-bucket", "u:5603f512-aaaa-4bbb-8ccc-123456789abc", 1);
    await allowShared("any-bucket", "ip:203.0.113.9", 1);
    const kinds = logged.filter((line) => line.includes("rate_limited")).map((line) => JSON.parse(line).key_kind);
    expect(kinds).toEqual(["u", "ip"]);
    expect(logged.join("\n")).not.toMatch(/5603f512|203\.0\.113\.9/);
  });
});
