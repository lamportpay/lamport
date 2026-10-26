/**
 * Launch-blocker fixes (25 Oct 2026): the early-access fee waiver only trusts a
 * confirmed email, and the public Ask AI endpoint is rate limited per IP before
 * anything is stored.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const upsert = vi.fn();
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { rpc, from: () => ({ upsert }) },
}));

import { waiverIdentityOf } from "@/lib/payments/fee-waiver.server";
import { resetRateLimits, trustedClientIp } from "@/lib/payments/rate-limit.server";
import { Route as AskAiRoute } from "@/routes/api/ask-ai";

type Handler = (ctx: { request: Request }) => Promise<Response>;
const post = (AskAiRoute as unknown as { options: { server: { handlers: { POST: Handler } } } })
  .options.server.handlers.POST;

const WALLET = "7".repeat(32);

describe("early-access waiver identity", () => {
  it("ignores an unconfirmed email", () => {
    expect(waiverIdentityOf({ email: "a@b.co", emailConfirmed: false }, null)).toEqual({
      wallets: [],
      email: null,
    });
    expect(waiverIdentityOf({ email: "a@b.co" }, null).email).toBeNull();
  });

  it("uses a confirmed email", () => {
    expect(waiverIdentityOf({ email: "a@b.co", emailConfirmed: true }, null).email).toBe("a@b.co");
  });

  it("still matches by wallet whatever the email state", () => {
    const id = waiverIdentityOf({ email: "a@b.co", emailConfirmed: false, wallets: [WALLET] }, WALLET);
    expect(id.wallets).toEqual([WALLET, WALLET]);
    expect(id.email).toBeNull();
  });

  it("handles a signed-out visitor", () => {
    expect(waiverIdentityOf(null, null)).toEqual({ wallets: [], email: null });
  });
});

describe("trusted client IP", () => {
  const req = (headers: Record<string, string>) => new Request("https://x.test/", { headers });

  it("on Cloudflare uses cf-connecting-ip and ignores a client-sent x-forwarded-for", () => {
    const r = req({ "cf-connecting-ip": "203.0.113.9", "x-forwarded-for": "1.2.3.4, 203.0.113.9" });
    expect(trustedClientIp(r, {})).toBe("203.0.113.9");
  });

  it("on Vercel ignores a client-sent cf-connecting-ip", () => {
    const r = req({ "cf-connecting-ip": "1.2.3.4", "x-real-ip": "198.51.100.7" });
    expect(trustedClientIp(r, { VERCEL: "1" })).toBe("198.51.100.7");
  });

  it("is 'unknown' when the platform header is missing", () => {
    expect(trustedClientIp(req({ "x-forwarded-for": "1.2.3.4" }), {})).toBe("unknown");
  });
});

describe("/api/ask-ai rate limit", () => {
  beforeEach(() => {
    rpc.mockReset();
    upsert.mockReset();
    resetRateLimits();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  const request = () =>
    new Request("https://lamportpay.test/api/ask-ai", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.9" },
      body: JSON.stringify({
        sessionId: "00000000-0000-4000-8000-000000000000",
        messages: [{ role: "user", text: "My payment failed, contact me at a@b.co" }],
      }),
    });

  it("answers 429 and stores nothing when the limit is reached", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    const res = await post({ request: request() });
    expect(res.status).toBe(429);
    expect(upsert).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith(
      "rate_limit_hit",
      expect.objectContaining({ p_bucket: "ask-ai", p_key: "203.0.113.9", p_limit: 30 }),
    );
  });

  it("stores the chat when allowed", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    upsert.mockResolvedValue({ error: null });
    const res = await post({ request: request() });
    expect(res.status).toBe(200);
    expect(upsert).toHaveBeenCalledTimes(1);
  });
});
