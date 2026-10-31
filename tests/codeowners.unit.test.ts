/**
 * CODEOWNERS and the Lovable allowlist agree (remediation R6, 31 Oct 2026): every tracked file is
 * either a UI file Lovable may change (no code owner) or owned by the owner, never both and never
 * neither. A new file is owned and refused for Lovable until it is listed in both files.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { isAllowed, parseAllowlist } from "../scripts/check-lovable-paths.mjs";

type Entry = { pattern: string; owners: string[] };

const codeowners: Entry[] = readFileSync(join(process.cwd(), ".github/CODEOWNERS"), "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"))
  .map((l) => {
    const [pattern, ...owners] = l.split(/\s+/);
    return { pattern: pattern!, owners };
  });

const rules = parseAllowlist(readFileSync(join(process.cwd(), ".github/lovable-allowed-paths.txt"), "utf8"));

/** GitHub's CODEOWNERS semantics for the three forms the file uses; the last match wins. */
function owners(path: string): string[] {
  let result: string[] = [];
  for (const { pattern, owners: o } of codeowners) {
    const matches =
      pattern === "*" ||
      (pattern.endsWith("/") ? path.startsWith(pattern.slice(1)) : path === pattern.slice(1) || path.startsWith(`${pattern.slice(1)}/`));
    if (matches) result = o;
  }
  return result;
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
const synthetic = [
  "src/lib/new-module.ts",
  "src/routes/api/new-endpoint.ts",
  "src/components/site/NewMarketingSection.tsx",
  "src/components/site/wallet/NewWalletThing.tsx",
  "public/new-image.png",
  "supabase/migrations/20990101000000_new.sql",
  "new-root-file.txt",
];

describe(".github/CODEOWNERS", () => {
  it("uses only `*`, `/exact/path` and `/directory/` patterns and one known owner", () => {
    for (const { pattern, owners: o } of codeowners) {
      expect(pattern === "*" || (pattern.startsWith("/") && !/[*?[\]!\\]/.test(pattern)), pattern).toBe(true);
      for (const owner of o) expect(owner).toBe("@lamportpay");
    }
  });

  it("starts by giving everything to the owner", () => {
    expect(codeowners[0]).toEqual({ pattern: "*", owners: ["@lamportpay"] });
  });

  it("owns exactly the files Lovable may not change", () => {
    const mismatches = [...tracked, ...synthetic].filter((path) => (owners(path).length > 0) === isAllowed(path, rules));
    expect(mismatches).toEqual([]);
  });

  it("owns the payment, wallet, Stables, admin, database, security and deployment files", () => {
    for (const path of [
      "src/lib/payments/fee-math.ts",
      "src/lib/stables/client.server.ts",
      "src/lib/wallet-sign-in.ts",
      "src/routes/api/public/stables-webhook.ts",
      "src/lib/admin-guard.ts",
      "supabase/migrations/20261030140000_ops_alerts.sql",
      "src/lib/security-headers.ts",
      "vite.config.ts",
      "vercel.json",
      ".github/workflows/ci.yml",
      ".github/CODEOWNERS",
      "src/components/site/Layout.tsx",
    ]) {
      expect(owners(path), path).toEqual(["@lamportpay"]);
    }
  });
});
