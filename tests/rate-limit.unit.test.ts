/** Throttle for the public /pay calculator endpoints. */
import { beforeEach, describe, expect, it } from "vitest";

import { allow, clientKey, resetRateLimits } from "@/lib/payments/rate-limit.server";

beforeEach(() => resetRateLimits());

describe("public endpoint rate limit", () => {
  it("allows up to the limit per key and window, then refuses", () => {
    for (let i = 0; i < 3; i++) expect(allow("estimate", "ip:1.2.3.4", 3)).toBe(true);
    expect(allow("estimate", "ip:1.2.3.4", 3)).toBe(false);
    // Other callers and other endpoints are counted separately.
    expect(allow("estimate", "ip:5.6.7.8", 3)).toBe(true);
    expect(allow("holdings", "ip:1.2.3.4", 3)).toBe(true);
  });

  it("opens again after the window", () => {
    expect(allow("estimate", "k", 1, 0)).toBe(true);
    expect(allow("estimate", "k", 1, 0)).toBe(true);
  });

  it("keys by signed-in user, else by the platform-set client IP", () => {
    const cf = new Request("http://x", {
      headers: { "cf-connecting-ip": "203.0.113.9", "x-forwarded-for": "9.9.9.9, 203.0.113.9" },
    });
    expect(clientKey(cf, "user-1", {})).toBe("u:user-1");
    // Cloudflare (Lovable): cf-connecting-ip, never the client-written first XFF entry.
    expect(clientKey(cf, null, {})).toBe("ip:203.0.113.9");
    // Vercel: x-real-ip / x-forwarded-for are set by Vercel; a client cf-connecting-ip is ignored.
    const vercel = new Request("http://x", {
      headers: { "cf-connecting-ip": "1.2.3.4", "x-real-ip": "198.51.100.7" },
    });
    expect(clientKey(vercel, null, { VERCEL: "1" })).toBe("ip:198.51.100.7");
    // Rotating a spoofed x-forwarded-for does not create fresh keys on Cloudflare.
    const spoofA = new Request("http://x", { headers: { "x-forwarded-for": "1.1.1.1" } });
    const spoofB = new Request("http://x", { headers: { "x-forwarded-for": "2.2.2.2" } });
    expect(clientKey(spoofA, null, {})).toBe(clientKey(spoofB, null, {}));
    expect(clientKey(new Request("http://x"), null, {})).toBe("ip:unknown");
  });
});
