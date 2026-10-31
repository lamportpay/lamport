#!/usr/bin/env node
/**
 * Lovable path guard (remediation R6, 31 Oct 2026). Fails when a pull request from a Lovable
 * branch changes a file outside .github/lovable-allowed-paths.txt (deny by default).
 *
 *   node scripts/check-lovable-paths.mjs <base-ref> [--allowlist <file>]
 *
 * Lists the files the branch changed since it left <base-ref> (`git diff --name-only
 * --no-renames <base>...HEAD`, so a rename counts as both its old and its new path) and prints
 * every file Lovable may not change. CI runs the copy of this script and of the allowlist from
 * the base branch, so a pull request cannot loosen its own check.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const DEFAULT_ALLOWLIST = ".github/lovable-allowed-paths.txt";

/** Glob to an anchored RegExp: `**` any characters, `*` any except `/`; everything else literal. */
export function globToRegExp(glob) {
  let source = "";
  for (let i = 0; i < glob.length; i++) {
    const ch = glob[i];
    if (ch === "*") {
      if (glob[i + 1] === "*") {
        source += ".*";
        i++;
      } else {
        source += "[^/]*";
      }
    } else {
      source += ch.replace(/[\\^$.|?+()[\]{}]/g, "\\$&");
    }
  }
  return new RegExp(`^${source}$`);
}

/** Parses the allowlist into ordered rules ({ allow, pattern, re }). */
export function parseAllowlist(text) {
  const rules = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const allow = !line.startsWith("!");
    const pattern = allow ? line : line.slice(1).trim();
    if (!pattern || pattern.startsWith("/")) {
      throw new Error(`Allowlist pattern must be relative to the repository root: "${line}"`);
    }
    rules.push({ allow, pattern, re: globToRegExp(pattern) });
  }
  return rules;
}

/** True when Lovable may change `path`: the last matching rule allows it. No match = refused. */
export function isAllowed(path, rules) {
  let allowed = false;
  for (const rule of rules) {
    if (rule.re.test(path)) allowed = rule.allow;
  }
  return allowed;
}

/** The paths in `paths` that Lovable may not change. */
export function refusedPaths(paths, rules) {
  return paths.filter((p) => p && !isAllowed(p, rules));
}

function changedFiles(baseRef) {
  const out = execFileSync("git", ["diff", "--name-only", "--no-renames", `${baseRef}...HEAD`], {
    encoding: "utf8",
  });
  return out.split("\n").map((l) => l.trim()).filter(Boolean);
}

function main(argv) {
  const args = [...argv];
  let allowlistPath = DEFAULT_ALLOWLIST;
  const at = args.indexOf("--allowlist");
  if (at !== -1) {
    allowlistPath = args[at + 1];
    args.splice(at, 2);
  }
  const baseRef = args[0];
  if (!baseRef || !allowlistPath) {
    console.error("Usage: node scripts/check-lovable-paths.mjs <base-ref> [--allowlist <file>]");
    return 2;
  }
  const rules = parseAllowlist(readFileSync(allowlistPath, "utf8"));
  const files = changedFiles(baseRef);
  const refused = refusedPaths(files, rules);
  console.log(`Lovable path guard: ${files.length} changed file(s) since ${baseRef}.`);
  if (refused.length === 0) {
    console.log("All are UI files Lovable may change.");
    return 0;
  }
  for (const file of refused) console.error(`NOT ALLOWED for Lovable: ${file}`);
  console.error(
    `${refused.length} file(s) are outside ${DEFAULT_ALLOWLIST}. They need the owner: move the change to a branch that is not lovable/*, or ask the owner to review it.`,
  );
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
