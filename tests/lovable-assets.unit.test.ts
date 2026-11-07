import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Images and video imported as "*.asset.json" point at Lovable's asset host
 * ("/__l5e/assets-v1/..."), which only answers on Lovable. Each one the app
 * imports is kept in public/ at the same path (6 Nov 2026), so it also loads on
 * localhost and Vercel; this fails if a new one is added without its file.
 */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe("Lovable-hosted assets are served from public/", () => {
  const imported = new Set<string>();
  for (const file of sources(join(process.cwd(), "src"))) {
    for (const m of readFileSync(file, "utf8").matchAll(
      /from "@\/assets\/([^"]+\.asset\.json)"/g,
    )) {
      imported.add(m[1]!);
    }
  }

  it("finds the imported assets", () => {
    expect(imported.size).toBeGreaterThan(0);
  });

  for (const asset of imported) {
    it(`${asset} has its file at the same path`, () => {
      const meta = JSON.parse(
        readFileSync(join(process.cwd(), "src", "assets", asset), "utf8"),
      ) as { url: string; size: number };
      const file = join(process.cwd(), "public", meta.url);
      expect(existsSync(file)).toBe(true);
      expect(statSync(file).size).toBe(meta.size);
    });
  }
});
