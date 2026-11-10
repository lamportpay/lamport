import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { isAdminSession, requireAdminSession, sessionPassedMfa } from "@/lib/admin-guard";

const rpcReturning = (data: boolean | null, error: unknown = null) => ({
  rpc: vi.fn(async () => ({ data, error })),
});

describe("admin access needs the authenticator step (aal2)", () => {
  it("reads the assurance level from the session's claims", () => {
    expect(sessionPassedMfa({ aal: "aal2" })).toBe(true);
    expect(sessionPassedMfa({ aal: "aal1" })).toBe(false);
    expect(sessionPassedMfa({})).toBe(false);
    expect(sessionPassedMfa(null)).toBe(false);
    expect(sessionPassedMfa("aal2")).toBe(false);
  });

  it("refuses a password-only session of an admin account without asking the database", async () => {
    const supabase = rpcReturning(true);
    await expect(isAdminSession({ supabase, userId: "u1", claims: { aal: "aal1" } })).resolves.toBe(false);
    expect(supabase.rpc).not.toHaveBeenCalled();
    await expect(requireAdminSession({ supabase, userId: "u1", claims: { aal: "aal1" } })).rejects.toThrow(
      "Admin role required.",
    );
  });

  it("accepts an aal2 session only when the database confirms the admin role", async () => {
    const admin = rpcReturning(true);
    await expect(isAdminSession({ supabase: admin, userId: "u1", claims: { aal: "aal2" } })).resolves.toBe(true);
    expect(admin.rpc).toHaveBeenCalledWith("has_role", { _user_id: "u1", _role: "admin" });
    const customer = rpcReturning(false);
    await expect(isAdminSession({ supabase: customer, userId: "u2", claims: { aal: "aal2" } })).resolves.toBe(false);
  });

  it("fails closed when the role cannot be read", async () => {
    const broken = rpcReturning(null, { message: "boom" });
    await expect(isAdminSession({ supabase: broken, userId: "u1", claims: { aal: "aal2" } })).rejects.toThrow(
      "Could not verify admin access.",
    );
  });
});

describe("database: has_role() requires aal2 for the admin role", () => {
  const dir = new URL("../supabase/migrations/", import.meta.url);
  const defining = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .filter((f) => /function public\.has_role/i.test(readFileSync(new URL(f, dir), "utf8")))
    .sort();
  const latest = readFileSync(new URL(defining.at(-1)!, dir), "utf8");

  it("the latest definition is the 9 Nov hygiene migration (empty search_path)", () => {
    expect(defining.at(-1)).toBe("20261109120000_production_schema_hygiene.sql");
    expect(latest).toMatch(/security definer\s+set search_path = ''/);
  });

  it("the latest definition still requires aal2 for admin, keeps self-only and the service role", () => {
    expect(latest).toMatch(/create or replace function public\.has_role\(_user_id uuid, _role public\.app_role\)/);
    expect(latest).toMatch(/_role <> 'admin'::public\.app_role or coalesce\(auth\.jwt\(\) ->> 'aal', ''\) = 'aal2'/);
    expect(latest).toMatch(/_user_id = auth\.uid\(\)/);
    expect(latest).toMatch(/coalesce\(auth\.role\(\), ''\) = 'service_role'/);
    expect(latest).toMatch(/select 1 from public\.user_roles/);
  });
});

describe("every admin server function uses the shared guard", () => {
  it("no server code asks has_role() directly", () => {
    const dir = join(process.cwd(), "src/lib");
    const offenders = readdirSync(dir)
      .filter((f) => f.endsWith(".ts") && f !== "admin-guard.ts")
      .filter((f) => /rpc\("has_role"/.test(readFileSync(join(dir, f), "utf8")));
    expect(offenders).toEqual([]);
  });
});
