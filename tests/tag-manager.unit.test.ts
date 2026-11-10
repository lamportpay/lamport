import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { isAdminArea } from "@/lib/admin-path";
import { googleTagLoaded, reloadWithoutTags } from "@/lib/tag-manager";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : [path];
  });
}

describe("Google Tag Manager is not loaded on the application origin (30 Oct 2026)", () => {
  it("no source file loads the container or gtm.js", () => {
    const offenders = sourceFiles(join(process.cwd(), "src")).filter((path) => {
      const text = readFileSync(path, "utf8");
      return /GTM-[A-Z0-9]{4,}/.test(text) || text.includes("gtm.js") || text.includes("googletagmanager.com/ns.html");
    });
    expect(offenders).toEqual([]);
  });
});

describe("admin pages are never shown in a document where Google's tag code ran", () => {
  it("treats /admin, its sub-pages and the admin sign-in as admin", () => {
    for (const path of ["/admin", "/admin/login", "/admin/payments/123", "/admin/roles", "/admin/stables/x"]) {
      expect(isAdminArea(path)).toBe(true);
    }
    for (const path of ["/", "/pay", "/about", "/administration-guide", "/blog/admin"]) {
      expect(isAdminArea(path)).toBe(false);
    }
  });

  it("detects tag code already running in the document", () => {
    expect(googleTagLoaded({})).toBe(false);
    expect(googleTagLoaded({ dataLayer: [] })).toBe(true);
    expect(googleTagLoaded({ google_tag_manager: {} })).toBe(true);
  });

  it("reloads once into a clean admin page, never in a loop", () => {
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    const assign = vi.fn();
    expect(reloadWithoutTags("/admin", storage, assign, 1_000_000)).toBe(true);
    expect(assign).toHaveBeenCalledWith("/admin");
    expect(reloadWithoutTags("/admin", storage, assign, 1_005_000)).toBe(false);
    expect(assign).toHaveBeenCalledTimes(1);
    expect(reloadWithoutTags("/admin", storage, assign, 1_020_000)).toBe(true);
  });

  it("still reloads when session storage is blocked", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    const assign = vi.fn();
    expect(reloadWithoutTags("/admin/login", blocked, assign)).toBe(true);
    expect(assign).toHaveBeenCalledWith("/admin/login");
  });
});
