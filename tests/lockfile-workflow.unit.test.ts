/**
 * Lockfile bot (remediation R5, 31 Oct 2026): it may write only to Lovable branches, never to
 * main, and its write token sits behind actions pinned to commits.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(join(process.cwd(), ".github/workflows/lockfile.yml"), "utf8");
const code = workflow
  .split("\n")
  .filter((l) => !l.trim().startsWith("#"))
  .join("\n");

describe(".github/workflows/lockfile.yml", () => {
  it("runs only for pushes to Lovable branches", () => {
    expect(code).toMatch(/branches: \["lovable\/\*\*", "lovable-sync"\]/);
    expect(code).toContain("if: startsWith(github.ref, 'refs/heads/lovable/') || github.ref == 'refs/heads/lovable-sync'");
    expect(code).not.toMatch(/\bmain\b/);
    expect(code).not.toMatch(/pull_request|workflow_dispatch|schedule/);
  });

  it("grants write access only to the job, not the whole workflow", () => {
    expect(code).toMatch(/^permissions:\n {2}contents: read$/m);
    expect(code).toMatch(/^ {4}permissions:\n {6}contents: write$/m);
  });

  it("pins every action to a full commit SHA", () => {
    const uses = [...code.matchAll(/uses:\s*(\S+)/g)].map((m) => m[1]!);
    expect(uses.length).toBeGreaterThan(0);
    for (const u of uses) expect(u, u).toMatch(/^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/);
  });

  it("pushes back to the branch that triggered it and runs no package scripts", () => {
    expect(code).toContain('git push origin "HEAD:$GITHUB_REF"');
    expect(code).toContain("--ignore-scripts");
  });
});
