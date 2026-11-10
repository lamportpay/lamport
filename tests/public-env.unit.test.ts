/**
 * Build-time public configuration check (31 Oct 2026, remediation R4): vite.config.ts has no
 * Supabase default any more, and a build that would point browsers at the live (Lovable Cloud)
 * database, at a secret key or at inconsistent projects stops.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { supabaseRefFromUrl, validatePublicEnv } from "@/lib/public-env";
import { DEV_SUPABASE_REF, LIVE_SUPABASE_REF } from "@/lib/supabase-refs";
import * as appMode from "@/lib/app-mode.server";

const base64url = (value: string) =>
  btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
/** A structurally valid JWT with the given role (signature is irrelevant to the check). */
const jwtWithRole = (role: string) =>
  [base64url('{"alg":"HS256","typ":"JWT"}'), base64url(JSON.stringify({ role, iss: "supabase" })), "sig"].join(".");

const PUBLISHABLE = "sb_publishable_" + "testvalue1234";

const dev = (overrides: Record<string, string | undefined> = {}) => ({
  VITE_SUPABASE_URL: `https://${DEV_SUPABASE_REF}.supabase.co`,
  VITE_SUPABASE_PROJECT_ID: DEV_SUPABASE_REF,
  VITE_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE,
  ...overrides,
});

const live = (overrides: Record<string, string | undefined> = {}) =>
  dev({
    VITE_SUPABASE_URL: `https://${LIVE_SUPABASE_REF}.supabase.co`,
    VITE_SUPABASE_PROJECT_ID: LIVE_SUPABASE_REF,
    ...overrides,
  });

