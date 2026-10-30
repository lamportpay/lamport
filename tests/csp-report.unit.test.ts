/**
 * POST /api/csp-report (30 Oct 2026): strict validation, an 8 KB body limit, the
 * shared per-IP rate limit, and logs that keep no URL paths, queries or report text.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc } }));

import { CSP_REPORT_MAX_BYTES, parseCspReports } from "@/lib/csp-report.server";
import { resetRateLimits } from "@/lib/payments/rate-limit.server";
import { Route } from "@/routes/api/csp-report";

type Handler = (ctx: { request: Request }) => Promise<Response>;
const post = (Route as unknown as { options: { server: { handlers: { POST: Handler } } } }).options.server.handlers.POST;

const PAGE = "https://lamport.example/admin/payments/5603f512-aaaa-4bbb-8ccc-123456789abc?token=secret#frag";
const legacy = (report: Record<string, unknown>) => JSON.stringify({ "csp-report": report });
const FULL_LEGACY = legacy({
  "document-uri": PAGE,
  referrer: "https://lamport.example/pay?amount=150",
  "violated-directive": "script-src-elem",
  "effective-directive": "script-src-elem",
  "original-policy": "default-src 'self'; report-uri /api/csp-report",
  disposition: "report",
  "blocked-uri": "https://evil.example/steal.js?session=abc",
  "source-file": "https://lamport.example/assets/pay.js",
  "line-number": 12,
  "script-sample": "localStorage.getItem('sb-token')",
  "status-code": 200,
});

function request(body: BodyInit, contentType = "application/csp-report", headers: Record<string, string> = {}) {
  return new Request("https://lamport.example/api/csp-report", {
    method: "POST",
    headers: { "content-type": contentType, "x-real-ip": "203.0.113.7", ...headers },
    body,
  });
}

let warn: ReturnType<typeof vi.spyOn>;
const violationLogs = () =>
  warn.mock.calls.map(([line]) => String(line)).filter((line) => line.includes("csp_violation"));

beforeEach(() => {
  resetRateLimits();
  rpc.mockReset();
  rpc.mockResolvedValue({ data: true, error: null });
  warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("CSP report endpoint", () => {
  it("accepts a report-uri report and logs only the reduced fields", async () => {
    const res = await post({ request: request(FULL_LEGACY) });
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    const logs = violationLogs();
    expect(logs).toHaveLength(1);
    expect(JSON.parse(logs[0]!)).toEqual({
      event: "csp_violation",
      directive: "script-src-elem",
      blocked: "https://evil.example",
      page: "/admin/payments/:id",
      disposition: "report",
    });
    for (const leak of ["token", "secret", "frag", "steal.js", "session", "amount", "sb-token", "pay.js", "5603f512", "original"]) {
      expect(logs[0]).not.toContain(leak);
    }
  });

  it("accepts a Reporting API batch and skips entries that are not CSP violations", async () => {
    const batch = [
      { type: "csp-violation", url: PAGE, body: { documentURL: PAGE, effectiveDirective: "connect-src", blockedURL: "wss://rpc.example:443/socket?key=k", disposition: "report", sample: "x" } },
      { type: "deprecation", body: { id: "x" } },
      { type: "csp-violation", body: { documentURL: "https://lamport.example/news/lamportpay-going-live", effectiveDirective: "style-src-attr", blockedURL: "inline" } },
    ];
    const res = await post({ request: request(JSON.stringify(batch), "application/reports+json") });
    expect(res.status).toBe(204);
    expect(violationLogs().map((l) => JSON.parse(l))).toEqual([
      { event: "csp_violation", directive: "connect-src", blocked: "wss://rpc.example", page: "/admin/payments/:id", disposition: "report" },
      { event: "csp_violation", directive: "style-src-attr", blocked: "inline", page: "/news/lamportpay-going-live", disposition: "enforce" },
    ]);
  });

  it("refuses other content types before the rate limiter or the body", async () => {
    for (const type of ["application/json", "text/plain", "application/x-www-form-urlencoded"]) {
      expect((await post({ request: request(FULL_LEGACY, type) })).status).toBe(415);
    }
    expect(rpc).not.toHaveBeenCalled();
  });

  it("refuses a declared body over 8 KB without reading it or touching the limiter", async () => {
    const res = await post({ request: request(FULL_LEGACY, undefined, { "content-length": String(CSP_REPORT_MAX_BYTES + 1) }) });
    expect(res.status).toBe(413);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("refuses a body that turns out larger than 8 KB whatever its declared length", async () => {
    const big = legacy({ "document-uri": PAGE, "effective-directive": "img-src", "original-policy": "x".repeat(CSP_REPORT_MAX_BYTES) });
    expect((await post({ request: request(big) })).status).toBe(413);
    expect(violationLogs()).toEqual([]);
  });

  it("accepts a body of exactly 8 KB", async () => {
    const base = legacy({ "document-uri": PAGE, "effective-directive": "img-src", "original-policy": "" });
    const exact = legacy({ "document-uri": PAGE, "effective-directive": "img-src", "original-policy": "x".repeat(CSP_REPORT_MAX_BYTES - base.length) });
    expect(new TextEncoder().encode(exact).byteLength).toBe(CSP_REPORT_MAX_BYTES);
    expect((await post({ request: request(exact) })).status).toBe(204);
  });

  it("answers 429 once the shared per-IP limit is used up, without logging the IP", async () => {
    vi.stubEnv("VERCEL", "1"); // the client IP then comes from Vercel's x-real-ip
    rpc.mockResolvedValue({ data: false, error: null });
    const res = await post({ request: request(FULL_LEGACY) });
    expect(res.status).toBe(429);
    expect(rpc).toHaveBeenCalledWith("rate_limit_hit", expect.objectContaining({ p_bucket: "csp-report", p_key: "ip:203.0.113.7", p_limit: 30 }));
    const logged = warn.mock.calls.map(([line]) => String(line)).join("\n");
    expect(logged).not.toContain("203.0.113.7");
    expect(violationLogs()).toEqual([]);
  });

  it("answers 400 to anything that is not a valid CSP report", async () => {
    const bad: Array<[string, string?]> = [
      ["not json"],
      [JSON.stringify({ hello: "world" })],
      [legacy({ "effective-directive": "script-src" })], // no document-uri
      [legacy({ "document-uri": PAGE, "effective-directive": "made-up-directive" })],
      [legacy({ "document-uri": "javascript:alert(1)", "effective-directive": "script-src" })],
      [legacy({ "document-uri": PAGE, "effective-directive": "script-src", disposition: "sometimes" })],
      [legacy({ "document-uri": "x".repeat(3000), "effective-directive": "script-src" })],
      [JSON.stringify([]), "application/reports+json"],
      [JSON.stringify(Array.from({ length: 11 }, () => ({ type: "csp-violation", body: { documentURL: PAGE, effectiveDirective: "img-src" } }))), "application/reports+json"],
      [JSON.stringify([{ type: "deprecation", body: {} }]), "application/reports+json"],
    ];
    for (const [body, type] of bad) {
      expect((await post({ request: request(body, type) })).status, body.slice(0, 60)).toBe(400);
    }
    expect(violationLogs()).toEqual([]);
  });

  it("answers 400 to a body that is not valid UTF-8", async () => {
    expect((await post({ request: request(new Uint8Array([0x7b, 0xff, 0xfe, 0x7d])) })).status).toBe(400);
  });

  it("reduces blocked sources to a keyword, a scheme or a host", () => {
    const blocked = (uri: string) =>
      parseCspReports("application/csp-report", legacy({ "document-uri": "https://lamport.example/", "violated-directive": "img-src 'self'", "blocked-uri": uri }))?.[0]?.blocked;
    expect(blocked("data")).toBe("data");
    expect(blocked("data:image/png;base64,AAAA")).toBe("data");
    expect(blocked("blob:https://lamport.example/1234")).toBe("blob");
    expect(blocked("eval")).toBe("eval");
    expect(blocked("https://user:pass@cdn.example:8443/a/b?c=d")).toBe("https://cdn.example");
    expect(blocked("chrome-extension://abcdef/script.js")).toBe("other");
    expect(blocked("")).toBe("none");
  });
});
