import { describe, expect, it } from "vitest";
import { ANALYTICS_ID, analyticsPath, readCookieChoice } from "../src/lib/analytics-consent";
const now = Date.parse("2026-10-28T12:05:00Z");
const record = (choice: string, version = 2) => JSON.stringify({ choice, version, at: "2026-10-28T12:00:00Z" });
describe("analytics privacy", () => {
  it("uses the authorized measurement ID", () => expect(ANALYTICS_ID).toBe("G-J4DVLBPWRZ"));
  it("requires fresh analytics-aware acceptance", () => {
    expect(readCookieChoice(record("all", 1), now)).toBeNull();
    expect(readCookieChoice(record("all"), now)).toBe("all");
    expect(readCookieChoice(null, now)).toBeNull();
  });
  it("honors essential-only choice", () => expect(readCookieChoice(record("essential"), now)).toBe("essential"));
  it("expires consent after twelve months", () => expect(readCookieChoice(JSON.stringify({ choice: "all", version: 2, at: "2025-10-27T12:00:00Z" }), now)).toBeNull());
  it("never tracks financial, admin, auth or API pages", () => {
    for (const path of ["/pay", "/payments", "/admin", "/auth", "/api/ask-ai", "/news/secret@email.com"]) expect(analyticsPath(path)).toBeNull();
    expect(analyticsPath("/about")).toBe("/about");
  });
});