describe("validatePublicEnv", () => {
  it("accepts the dev project with a publishable key", () => {
    expect(validatePublicEnv(dev())).toEqual([]);
    expect(validatePublicEnv(dev({ VERCEL_ENV: "preview", LAMPORTPAY_MODE: "test", VITE_LAMPORTPAY_MODE: "test" }))).toEqual([]);
  });

  it("accepts the CI placeholders", () => {
    expect(
      validatePublicEnv({
        VITE_SUPABASE_URL: "https://ciplaceholder0000000.supabase.co",
        VITE_SUPABASE_PROJECT_ID: "ciplaceholder0000000",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_ci_placeholder",
      }),
    ).toEqual([]);
  });

  it("refuses a build with no Supabase values (there is no default)", () => {
    const problems = validatePublicEnv({});
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID");
    expect(problems[0]).toContain("no built-in default");
  });

  it.each(["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PROJECT_ID"])(
    "names %s when only it is missing or blank",
    (name) => {
      expect(validatePublicEnv(dev({ [name]: undefined })).join(" ")).toContain(`Missing ${name}.`);
      expect(validatePublicEnv(dev({ [name]: "   " })).join(" ")).toContain(`Missing ${name}.`);
    },
  );

  it.each([
    `http://${DEV_SUPABASE_REF}.supabase.co`,
    `https://${DEV_SUPABASE_REF}.supabase.co/rest/v1`,
    `https://${DEV_SUPABASE_REF}.supabase.co:8443`,
    `https://${DEV_SUPABASE_REF}.supabase.co?x=1`,
    `https://${DEV_SUPABASE_REF}.supabase.co.example.com`,
    "https://example.com",
    "not a url",
  ])("refuses a malformed project URL: %s", (url) => {
    expect(validatePublicEnv(dev({ VITE_SUPABASE_URL: url })).join(" ")).toContain(
      "VITE_SUPABASE_URL must be https://<project-ref>.supabase.co",
    );
  });

  it("refuses a malformed project ID", () => {
    expect(validatePublicEnv(dev({ VITE_SUPABASE_PROJECT_ID: "short" })).join(" ")).toContain(
      "20-character Supabase project ref",
    );
  });

  it("refuses a URL and project ID that name different projects", () => {
    expect(validatePublicEnv(dev({ VITE_SUPABASE_PROJECT_ID: "abcdefghijklmnopqrst" })).join(" ")).toContain(
      "name different projects",
    );
  });

  it("refuses a server SUPABASE_URL on another project than the browser's", () => {
    expect(
      validatePublicEnv(dev({ SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co" })).join(" "),
    ).toContain("SUPABASE_URL (server) and VITE_SUPABASE_URL (browser)");
    expect(validatePublicEnv(dev({ SUPABASE_URL: `https://${DEV_SUPABASE_REF}.supabase.co` }))).toEqual([]);
  });

  it("accepts a legacy anon JWT", () => {
    expect(validatePublicEnv(dev({ VITE_SUPABASE_PUBLISHABLE_KEY: jwtWithRole("anon") }))).toEqual([]);
  });

  it("refuses secret and service-role keys without printing them", () => {
    const secret = "sb_secret_" + "doNotPrint42";
    const secretProblems = validatePublicEnv(dev({ VITE_SUPABASE_PUBLISHABLE_KEY: secret }));
    expect(secretProblems.join(" ")).toContain("holds a secret key");
    expect(secretProblems.join(" ")).not.toContain(secret);

    const serviceRole = jwtWithRole("service_role");
    const roleProblems = validatePublicEnv(dev({ VITE_SUPABASE_PUBLISHABLE_KEY: serviceRole }));
    expect(roleProblems.join(" ")).toContain("holds a service-role key");
    expect(roleProblems.join(" ")).not.toContain(serviceRole);
  });

  it("refuses anything else as the browser key", () => {
    expect(validatePublicEnv(dev({ VITE_SUPABASE_PUBLISHABLE_KEY: "hunter2" })).join(" ")).toContain(
      "is not a Supabase publishable key",
    );
    expect(validatePublicEnv(dev({ VITE_SUPABASE_PUBLISHABLE_KEY: jwtWithRole("authenticated") })).join(" ")).toContain(
      "is not a Supabase publishable key",
    );
  });

  it("refuses the live database by default", () => {
    expect(validatePublicEnv(live()).join(" ")).toContain("point at the live (Lovable Cloud) database");
    expect(validatePublicEnv(live({ VERCEL_ENV: "production" })).join(" ")).toContain("live (Lovable Cloud)");
    // Only the server variable pointing at it is caught too.
    expect(
      validatePublicEnv(dev({ SUPABASE_URL: `https://${LIVE_SUPABASE_REF}.supabase.co` })).join(" "),
    ).toContain("live (Lovable Cloud)");
  });

  it("allows the live database only for Lovable's own builds (LAMPORTPAY_SHARED_DB=1)", () => {
    expect(validatePublicEnv(live({ LAMPORTPAY_SHARED_DB: "1" }))).toEqual([]);
    expect(validatePublicEnv(live({ LAMPORTPAY_SHARED_DB: "true" })).join(" ")).toContain("live (Lovable Cloud)");
  });

  it("never allows the live database on a Vercel Preview, even with LAMPORTPAY_SHARED_DB=1", () => {
    const problems = validatePublicEnv(live({ VERCEL_ENV: "preview", LAMPORTPAY_SHARED_DB: "1" }));
    expect(problems.join(" ")).toContain("A Vercel Preview must never use the live (Lovable Cloud) database");
  });

  it("refuses different browser and server modes", () => {
    expect(validatePublicEnv(dev({ VITE_LAMPORTPAY_MODE: "live", LAMPORTPAY_MODE: "test" })).join(" ")).toContain(
      "VITE_LAMPORTPAY_MODE (live) and LAMPORTPAY_MODE (test) differ",
    );
    expect(validatePublicEnv(dev({ VITE_LAMPORTPAY_MODE: " TEST ", LAMPORTPAY_MODE: "test" }))).toEqual([]);
    expect(validatePublicEnv(dev({ LAMPORTPAY_MODE: "test" }))).toEqual([]);
  });
});

describe("supabaseRefFromUrl", () => {
  it("reads the ref of a project URL", () => {
    expect(supabaseRefFromUrl(`https://${DEV_SUPABASE_REF}.supabase.co`)).toBe(DEV_SUPABASE_REF);
    expect(supabaseRefFromUrl(`https://${DEV_SUPABASE_REF}.supabase.co/`)).toBe(DEV_SUPABASE_REF);
    expect(supabaseRefFromUrl("https://user:pw@abcdefghijklmnopqrst.supabase.co")).toBeNull();
  });
});

describe("vite.config.ts", () => {
  const config = readFileSync(join(process.cwd(), "vite.config.ts"), "utf8");

  it("holds no Supabase project or key", () => {
    expect(config).not.toContain(LIVE_SUPABASE_REF);
    expect(config).not.toContain(DEV_SUPABASE_REF);
    expect(config).not.toMatch(/sb_publishable_[A-Za-z0-9]/);
    expect(config).not.toMatch(/[a-z0-9]{20}\.supabase\.co/);
    expect(config).not.toContain("PUBLIC_BACKEND_DEFAULTS");
  });

  it("validates the public configuration before building", () => {
    expect(config).toContain("validatePublicEnv(");
    expect(config).toMatch(/if \(configProblems\.length > 0\) \{\s*throw new Error\(/);
  });
});

describe("project refs", () => {
  it("the mode guard and the build check use the same refs", () => {
    expect(appMode.DEV_SUPABASE_REF).toBe(DEV_SUPABASE_REF);
    expect(appMode.LIVE_SUPABASE_REF).toBe(LIVE_SUPABASE_REF);
  });
});
