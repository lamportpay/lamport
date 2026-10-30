import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildSitemap } from "../src/routes/sitemap[.]xml";
import { POSTS } from "../src/content/blog";
import { NEWS } from "../src/content/news";

describe("public discovery URLs", () => {
  it("uses the published project origin for every sitemap entry", () => {
    const locations = [...buildSitemap().matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
    expect(locations).toHaveLength(16 + POSTS.length + NEWS.length);
    expect(locations).toContain("https://lamportpay.lovable.app/");
    for (const location of locations) {
      expect(new URL(location).origin).toBe("https://lamportpay.lovable.app");
    }
  });

  it("advertises the same sitemap in crawler rules without changing restrictions", () => {
    const robots = readFileSync(new URL("../public/robots.txt", import.meta.url), "utf8");
    expect(robots.match(/^Sitemap: .+$/gm)).toEqual(["Sitemap: https://lamportpay.lovable.app/sitemap.xml"]);
    expect(robots).toContain("Disallow: /admin");
    expect(robots).toContain("Disallow: /api/");
  });

  it("uses only page-specific article dates and omits static-page lastmod", () => {
    const entries = [...buildSitemap().matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => match[1]);
    expect(entries.filter((entry) => !entry.includes("<lastmod>"))).toHaveLength(16);
    for (const post of POSTS) {
      const entry = entries.find((value) => value.includes(`/blog/${post.slug}</loc>`));
      expect(entry).toContain(`<lastmod>${post.updated ?? post.published}</lastmod>`);
    }
    for (const news of NEWS) {
      const entry = entries.find((value) => value.includes(`/news/${news.slug}</loc>`));
      expect(entry).toContain(`<lastmod>${news.published}</lastmod>`);
    }
  });
});