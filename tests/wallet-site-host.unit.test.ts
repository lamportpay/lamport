import { describe, expect, it } from "vitest";

import { isOwnSiteHost } from "@/lib/identity/wallet-session.server";

describe("wallet sign-in site check", () => {
  it("accepts the host the request arrived on", () => {
    expect(isOwnSiteHost("test.vercel.app", { requestOrigin: "https://test.vercel.app" })).toBe(true);
  });
  it("accepts LamportPay's own sites even when a proxy rewrites the origin", () => {
    for (const h of [
      "lamportpay.com",
      "1dfad1b7-e30c-4233-9276-65c1ba5b7e9b.lovableproject.com",
      "id-preview--1dfad1b7-e30c-4233-9276-65c1ba5b7e9b.lovable.app",
    ]) {
      expect(isOwnSiteHost(h, { requestOrigin: "http://localhost:8080" })).toBe(true);
    }
  });
  it("refuses any other site", () => {
    expect(isOwnSiteHost("evil.example.com", { requestOrigin: "https://lamportpay.com" })).toBe(false);
    expect(
      isOwnSiteHost("other-project.lovableproject.com", { requestOrigin: null, requestHosts: [] }),
    ).toBe(false);
  });
});
