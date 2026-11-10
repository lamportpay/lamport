import { describe, expect, it } from "vitest";

import { isOwnSiteHost } from "@/lib/identity/wallet-session.server";

const PROD = { NODE_ENV: "production" };

describe("wallet sign-in site check", () => {
  it("accepts LamportPay's own sites", () => {
    for (const h of [
      "lamportpay.com",
      "www.lamportpay.com",
      "1dfad1b7-e30c-4233-9276-65c1ba5b7e9b.lovableproject.com",
      "id-preview--1dfad1b7-e30c-4233-9276-65c1ba5b7e9b.lovable.app",
    ]) {
      expect(isOwnSiteHost(h, PROD)).toBe(true);
    }
  });
  it("accepts the deployment URLs configured on the server", () => {
    expect(isOwnSiteHost("app.lamportpay.com", { ...PROD, LAMPORTPAY_LIVE_URL: "https://app.lamportpay.com" })).toBe(true);
    expect(isOwnSiteHost("test.lamportpay.com", { ...PROD, LAMPORTPAY_TEST_URL: "https://test.lamportpay.com/pay" })).toBe(true);
    expect(isOwnSiteHost("lamport-git-x.vercel.app", { ...PROD, VERCEL_BRANCH_URL: "lamport-git-x.vercel.app" })).toBe(true);
  });
  it("refuses any other site, whatever the request headers say", () => {
    // Before the fix a host named in the request's Origin header was accepted,
    // so a message signed on a look-alike site could be replayed here.
    expect(isOwnSiteHost("evil.example.com", PROD)).toBe(false);
    expect(isOwnSiteHost("test.vercel.app", PROD)).toBe(false);
    expect(isOwnSiteHost("other-project.lovableproject.com", PROD)).toBe(false);
  });
  it("accepts localhost in development only", () => {
    expect(isOwnSiteHost("localhost:8080", { NODE_ENV: "development" })).toBe(true);
    expect(isOwnSiteHost("localhost:8080", PROD)).toBe(false);
  });
});
