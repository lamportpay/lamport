#!/usr/bin/env node
/**
 * CI dependency audit: `npm audit --omit=dev`, failing on any high or critical
 * advisory except the ones accepted below. Each accepted advisory names why it
 * is accepted; remove it as soon as an upstream fix exists.
 */
import { spawnSync } from "node:child_process";

const ACCEPTED = {
  // Accepted 2026-11-18 (security audit): picomatch <=4.0.7 ReDoS through repeated
  // extglobs. No fixed release exists (4.0.7 is the latest). picomatch is only reached
  // through build tooling (vite, tinyglobby, fdir, the TanStack router/start plugins,
  // micromatch, jest-util) and only matches patterns written in this repository; it is
  // not in the Vercel server function or the browser bundle (checked on the 18 Nov
  // build), so no request input ever reaches it. Remove once a fixed version ships.
  "GHSA-fc5q-39xc-vjpf":
    "picomatch ReDoS: build-time tooling only, repository-controlled patterns, no fix released",
};

const FAIL_ON = new Set(["high", "critical"]);

const r = spawnSync("npm", ["audit", "--omit=dev", "--json"], {
  encoding: "utf8",
  shell: process.platform === "win32",
  maxBuffer: 64 * 1024 * 1024,
});
let report;
try {
  report = JSON.parse(r.stdout);
} catch {
  console.error("npm audit did not return JSON:", (r.stderr || r.stdout || "").slice(0, 2000));
  process.exit(1);
}

const advisories = new Map();
for (const vuln of Object.values(report.vulnerabilities ?? {})) {
  for (const via of vuln.via ?? []) {
    if (typeof via !== "object" || !FAIL_ON.has(via.severity)) continue;
    const id =
      String(via.url ?? "")
        .split("/")
        .pop() || String(via.source);
    advisories.set(id, `${via.severity} ${via.name}: ${via.title} (${via.url})`);
  }
}

let failed = 0;
for (const [id, text] of advisories) {
  if (ACCEPTED[id]) {
    console.log(`accepted  ${id}  ${ACCEPTED[id]}`);
  } else {
    failed++;
    console.log(`FAIL      ${id}  ${text}`);
  }
}
for (const id of Object.keys(ACCEPTED)) {
  if (!advisories.has(id))
    console.log(`note      ${id} no longer reported; remove it from ACCEPTED`);
}
console.log(
  failed
    ? `\n${failed} high/critical advisory(ies) not accepted.`
    : "\nNo unaccepted high or critical advisories.",
);
process.exit(failed ? 1 : 0);
