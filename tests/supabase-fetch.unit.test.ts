import { afterEach, describe, expect, it, vi } from "vitest";

import { createSupabaseFetch } from "@/integrations/supabase/fetch";

const KEY = "sb_secret_test_only";
const URL_ = "https://example.supabase.co/rest/v1/business_settings?select=*";

const ok = () => new Response("[]", { status: 200 });
const pgrst303 = (withHeader: boolean) =>
  new Response(JSON.stringify({ code: "PGRST303", message: "JWT issued at future" }), {
    status: 401,
    headers: withHeader ? { "proxy-status": "PostgREST; error=PGRST303" } : {},
  });

function mockFetch(...responses: Response[]) {
  const fn = vi.fn(async () => responses.shift() ?? ok());
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("Supabase fetch", () => {
  it("sends the new key as apikey only, never as a bearer token", async () => {
    const fn = mockFetch(ok());
    await createSupabaseFetch(KEY)(URL_, { headers: { Authorization: `Bearer ${KEY}` } });
    const headers = (fn.mock.calls[0] as unknown as [string, RequestInit])[1].headers as Headers;
    expect(headers.get("apikey")).toBe(KEY);
    expect(headers.get("Authorization")).toBeNull();
  });

  it("keeps a signed-in user's token", async () => {
    const fn = mockFetch(ok());
    await createSupabaseFetch(KEY)(URL_, { headers: { Authorization: "Bearer user-jwt" } });
    const headers = (fn.mock.calls[0] as unknown as [string, RequestInit])[1].headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer user-jwt");
  });

  it("retries once when PostgREST says the token is issued in the future (server header)", async () => {
    const fn = mockFetch(pgrst303(true), ok());
    const res = await createSupabaseFetch(KEY, { retryDelayMs: 0 })(URL_, { method: "GET" });
    expect(res.status).toBe(200);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("recognises PGRST303 from the body when the header is hidden (browser)", async () => {
    const fn = mockFetch(pgrst303(false), ok());
    const body = JSON.stringify({ p_key: "x" });
    const res = await createSupabaseFetch(KEY, { retryDelayMs: 0 })(URL_, { method: "POST", body });
    expect(res.status).toBe(200);
    expect((fn.mock.calls[1] as unknown as [string, RequestInit])[1].body).toBe(body);
  });

  it("retries only once", async () => {
    const fn = mockFetch(pgrst303(true), pgrst303(true), ok());
    const res = await createSupabaseFetch(KEY, { retryDelayMs: 0 })(URL_);
    expect(res.status).toBe(401);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry any other 401", async () => {
    const fn = mockFetch(new Response('{"message":"Unregistered API key"}', { status: 401 }));
    const res = await createSupabaseFetch(KEY, { retryDelayMs: 0 })(URL_);
    expect(res.status).toBe(401);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not retry a body that cannot be sent twice", async () => {
    const fn = mockFetch(pgrst303(true));
    const stream = new ReadableStream({ start: (c) => c.close() });
    const res = await createSupabaseFetch(KEY, { retryDelayMs: 0 })(URL_, {
      method: "POST",
      body: stream,
    });
    expect(res.status).toBe(401);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
