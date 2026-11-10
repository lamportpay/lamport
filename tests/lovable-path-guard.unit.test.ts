/**
 * Lovable path guard (remediation R6, 31 Oct 2026): a pull request from a Lovable branch may
 * change only the UI files in .github/lovable-allowed-paths.txt; everything else is refused.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { globToRegExp, isAllowed, parseAllowlist, refusedPaths } from "../scripts/check-lovable-paths.mjs";

const rules = parseAllowlist(readFileSync(join(process.cwd(), ".github/lovable-allowed-paths.txt"), "utf8"));
const allowed = (path: string): boolean => isAllowed(path, rules);

describe("globToRegExp", () => {
  it("treats * as one path segment and ** as any depth", () => {
    expect(globToRegExp("src/*.css").test("src/styles.css")).toBe(true);
    expect(globToRegExp("src/*.css").test("src/a/styles.css")).toBe(false);
    expect(globToRegExp("public/**").test("public/logos/a/b.svg")).toBe(true);
  });

  it("keeps every other character literal", () => {
    expect(globToRegExp("src/routes/blog.$slug.tsx").test("src/routes/blog.$slug.tsx")).toBe(true);
    expect(globToRegExp("src/routes/blog.$slug.tsx").test("src/routes/blogX$slug.tsx")).toBe(false);
    expect(globToRegExp("src/routes/[.mcp]/x.ts").test("src/routes/[.mcp]/x.ts")).toBe(true);
    expect(globToRegExp("src/routes/[.mcp]/x.ts").test("src/routes/m/x.ts")).toBe(false);
  });
});

describe("parseAllowlist", () => {
  it("skips comments and blank lines, and the last matching rule wins", () => {
    const r = parseAllowlist("# c\n\nsrc/a/**\n!src/a/secret.ts\n");
    expect(isAllowed("src/a/x.tsx", r)).toBe(true);
    expect(isAllowed("src/a/secret.ts", r)).toBe(false);
    expect(isAllowed("src/b.ts", r)).toBe(false);
  });

  it("refuses rooted patterns", () => {
    expect(() => parseAllowlist("/src/a.ts")).toThrow(/relative to the repository root/);
  });
});

describe("the Lovable allowlist", () => {
  it.each([
    "src/routes/index.tsx",
    "src/routes/blog.$slug.tsx",
    "src/routes/faq.tsx",
    "src/components/site/HeroRibbon.tsx",
    "src/components/site/blog/ArticleBody.tsx",
    "src/components/site/NewMarketingSection.tsx",
    "src/components/ui/button.tsx",
    "src/content/news.ts",
    "src/assets/hero.png",
    "src/styles.css",
    "public/logos/partner.svg",
    "src/lib/team.ts",
  ])("lets Lovable change UI file %s", (path) => {
    expect(allowed(path)).toBe(true);
  });

  it.each([
    // payments, fees, Stables, Jupiter, wallet signing, identity
    "src/lib/payments/fee-math.ts",
    "src/lib/payments/service.server.ts",
    "src/lib/stables/client.server.ts",
    "src/lib/jupiter/client.server.ts",
    "src/lib/wallet-sign-in.ts",
    "src/lib/identity/wallet-session.server.ts",
    "src/components/site/wallet/AppWallet.tsx",
    "src/components/site/FeeCalculator.tsx",
    "src/components/site/PaymentReceipt.tsx",
    "src/components/app/PaymentJourney.tsx",
    "src/routes/pay.tsx",
    "src/routes/_authenticated/pay.tsx",
    // API, admin, database, server
    "src/routes/api/payments/index.ts",
    "src/routes/api/new-endpoint.ts",
    "src/routes/admin.login.tsx",
    "src/components/admin/AdminShell.tsx",
    "src/components/site/StablesPaymentsAdmin.tsx",
    "src/lib/admin-guard.ts",
    "src/integrations/supabase/client.ts",
    "supabase/migrations/20261101000000_x.sql",
    "drizzle/migrations/0004_x.sql",
    "src/server.ts",
    "src/routes/[.mcp]/index.ts",
    "src/routes/[.well-known]/oauth-protected-resource.ts",
    "src/routes/mcp.ts",
    "src/components/site/demo-data.ts",
    // security, analytics, scripts in the page, legal, SEO plumbing
    "src/lib/security-headers.ts",
    "src/routes/__root.tsx",
    "src/components/site/Layout.tsx",
    "src/components/site/GoogleAnalytics.tsx",
    "src/components/site/CookieConsent.tsx",
    "src/routes/privacy.tsx",
    "src/routes/terms.tsx",
    "src/lib/seo.ts",
    "src/routes/sitemap[.]xml.ts",
    "public/robots.txt",
    // build, CI, dependencies, scripts, tests, rules, this guard itself
    "vite.config.ts",
    "vercel.json",
    "package.json",
    "package-lock.json",
    "bun.lock",
    ".github/workflows/ci.yml",
    ".github/CODEOWNERS",
    ".github/lovable-allowed-paths.txt",
    "scripts/check-lovable-paths.mjs",
    "tests/public-env.unit.test.ts",
    "CLAUDE.md",
    "AGENTS.md",
    ".env.example",
    // anything new and unknown
    "src/lib/new-module.ts",
    "something-new.txt",
  ])("refuses %s", (path) => {
    expect(allowed(path)).toBe(false);
  });

  it("reports only the refused paths of a change set", () => {
    expect(
      refusedPaths(["src/routes/about.tsx", "src/lib/payments/fee-math.ts", "", "public/favicon.ico"], rules),
    ).toEqual(["src/lib/payments/fee-math.ts"]);
  });
});

describe("CI wiring", () => {
  const ci = readFileSync(join(process.cwd(), ".github/workflows/ci.yml"), "utf8");

  it("runs the guard on pull requests from Lovable branches", () => {
    expect(ci).toContain("lovable-path-guard:");
    expect(ci).toContain("startsWith(github.head_ref, 'lovable/')");
    expect(ci).toContain("github.head_ref == 'lovable-sync'");
  });

  it("uses the base branch's copy of the guard and allowlist, and never interpolates the ref into the shell", () => {
    expect(ci).toMatch(/git show "origin\/\$BASE_REF:scripts\/check-lovable-paths\.mjs"/);
    expect(ci).toMatch(/git show "origin\/\$BASE_REF:\.github\/lovable-allowed-paths\.txt"/);
    expect(ci).toContain("BASE_REF: ${{ github.base_ref }}");
    expect(ci).not.toMatch(/run:[^\n]*\$\{\{\s*github\.(base_ref|head_ref)/);
  });
});
