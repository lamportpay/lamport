/**
 * Deployment and branch guards (31 Oct 2026, remediation R1 and R7):
 * - scripts/vercel-ignore-build.sh decides which Vercel builds run (Production only from main,
 *   Previews only for the integration branch);
 * - vercel.json never lets a Git push deploy main, and auto-deploys only the integration branch;
 * - .githooks/pre-push refuses pushes to main, the integration branch and lovable/legacy.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function ignoreBuild(env: Record<string, string>): "build" | "skip" {
  const r = spawnSync("sh", [join(root, "scripts/vercel-ignore-build.sh")], {
    env: { PATH: process.env.PATH ?? "", ...env },
    encoding: "utf8",
  });
  if (r.status === 0) return "skip";
  if (r.status === 1) return "build";
  throw new Error(`unexpected exit ${r.status}: ${r.stderr}`);
}

function prePush(lines: string[]): number | null {
  const r = spawnSync("sh", [join(root, ".githooks/pre-push"), "origin", "https://github.com/x/y.git"], {
    input: lines.map((l) => `${l}\n`).join(""),
    encoding: "utf8",
  });
  return r.status;
}

const SHA = "a".repeat(40);
const ZERO = "0".repeat(40);

describe("scripts/vercel-ignore-build.sh", () => {
  it.each([
    ["production", "main", "build"],
    ["production", "vercel-preview-migration", "skip"],
    ["production", "lovable/legacy", "skip"],
    ["production", "feat/x", "skip"],
    ["preview", "vercel-preview-migration", "build"],
    ["preview", "main", "skip"],
    ["preview", "lovable/legacy", "skip"],
    ["preview", "feat/x", "skip"],
    ["", "", "skip"],
  ])("VERCEL_ENV=%s ref=%s -> %s", (vercelEnv, ref, expected) => {
    expect(ignoreBuild({ VERCEL_ENV: vercelEnv, VERCEL_GIT_COMMIT_REF: ref })).toBe(expected);
  });

  it("documents the exact Vercel setting, which skips commits that lack the script", () => {
    const script = readFileSync(join(root, "scripts/vercel-ignore-build.sh"), "utf8");
    const setting =
      "if [ -f scripts/vercel-ignore-build.sh ]; then sh scripts/vercel-ignore-build.sh; else exit 0; fi";
    expect(script).toContain(setting);
    expect(setting.length).toBeLessThanOrEqual(256);
    const missing = spawnSync("sh", ["-c", setting], { cwd: join(root, "tests"), encoding: "utf8" });
    expect(missing.status).toBe(0);
  });
});

describe("vercel.json", () => {
  const config = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8")) as {
    git: { deploymentEnabled: Record<string, boolean> };
  };

  it("never deploys main from a Git push and auto-deploys only the integration branch", () => {
    expect(config.git.deploymentEnabled).toEqual({
      "**": false,
      main: false,
      "vercel-preview-migration": true,
    });
  });
});

describe(".githooks/pre-push", () => {
  it.each(["main", "vercel-preview-migration", "lovable/legacy"])("refuses a push to %s", (branch) => {
    expect(prePush([`refs/heads/feat/x ${SHA} refs/heads/${branch} ${ZERO}`])).toBe(1);
  });

  it("allows a feature branch push", () => {
    expect(prePush([`refs/heads/feat/x ${SHA} refs/heads/feat/x ${ZERO}`])).toBe(0);
  });

  it("refuses the whole push when any ref is protected", () => {
    expect(
      prePush([
        `refs/heads/feat/x ${SHA} refs/heads/feat/x ${ZERO}`,
        `refs/heads/main ${SHA} refs/heads/main ${SHA}`,
      ]),
    ).toBe(1);
  });

  it("allows a push with no refs (nothing to send)", () => {
    expect(prePush([])).toBe(0);
  });
});

describe(".github/rulesets", () => {
  const ruleset = (name: string) =>
    JSON.parse(readFileSync(join(root, ".github/rulesets", name), "utf8")) as {
      rules: Array<{ type: string; parameters?: Record<string, unknown> }>;
      bypass_actors: Array<{ bypass_mode: string }>;
    };

  it.each(["main.json", "vercel-preview-migration.json"])(
    "%s blocks deletion and force pushes, requires a pull request with CI, and admins bypass only for pull requests",
    (name) => {
      const r = ruleset(name);
      const types = r.rules.map((x) => x.type);
      expect(types).toEqual(["deletion", "non_fast_forward", "pull_request", "required_status_checks"]);
      const checks = (r.rules[3]!.parameters!.required_status_checks as Array<{ context: string }>).map(
        (c) => c.context,
      );
      expect(checks).toEqual(["checks", "lovable-path-guard"]);
      for (const b of r.bypass_actors) expect(b.bypass_mode).toBe("pull_request");
    },
  );

  it("main also needs the code owner's review", () => {
    expect(ruleset("main.json").rules[2]!.parameters!.require_code_owner_review).toBe(true);
  });
});
