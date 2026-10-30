import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ANALYTICS_ID, COOKIE_KEY, analyticsPath, readCookieChoice } from "../src/lib/analytics-consent";
import { GoogleAnalytics } from "../src/components/site/GoogleAnalytics";

// GoogleAnalytics is driven without a DOM: its effect runs at once and the page path is set here.
const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useEffect: (effect: () => void) => void effect(),
}));
vi.mock("@tanstack/react-router", () => ({
  useRouterState: ({ select }: { select: (state: { location: { pathname: string } }) => string }) =>
    select({ location: { pathname: route.pathname } }),
}));

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

type FakeWindow = Record<string, unknown> & { gtag?: unknown; dataLayer?: ArrayLike<unknown>[] };

/** Opens `pathname` with the stored cookie choice; returns the window and the scripts added. */
function visit(pathname: string, choice: "all" | "essential" | null) {
  const stored = choice && JSON.stringify({ choice, version: 2, at: new Date().toISOString() });
  const scripts: Array<{ id?: string; async?: boolean; src?: string }> = [];
  const win: FakeWindow = {
    localStorage: { getItem: (key: string) => (key === COOKIE_KEY ? stored : null) },
    location: { origin: "https://lamportpay.example", hostname: "lamportpay.example" },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", { cookie: "", createElement: () => ({}), head: { appendChild: (el: object) => scripts.push(el) } });
  route.pathname = pathname;
  GoogleAnalytics();
  return { win, scripts };
}

afterEach(() => vi.unstubAllGlobals());

describe("Google Analytics loads strictly after consent (30 Oct 2026)", () => {
  it("adds no script and no gtag before the visitor chooses", () => {
    const { win, scripts } = visit("/", null);
    expect(scripts).toEqual([]);
    expect(win.gtag).toBeUndefined();
    expect(win.dataLayer).toBeUndefined();
  });

  it("adds nothing when the visitor keeps essential cookies only", () => {
    const { win, scripts } = visit("/about", "essential");
    expect(scripts).toEqual([]);
    expect(win.gtag).toBeUndefined();
  });

  it("loads gtag.js once the visitor accepts, with advertising signals still denied", () => {
    const { win, scripts } = visit("/about", "all");
    expect(scripts).toEqual([
      expect.objectContaining({ async: true, src: `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}` }),
    ]);
    const calls = (win.dataLayer ?? []).map((args) => Array.from(args));
    expect(calls[0]).toEqual(["consent", "default", expect.objectContaining({ analytics_storage: "denied", ad_storage: "denied" })]);
    expect(calls).toContainEqual(["consent", "update", expect.objectContaining({ analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied" })]);
  });

  it("never loads on payment or admin pages, even with consent", () => {
    for (const path of ["/pay", "/payments", "/admin", "/admin/login"]) {
      const { win, scripts } = visit(path, "all");
      expect(scripts).toEqual([]);
      expect(win.gtag).toBeUndefined();
    }
  });

  it("no other source file puts gtag.js or a gtag bootstrap in the served HTML", () => {
    const files = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => (statSync(join(dir, name)).isDirectory() ? files(join(dir, name)) : [join(dir, name)]));
    const loaders = files(join(process.cwd(), "src")).filter((path) => /googletagmanager\.com\/gtag|gtag\(['"]consent/.test(readFileSync(path, "utf8")));
    expect(loaders.map((path) => path.slice(process.cwd().length + 1))).toEqual(["src/components/site/GoogleAnalytics.tsx"]);
  });
});
