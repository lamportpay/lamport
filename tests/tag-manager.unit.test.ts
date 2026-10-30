import { describe, expect, it, vi } from "vitest";

import { isAdminArea } from "@/lib/admin-path";
import { googleTagLoaded, GTM_SNIPPET, reloadWithoutTags, tagManagerAllowed } from "@/lib/tag-manager";

describe("Google Tag Manager is kept off admin pages", () => {
  it("never loads on /admin, its sub-pages or the admin sign-in", () => {
    for (const path of ["/admin", "/admin/login", "/admin/payments/123", "/admin/roles", "/admin/stables/x"]) {
      expect(isAdminArea(path)).toBe(true);
      expect(tagManagerAllowed(path)).toBe(false);
    }
  });

  it("still loads on the marketing site and the app", () => {
    for (const path of ["/", "/pay", "/about", "/administration-guide", "/blog/admin"]) {
      expect(tagManagerAllowed(path)).toBe(true);
    }
  });

  it("uses the same container as before", () => {
    expect(GTM_SNIPPET).toContain("'GTM-M8XDHCH4'");
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
