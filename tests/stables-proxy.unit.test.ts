import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Only the proxy transport is replaced; everything else is the real client.
const undici = vi.hoisted(() => ({
  fetch: vi.fn(),
  ProxyAgent: vi.fn(function (this: { url: string }, url: string) {
    this.url = url;
  }),
}));
vi.mock("undici", () => undici);

import { getStablesConfig } from "@/lib/stables/config.server";
import { getTransfer } from "@/lib/stables/client.server";

const PROXY = "http://user:pass@203.0.113.10:3128";
const config = {
  configured: true as const,
  apiKey: "sti_test_fixture",
  apiUrl: "https://api.sandbox.stables.money",
  environment: "sandbox" as const,
};
const transferJson = () =>
  new Response(JSON.stringify({ id: "tr_1", status: "awaiting_funds_collection" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

beforeEach(() => {
  vi.stubEnv("LAMPORTPAY_MODE", "test");
  vi.stubEnv("STABLES_API_KEY", "sti_test_fixture");
  vi.stubEnv("STABLES_API_URL", "https://api.sandbox.stables.money");
  undici.fetch.mockReset();
  undici.ProxyAgent.mockClear();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("STABLES_PROXY_URL configuration", () => {
  it("is optional: unset means direct calls", () => {
    vi.stubEnv("STABLES_PROXY_URL", "");
    expect(getStablesConfig()).toMatchObject({ configured: true, proxyUrl: null });
  });

  it("accepts an http(s) proxy URL", () => {
    vi.stubEnv("STABLES_PROXY_URL", PROXY);
    expect(getStablesConfig()).toMatchObject({ configured: true, proxyUrl: PROXY });
  });

  it("refuses an invalid value without echoing it (it may hold credentials)", () => {
    for (const bad of ["not a url", "socks5://user:secret@host:1080", "ftp://host"]) {
      vi.stubEnv("STABLES_PROXY_URL", bad);
      const result = getStablesConfig();
      expect(result.configured).toBe(false);
      if (!result.configured) {
        expect(result.reason).toBe("STABLES_PROXY_URL is not a valid http(s) proxy URL.");
        expect(result.reason).not.toContain("secret");
      }
    }
  });
});

describe("Stables calls and the proxy", () => {
  it("go through the proxy when one is configured, never directly", async () => {
    const direct = vi.fn();
    vi.stubGlobal("fetch", direct);
    undici.fetch.mockResolvedValue(transferJson());
    await getTransfer({ ...config, proxyUrl: PROXY }, "tr_1");
    expect(direct).not.toHaveBeenCalled();
    expect(undici.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = undici.fetch.mock.calls[0]!;
    expect(String(url)).toMatch(/^https:\/\/api\.sandbox\.stables\.money\/.*tr_1/);
    expect(init.dispatcher).toBeDefined();
    expect(undici.ProxyAgent).toHaveBeenCalledWith(PROXY);
  });

  it("go directly when no proxy is configured", async () => {
    const direct = vi.fn().mockResolvedValue(transferJson());
    vi.stubGlobal("fetch", direct);
    await getTransfer({ ...config, proxyUrl: null }, "tr_1");
    expect(direct).toHaveBeenCalledTimes(1);
    expect(undici.fetch).not.toHaveBeenCalled();
  });

  it("fail when the proxy fails, with no direct fallback", async () => {
    const direct = vi.fn();
    vi.stubGlobal("fetch", direct);
    undici.fetch.mockRejectedValue(new TypeError("proxy unreachable"));
    await expect(getTransfer({ ...config, proxyUrl: PROXY }, "tr_1")).rejects.toMatchObject({
      message: "Could not reach Stables.",
    });
    expect(direct).not.toHaveBeenCalled();
  });
});
